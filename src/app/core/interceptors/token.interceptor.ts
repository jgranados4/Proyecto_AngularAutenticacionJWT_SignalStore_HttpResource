import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  Observable,
  switchMap,
  throwError,
  timer,
  retry,
} from 'rxjs';
import { UsuariosService } from '../services/usuarios.service';
import { SignalStoreService } from '../services/TokenStore.service';
import { refreshToken } from '../models/AuthResponse';

// ✅ Flag global simple para evitar múltiples refresh simultáneos
let isRefreshing = false;

const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/UsuarioAUs/login',
  '/UsuarioAUs/register',
  '/login',
  '/register',
  '/DecodeToken',
  '/RefreshToken',
  '/public/',
];

const isPublicEndpoint = (url: string): boolean =>
  PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(SignalStoreService);
  const router = inject(Router);

  console.log(`📡 Request: ${req.method} ${req.url}`);

  // ✅ 1. ENDPOINTS PÚBLICOS - Pasan sin modificación
  if (isPublicEndpoint(req.url)) {
    console.log(`✅ Endpoint público permitido`);
    return next(req);
  }

  // ✅ 2. ENDPOINTS PROTEGIDOS - Requieren token
  console.log(`🔐 Endpoint protegido - Validando token`);

  const token = tokenStore.currentToken();

  // Verificar existencia del token
  if (!token || token.trim() === '') {
    console.error(`🚫 Token no encontrado`);
    tokenStore.logout();
    router.navigate(['/login']);
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'No autorizado - Token no encontrado',
          url: req.url,
        })
    );
  }

  // Verificar estado del token
  const tokenStatus = tokenStore.tokenStatus();
  console.log(`📊 Estado del token: ${tokenStatus}`);

  // Si el token está expirado, intentar refresh antes de hacer la petición
  if (tokenStatus === 'expired') {
    console.warn(`⏰ Token expirado - Iniciando refresh`);

    if (!isRefreshing) {
      return handleTokenRefresh(req, next, tokenStore, router);
    } else {
      console.log(`⏳ Refresh en progreso, reintentando...`);
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Token refresh en progreso',
          })
      );
    }
  }

  // ✅ Clonar request con Authorization header
  const clonedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(`🚀 Enviando request con token`);

  // ✅ Ejecutar request y manejar errores 401
  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`❌ Error ${error.status}: ${error.message}`);

      // Solo intentar refresh en errores 401 y si no estamos ya refreshing
      if (error.status === 401 && !isRefreshing) {
        console.warn(`🔄 Error 401 - Intentando refresh token`);
        return handleTokenRefresh(req, next, tokenStore, router);
      }

      // Para otros errores o si ya estamos refreshing, propagar error
      return throwError(() => error);
    })
  );
};

/**
 * 🔄 Maneja el refresh del token de forma centralizada
 */
function handleTokenRefresh(
  originalReq: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenStore: SignalStoreService,
  router: Router
): Observable<HttpEvent<unknown>> {
  console.log(`🔄 Iniciando proceso de refresh token`);
  isRefreshing = true;

  const refreshTokenValue = tokenStore.currentRefreshToken();

  if (!refreshTokenValue || refreshTokenValue.trim() === '') {
    console.error(`❌ Refresh token no encontrado`);
    isRefreshing = false;
    tokenStore.logout();
    router.navigate(['/login']);
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'Refresh token no disponible',
        })
    );
  }

  console.log(`✅ Refresh token encontrado, llamando endpoint...`);

  const usuariosService = inject(UsuariosService);

  // Llamar al endpoint de refresh con retry
  return usuariosService.RefreshToken().pipe(
    switchMap((resp: refreshToken) => {
      console.log(`✅ Token refreshed exitosamente`);

      // Actualizar tokens
      tokenStore.updateToken(resp.token);
      tokenStore.updateRefreshToken(resp.refreshToken);

      console.log(`🔄 Reintentando request original con nuevo token`);

      // Reintentar request original con nuevo token
      const retryReq = originalReq.clone({
        setHeaders: {
          Authorization: `Bearer ${resp.token}`,
        },
      });

      return next(retryReq);
    }),
    catchError((refreshError: HttpErrorResponse) => {
      console.error(`❌ Refresh token falló:`, refreshError);

      // Manejar caso de tokens revocados
      if (refreshError.status === 401) {
        const errorMsg = refreshError.error?.message || '';

        if (errorMsg.includes('revocado') || errorMsg.includes('inválido')) {
          alert(
            '🚨 Tu sesión ha expirado o fue revocada. Por favor, inicia sesión nuevamente.'
          );
        }
      }
      // Limpiar estado y redirigir a login
      tokenStore.logout();
      router.navigate(['/login']);

      return throwError(() => refreshError);
    }),
    finalize(() => {
      console.log(`🏁 Finalizando proceso de refresh`);
      isRefreshing = false;
    })
  );
}
