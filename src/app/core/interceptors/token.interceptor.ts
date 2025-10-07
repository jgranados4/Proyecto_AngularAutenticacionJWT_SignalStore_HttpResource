import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { UsuariosService } from '../services/usuarios.service';
import { catchError, finalize, Observable, switchMap, throwError } from 'rxjs';
import { refreshToken } from '../models/AuthResponse';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { SignalStoreService } from '../services/TokenStore.service';

// ✅ Flag global para evitar múltiples refresh simultáneos
let isRefreshing = false;

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const cookies = inject(CookieService);
  const usuarios = inject(SignalStoreService);
  const refrescar = inject(UsuariosService);
  const router = inject(Router);
  const token = usuarios.currentToken();

  // 🔥 ENDPOINTS PÚBLICOS (sin autenticación)
  const publicEndpoints = [
    '/auth/login',
    '/auth/register',
    '/UsuarioAUs/login',
    '/UsuarioAUs/register',
    '/login',
    '/register',
    '/DecodeToken',
    '/RefreshToken',
  ];

  // ✅ Verificar si es endpoint público
  const isPublicEndpoint = publicEndpoints.some((endpoint) =>
    req.url.includes(endpoint)
  );

  console.log(`📡 Request: ${req.method} ${req.url}`);
  console.log(`🔍 Es público: ${isPublicEndpoint}`);

  // ✅ 1. ENDPOINTS PÚBLICOS - Pasan sin modificación
  if (isPublicEndpoint) {
    console.log(`✅ Endpoint público permitido`);
    return next(req);
  }

  // ✅ 2. ENDPOINTS PROTEGIDOS - Requieren token válido
  console.log(`🔐 Endpoint protegido - Validando token`);

  // Verificar existencia del token
  if (!token || token.trim() === '') {
    console.error(`🚫 Token no encontrado`);
    usuarios.logout();
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
  const tokenStatus = usuarios.tokenStatus();
  console.log(`📊 Estado del token: ${tokenStatus}`);

  // Si el token está expirado, intentar refresh antes de hacer la petición
  if (tokenStatus === 'expired') {
    console.warn(`⏰ Token expirado - Iniciando refresh`);

    if (!isRefreshing) {
      return handleTokenRefresh(req, next, usuarios, refrescar, router);
    } else {
      // Si ya está refreshing, esperar y reintentar
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
        return handleTokenRefresh(req, next, usuarios, refrescar, router);
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
  usuarios: SignalStoreService,
  refrescar: UsuariosService,
  router: Router
): Observable<HttpEvent<unknown>> {
  console.log(`🔄 Iniciando proceso de refresh token`);
  isRefreshing = true;
  const refreshTokenValue = usuarios.currentRefreshToken();

  if (!refreshTokenValue || refreshTokenValue.trim() === '') {
    console.error(`❌ Refresh token no encontrado en cookies`);
    isRefreshing = false;
    usuarios.logout();
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

  // Llamar al endpoint de refresh
  return refrescar.RefreshToken().pipe(
    switchMap((resp: refreshToken) => {
      console.log(`✅ Token refreshed exitosamente`);
      // Actualizar tokens
      usuarios.updateToken(resp.token);
      usuarios.updateRefreshToken(resp.refreshToken);
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

        if (errorMsg.includes('revocados') || errorMsg.includes('inválido')) {
          alert(
            '🚨 Tu sesión ha expirado o fue revocada. Por favor, inicia sesión nuevamente.'
          );
        }
      }

      // Limpiar estado y redirigir a login
      usuarios.logout();
      router.navigate(['/login']);

      return throwError(() => refreshError);
    }),
    finalize(() => {
      console.log(`🏁 Finalizando proceso de refresh`);
      isRefreshing = false;
    })
  );
}
