import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { SignalStoreService } from '../services/TokenStore.service';

/**
 * 🛡️ Auth Guard - Valida acceso a rutas protegidas
 * El interceptor maneja el refresh automático
 */
export const authGuard: CanActivateFn = (route, state) => {
  const tokenStore = inject(SignalStoreService);
  const tokenStatus = tokenStore.tokenStatus();
  const returnUrl = state.url;

  console.log(`🛡️ Guard: Estado="${tokenStatus}" - Ruta="${returnUrl}"`);

  // Token válido → Acceso inmediato
  if (tokenStatus === 'valid') {
    return true;
  }

  // Token expirado → El interceptor manejará el refresh en el primer request
  if (tokenStatus === 'expired') {
    console.log('⏰ Token expirado - interceptor manejará refresh');
    return true;
  }

  // Sin token o error → Redirigir a login
  if (tokenStatus === 'no-token') {
    console.warn(`🚫 Sin autenticación (${tokenStatus})`);

    // Evitar loops en rutas públicas
    if (returnUrl.includes('/login') || returnUrl.includes('/Registrar')) {
      return true;
    }

    tokenStore.logoutAndNavigate(returnUrl);
    return false;
  }

  // Validando → Esperar brevemente (solo durante inicialización)
  if (tokenStatus === 'validating') {
    console.log('⏳ Token validando - esperando...');

    return new Promise<boolean>((resolve) => {
      let attempts = 0;
      const maxAttempts = 20; // 2 segundos

      const checkInterval = setInterval(() => {
        attempts++;
        const currentStatus = tokenStore.tokenStatus();

        // Token validado
        if (currentStatus === 'valid') {
          clearInterval(checkInterval);
          resolve(true);
          return;
        }

        // Token expirado → Interceptor manejará
        if (currentStatus === 'expired') {
          clearInterval(checkInterval);
          resolve(true);
          return;
        }

        // Error o sin token
        if (currentStatus === 'no-token') {
          clearInterval(checkInterval);
          tokenStore.logoutAndNavigate(returnUrl);
          resolve(false);
          return;
        }

        // Timeout
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error('❌ Timeout esperando validación');
          tokenStore.logoutAndNavigate(returnUrl);
          resolve(false);
        }
      }, 100);
    });
  }
  // Estado desconocido → Logout
  console.warn(`⚠️ Estado desconocido: ${tokenStatus}`);
  tokenStore.logoutAndNavigate(returnUrl);
  return false;
};
