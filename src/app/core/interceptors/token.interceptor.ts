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
  first,
} from 'rxjs';
import { UsuariosService } from '../services/usuarios.service';
import { SignalStoreService } from '../services/TokenStore.service';
import { refreshToken } from '../models/AuthResponse';

// Control de refresh simultáneos
class RefreshTokenState {
  private static isRefreshing = false;
  private static lastRefreshAttempt = 0;
  private static readonly REFRESH_COOLDOWN = 5000;

  static canRefresh(): boolean {
    const now = Date.now();
    return (
      !this.isRefreshing &&
      now - this.lastRefreshAttempt > this.REFRESH_COOLDOWN
    );
  }

  static startRefresh(): void {
    this.isRefreshing = true;
    this.lastRefreshAttempt = Date.now();
  }

  static endRefresh(): void {
    this.isRefreshing = false;
  }

  static isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }
}

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

const createAuthError = (message: string, url: string): HttpErrorResponse =>
  new HttpErrorResponse({
    status: 401,
    statusText: 'No autorizado',
    error: { message },
    url,
  });

const redirectToLogin = (
  tokenStore: SignalStoreService,
  router: Router
): void => {
  tokenStore.logout();
  router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
};

const showAlert = (message: string): void => {
  if (typeof window !== 'undefined') alert(message);
};

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStore = inject(SignalStoreService);
  const router = inject(Router);

  // Endpoints públicos pasan directo
  if (isPublicEndpoint(req.url)) return next(req);

  const token = tokenStore.currentToken();
  const tokenStatus = tokenStore.tokenStatus();

  // Sin token → Login
  if (!token || tokenStatus === 'no-token') {
    console.error('🚫 Token no encontrado');
    redirectToLogin(tokenStore, router);
    return throwError(() => createAuthError('Token no encontrado', req.url));
  }

  // Token expirado → Refresh preventivo
  if (tokenStatus === 'expired') {
    console.warn('⏰ Token expirado - Refresh preventivo');
    return handleTokenRefresh(req, next, tokenStore, router);
  }

  // Token validando → Esperar hasta 2s
  if (tokenStatus === 'validating') {
    console.log('⏳ Esperando validación...');
    let attempts = 0;
    const maxAttempts = 4;

    return timer(0, 500).pipe(
      switchMap(() => {
        attempts++;
        const newStatus = tokenStore.tokenStatus();

        if (newStatus === 'valid') {
          console.log('✅ Token validado');
          return executeRequest(req, next, tokenStore, router);
        }

        if (newStatus === 'expired') {
          return handleTokenRefresh(req, next, tokenStore, router);
        }

        if (newStatus === 'error' || newStatus === 'no-token') {
          console.error(`❌ Error en validación: ${newStatus}`);
          redirectToLogin(tokenStore, router);
          return throwError(() => createAuthError('Token inválido', req.url));
        }

        if (attempts >= maxAttempts) {
          console.error('⏱️ Timeout validación');
          redirectToLogin(tokenStore, router);
          return throwError(() =>
            createAuthError('Timeout validando token', req.url)
          );
        }

        return throwError(() => new Error('CONTINUE_WAITING'));
      }),
      catchError((error) =>
        error.message === 'CONTINUE_WAITING'
          ? throwError(() => error)
          : throwError(() => error)
      ),
      first((result: any) => result !== undefined)
    );
  }

  // Token con error → Login
  if (tokenStatus === 'error') {
    console.error('❌ Token con error de validación');
    redirectToLogin(tokenStore, router);
    return throwError(() => createAuthError('Token inválido', req.url));
  }

  // Token válido → Ejecutar request
  return executeRequest(req, next, tokenStore, router);
};

function executeRequest(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenStore: SignalStoreService,
  router: Router
): Observable<HttpEvent<unknown>> {
  const clonedReq = req.clone({
    setHeaders: { Authorization: `Bearer ${tokenStore.currentToken()}` },
  });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && RefreshTokenState.canRefresh()) {
        console.warn('🔄 Error 401 - Intentando refresh');
        return handleTokenRefresh(req, next, tokenStore, router);
      }
      return throwError(() => error);
    })
  );
}

function handleTokenRefresh(
  originalReq: HttpRequest<unknown>,
  next: HttpHandlerFn,
  tokenStore: SignalStoreService,
  router: Router
): Observable<HttpEvent<unknown>> {
  if (RefreshTokenState.isCurrentlyRefreshing()) {
    console.log('⏳ Refresh en progreso');
    return throwError(() =>
      createAuthError('Refresh en progreso', originalReq.url)
    );
  }

  const refreshTokenValue = tokenStore.currentRefreshToken();
  if (!refreshTokenValue?.trim()) {
    console.error('❌ Refresh token no disponible');
    redirectToLogin(tokenStore, router);
    return throwError(() =>
      createAuthError('Refresh token no disponible', originalReq.url)
    );
  }

  console.log('🔄 Iniciando refresh token');
  RefreshTokenState.startRefresh();

  const usuariosService = inject(UsuariosService);

  return usuariosService.RefreshToken().pipe(
    retry({
      count: 2,
      delay: (error: HttpErrorResponse, retryCount) => {
        console.warn(`⚠️ Retry ${retryCount}`);
        return timer(1000 * retryCount);
      },
    }),
    switchMap((resp: refreshToken) => {
      console.log('✅ Token refreshed');
      tokenStore.updateToken(resp.token);
      tokenStore.updateRefreshToken(resp.refreshToken);

      const retryReq = originalReq.clone({
        setHeaders: { Authorization: `Bearer ${resp.token}` },
      });

      return next(retryReq);
    }),
    catchError((refreshError: HttpErrorResponse) => {
      console.error('❌ Refresh falló');

      if (refreshError.status === 401) {
        const errorMsg = refreshError.error?.message || '';
        if (errorMsg.includes('revocado') || errorMsg.includes('inválido')) {
          showAlert('🚨 Sesión expirada. Inicia sesión nuevamente.');
        } else {
          showAlert('⚠️ Sesión inválida. Redirigiendo...');
        }
      } else if (refreshError.status === 0) {
        showAlert('❌ Error de conexión. Verifica tu internet.');
      }

      redirectToLogin(tokenStore, router);
      return throwError(() => refreshError);
    }),
    finalize(() => {
      console.log('🏁 Finalizando refresh');
      RefreshTokenState.endRefresh();
    })
  );
}
