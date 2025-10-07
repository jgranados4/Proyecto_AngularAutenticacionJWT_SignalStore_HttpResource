import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsuariosService } from '../services/usuarios.service';
import { catchError, map, Observable, of, switchMap, timeout } from 'rxjs';
import { SignalStoreService } from '../services/TokenStore.service';
export const authGuard: CanActivateFn = (route, state) => {
  const Usuario = inject(SignalStoreService);
  const refrescar = inject(UsuariosService);
  const router = inject(Router);
  return checkAuthentication(Usuario, refrescar, router, state.url);
};
function checkAuthentication(
  usuariosService: SignalStoreService,
  refrescar: UsuariosService,
  router: Router,
  returnUrl: string
): Observable<boolean> {
  const tokenStatus = usuariosService.tokenStatus();
  console.log(`🔐 Auth Guard - Estado: ${tokenStatus} - URL: ${returnUrl}`);
  // Casos donde no se permite acceso
  switch (tokenStatus) {
    case 'valid':
      // ✅ Token válido, permitir acceso inmediatamente
      return of(true);

    case 'validating':
      // ⏳ Esperar validación con timeout para evitar bloqueos
      return waitForValidation(usuariosService, router, returnUrl);

    case 'expired':
      // 🔄 Intentar refresh automático
      return attemptTokenRefresh(usuariosService, refrescar, router, returnUrl);

    case 'no-token':
    case 'error':
    default:
      // 🚫 Sin token o error, redirigir a login
      console.warn(`❌ Auth Guard - Redirigiendo a login (${tokenStatus})`);
      return navigateToLogin(router, returnUrl);
  }
}

function waitForValidation(
  usuariosService: SignalStoreService,
  router: Router,
  returnUrl: string
): Observable<boolean> {
  return new Observable<boolean>((subscriber) => {
    let attempts = 0;
    const maxAttempts = 30; // 3 segundos máximo (30 * 100ms)

    const checkInterval = setInterval(() => {
      attempts++;
      const status = usuariosService.tokenStatus();

      if (status === 'valid') {
        console.log('✅ Token validado correctamente');
        clearInterval(checkInterval);
        subscriber.next(true);
        subscriber.complete();
      } else if (status !== 'validating' || attempts >= maxAttempts) {
        // Token cambió a otro estado o timeout
        console.warn(`⚠️ Validación falló o timeout (${status})`);
        clearInterval(checkInterval);

        navigateToLogin(router, returnUrl).subscribe((result) => {
          subscriber.next(result);
          subscriber.complete();
        });
      }
    }, 100);

    // Cleanup al cancelar la suscripción
    return () => clearInterval(checkInterval);
  }).pipe(
    timeout(5000), // Timeout absoluto de 5 segundos
    catchError(() => {
      console.error('❌ Timeout en validación de token');
      return navigateToLogin(router, returnUrl);
    })
  );
}

function attemptTokenRefresh(
  usuariosService: SignalStoreService,
  refrescar: UsuariosService,
  router: Router,
  returnUrl: string
): Observable<boolean> {
  return refrescar.RefreshToken().pipe(
    switchMap((refreshResponse) => {
      // Actualizar token exitosamente
      usuariosService.updateToken(refreshResponse.token);
      usuariosService.reload();

      // Verificar que el nuevo token sea válido
      const newStatus = usuariosService.tokenStatus();

      if (newStatus === 'valid') {
        return of(true);
      } else {
        return navigateToLogin(router, returnUrl);
      }
    }),
    timeout(10000),
    catchError((error) => {
      console.error('Error al refrescar token:', error);
      usuariosService.logout();
      return navigateToLogin(router, returnUrl);
    })
  );
}

function navigateToLogin(
  router: Router,
  returnUrl: string
): Observable<boolean> {
  // ✅ Evitar loops infinitos: no redirigir si ya estamos en login
  if (returnUrl.includes('/login') || returnUrl.includes('/Registrar')) {
    return of(false);
  }
  console.log(`🚪 Redirigiendo a login (returnUrl: ${returnUrl})`);
  return of(
    router.navigate(['/login'], {
      queryParams: { returnUrl },
      replaceUrl: true,
    })
  ).pipe(map(() => false));
}
