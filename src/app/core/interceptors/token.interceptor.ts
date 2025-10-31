import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  finalize,
  Observable,
  switchMap,
  throwError,
  tap,
} from 'rxjs';
import { SignalStoreService } from '../services/TokenStore.service';
import { refreshToken } from '../models/AuthResponse';

/**
 * ✅ Observable compartido para evitar múltiples refreshes simultáneos
 * Se resetea a null después de completarse
 */
let refreshObservable: Observable<refreshToken> | null = null;

const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/UsuarioAUs/login',
  '/UsuarioAUs/',
  '/login',
  '/register',
  '/DecodeToken',
  '/RefreshToken',
  '/public/',
];

const isPublicEndpoint = (url: string): boolean =>
  PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));

/**
 * ✅ INTERCEPTOR CONFIGURADO PARA LOGOUT DIRECTO (Sin auto-refresh preventivo)
 *
 * Funcionalidad:
 * 1. ❌ Auto-refresh preventivo DESACTIVADO (comentado para uso futuro)
 * 2. ✅ Token expirado → Logout inmediato
 * 3. ✅ Error 401 → Refresh manual + retry (solo si hay refreshToken válido)
 * 4. ✅ Evita refreshes concurrentes con Observable compartido
 *
 * NOTA: Para habilitar auto-refresh preventivo, descomenta la sección marcada
 */
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(SignalStoreService);

  // ✅ 1. Endpoints públicos pasan sin autenticación
  if (isPublicEndpoint(req.url)) {
    return next(req);
  }

  const token = tokenStore.currentToken();
  const tokenStatus = tokenStore.tokenStatus();

  // ✅ 2. Sin token → Logout inmediato
  if (!token || tokenStatus === 'no-token') {
    console.warn('🚫 Request sin token autenticado - cerrando sesión');
    tokenStore.logoutAndNavigate();
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'No autorizado - Sin token',
          url: req.url,
        })
    );
  }

  // ✅ 3. Token validando → Esperar validación
  if (tokenStatus === 'validating') {
    console.log('⏳ Token validando, esperando...');
    return waitForTokenValidation(req, next, tokenStore);
  }

  // ✅ 4. Token expirado → LOGOUT DIRECTO (sin intentar refresh)
  if (tokenStatus === 'expired') {
    console.warn('⏰ Token expirado - cerrando sesión');
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'Token expirado',
          url: req.url,
        })
    );
  }

  // ========================================================================
  // ❌ AUTO-REFRESH PREVENTIVO DESACTIVADO
  // ========================================================================
  // Para habilitar refresh automático antes de expiración, descomenta:
  /*
  // ✅ 5. AUTO-REFRESH PREVENTIVO (Si el token expira en < 3 minutos)
  if (tokenStore.needsRefreshSoon() && tokenStore.canRefreshNow()) {
    const segundosRestantes = tokenStore.tiempoRestanteSegundos();
    const minutosRestantes = Math.floor(segundosRestantes / 60);
    
    console.warn(
      `⚠️ Token expirará en ${minutosRestantes}m ${segundosRestantes % 60}s - refresh preventivo`
    );
    
    // Hacer refresh en paralelo pero NO bloquear el request actual
    triggerPreventiveRefresh(tokenStore);
  }
  */
  // ========================================================================

  // ✅ 6. Token válido → Request normal
  const clonedReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Error 401 → Intentar refresh SOLO si hay refreshToken válido
      // (esto cubre casos donde el backend rechaza el token pero aún no expiró localmente)
      if (error.status === 401) {
        const hasRefreshToken = !!tokenStore.currentRefreshToken();

        if (hasRefreshToken) {
          console.warn('❌ Usted no tiene Autorizacion redirigir login');
          tokenStore.logoutAndNavigate();
        } else {
          console.error('❌ 401 sin refresh token - cerrando sesión');
          tokenStore.logoutAndNavigate();
          return throwError(() => error);
        }
      }

      return throwError(() => error);
    })
  );
};

// ========================================================================
// ❌ FUNCIÓN DE REFRESH PREVENTIVO COMENTADA (Para uso futuro)
// ========================================================================
/*
function triggerPreventiveRefresh(tokenStore: SignalStoreService): void {
  // Si ya hay refresh en progreso, no hacer nada
  if (tokenStore.isRefreshing() || refreshObservable) {
    return;
  }

  // Respetar cooldown de 30 segundos
  if (!tokenStore.canRefreshNow()) {
    console.log('⏭️ Cooldown activo, refresh pospuesto');
    return;
  }

  console.log('🔄 Iniciando refresh preventivo en background...');
  
  executeTokenRefresh(tokenStore).subscribe({
    next: () => {
      console.log('✅ Refresh preventivo completado');
    },
    error: (error) => {
      console.error('❌ Error en refresh preventivo:', error);
      
      // Si el refresh preventivo falla por 401, cerrar sesión
      if (error.status === 401) {
        tokenStore.logoutAndNavigate();
      }
    },
  });
}
*/
// ========================================================================

