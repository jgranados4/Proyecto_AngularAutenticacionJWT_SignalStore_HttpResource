import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsuariosService } from '../services/usuarios.service';
import { catchError, map, Observable, of, switchMap, timeout } from 'rxjs';
import { SignalStoreService } from '../services/TokenStore.service';

export const authGuard: CanActivateFn = (route, state) => {
  const tokenStore = inject(SignalStoreService);
  const usuariosService = inject(UsuariosService);
  const router = inject(Router);

  return checkAuthentication(tokenStore, usuariosService, router, state.url);
};

function checkAuthentication(
  tokenStore: SignalStoreService,
  usuariosService: UsuariosService,
  router: Router,
  returnUrl: string
): Observable<boolean> {
  const tokenStatus = tokenStore.tokenStatus();
  console.log(`🔐 Auth Guard: ${tokenStatus} - ${returnUrl}`);

  switch (tokenStatus) {
    case 'valid':
      return of(true);

    case 'validating':
      return waitForValidation(tokenStore, router, returnUrl);

    case 'expired':
      return attemptTokenRefresh(
        tokenStore,
        usuariosService,
        router,
        returnUrl
      );

    case 'no-token':
    case 'error':
    default:
      console.warn(`❌ Redirigiendo a login (${tokenStatus})`);
      return navigateToLogin(router, returnUrl);
  }
}

function waitForValidation(
  tokenStore: SignalStoreService,
  router: Router,
  returnUrl: string
): Observable<boolean> {
  return new Observable<boolean>((subscriber) => {
    let attempts = 0;
    const maxAttempts = 30; // 3s máximo

    const checkInterval = setInterval(() => {
      attempts++;
      const status = tokenStore.tokenStatus();

      if (status === 'valid') {
        console.log('✅ Token validado');
        clearInterval(checkInterval);
        subscriber.next(true);
        subscriber.complete();
      } else if (status !== 'validating' || attempts >= maxAttempts) {
        console.warn(`⚠️ Validación falló: ${status}`);
        clearInterval(checkInterval);
        navigateToLogin(router, returnUrl).subscribe((result) => {
          subscriber.next(result);
          subscriber.complete();
        });
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }).pipe(
    timeout(5000),
    catchError(() => {
      console.error('❌ Timeout en validación');
      return navigateToLogin(router, returnUrl);
    })
  );
}

function attemptTokenRefresh(
  tokenStore: SignalStoreService,
  usuariosService: UsuariosService,
  router: Router,
  returnUrl: string
): Observable<boolean> {
  console.log('🔄 Intentando refresh en guard');

  return usuariosService.RefreshToken().pipe(
    switchMap((refreshResponse) => {
      tokenStore.updateToken(refreshResponse.token);
      tokenStore.updateRefreshToken(refreshResponse.refreshToken);
      tokenStore.reloadTokenData();

      const newStatus = tokenStore.tokenStatus();
      return newStatus === 'valid'
        ? of(true)
        : navigateToLogin(router, returnUrl);
    }),
    timeout(10000),
    catchError((error) => {
      console.error('❌ Refresh falló en guard', error);
      tokenStore.logout();
      return navigateToLogin(router, returnUrl);
    })
  );
}

function navigateToLogin(
  router: Router,
  returnUrl: string
): Observable<boolean> {
  // Evitar loops infinitos
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