/**
 * ✅ Espera a que el token termine de validarse
 */
function waitForTokenValidation(
  originalReq: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenStore: SignalStoreService
): Observable<HttpEvent<unknown>> {
  return new Observable<HttpEvent<unknown>>((subscriber) => {
    let attempts = 0;
    const maxAttempts = 50; // 5 segundos máximo (50 * 100ms)
    const intervalMs = 100;

    const checkInterval = setInterval(() => {
      attempts++;
      const status = tokenStore.tokenStatus();

      // Token válido → Proceder con el request
      if (status === 'valid') {
        clearInterval(checkInterval);
        const validToken = tokenStore.currentToken();

        if (!validToken) {
          subscriber.error(
            new HttpErrorResponse({
              status: 401,
              statusText: 'Token no disponible después de validación',
            })
          );
          return;
        }

        const clonedReq = originalReq.clone({
          setHeaders: { Authorization: `Bearer ${validToken}` },
        });

        next(clonedReq).subscribe(subscriber);
        return;
      }
      // Token con error o timeout → Logout
      if (
        status === 'no-token' ||
        attempts >= maxAttempts
      ) {
        clearInterval(checkInterval);
        console.error(`❌ Validación falló: ${status}`);
        subscriber.error(
          new HttpErrorResponse({
            status: 401,
            statusText: `Validación timeout/error: ${status}`,
            url: originalReq.url,
          })
        );
        return
      }
    }, intervalMs);
    return () => clearInterval(checkInterval);
  });
}

/**
 * ✅ Maneja el refresh del token cuando recibe 401 (refresh manual)
 * Solo se ejecuta si hay un error 401 del backend, NO preventivamente
 */
function handleTokenRefresh(
  originalReq: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenStore: SignalStoreService
): Observable<HttpEvent<unknown>> {
  // Ya hay refresh en progreso → Esperar al mismo Observable
  if (refreshObservable) {
    console.log('⏳ Esperando refresh en progreso...');
    return refreshObservable.pipe(
      switchMap((resp: refreshToken) => {
        const retryReq = originalReq.clone({
          setHeaders: { Authorization: `Bearer ${resp.token}` },
        });
        return next(retryReq);
      }),
      catchError((error) => {
        // Si el refresh falló, propagar el error
        return throwError(() => error);
      })
    );
  }

  // Verificar que tenemos refresh token
  const refreshTokenValue = tokenStore.currentRefreshToken();
  if (!refreshTokenValue) {
    console.error('❌ No hay refresh token disponible');
    tokenStore.logoutAndNavigate();
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'Refresh token no disponible',
          url: originalReq.url,
        })
    );
  }

  // Respetar cooldown
  if (!tokenStore.canRefreshNow()) {
    console.warn('⏭️ Cooldown activo - cerrando sesión');
    tokenStore.logoutAndNavigate();
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'Cooldown de refresh activo',
          url: originalReq.url,
        })
    );
  }

  // Iniciar nuevo refresh con Observable compartido
  console.log('🔄 Iniciando refresh manual por 401...');
  refreshObservable = executeTokenRefresh(tokenStore);

  // Ejecutar refresh y reintentar request original
  return refreshObservable.pipe(
    switchMap((resp: refreshToken) => {
      console.log('✅ Token refrescado, reintentando request');
      const retryReq = originalReq.clone({
        setHeaders: { Authorization: `Bearer ${resp.token}` },
      });
      return next(retryReq);
    }),
    catchError((refreshError: HttpErrorResponse) => {
      console.error('❌ Refresh manual falló - cerrando sesión');
      tokenStore.logoutAndNavigate();
      return throwError(() => refreshError);
    })
  );
}

/**
 * ✅ Ejecuta el refresh del token y actualiza el store
 */
function executeTokenRefresh(
  tokenStore: SignalStoreService
): Observable<refreshToken> {
  // Marcar que estamos haciendo refresh
  tokenStore.startRefreshing();

  return tokenStore.RefreshToken().pipe(
    tap((resp: refreshToken) => {
      // Actualizar tokens en el store
      tokenStore.updateToken(resp.token);
      tokenStore.updateRefreshToken(resp.refreshToken);
      tokenStore.reloadTokenData();
      console.log('✅ Tokens actualizados en store');
    }),
    catchError((refreshError: HttpErrorResponse) => {
      console.error('❌ Error al refrescar token:', refreshError);

      // Refresh token inválido/revocado → Cerrar sesión
      if (refreshError.status === 401) {
        const errorMsg = refreshError.error?.message || '';

        if (errorMsg.includes('revocado') || errorMsg.includes('inválido')) {
          alert('🚨 Tu sesión ha expirado. Inicia sesión nuevamente.');
        }

        tokenStore.logoutAndNavigate();
      }

      return throwError(() => refreshError);
    }),
    finalize(() => {
      // Limpiar estado de refresh
      tokenStore.finishRefreshing();
      refreshObservable = null;
      console.log('🔄 Proceso de refresh finalizado');
    })
  );
}
