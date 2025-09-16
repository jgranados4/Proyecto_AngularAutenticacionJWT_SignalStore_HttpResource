import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsuariosService } from '../services/usuarios.service';
import { CookieService } from 'ngx-cookie-service';
import { refreshToken } from '../models/AuthResponse';
import { catchError, map, of, switchMap } from 'rxjs';
export const authGuard: CanActivateFn = (route, state) => {
  const Usuario = inject(UsuariosService);
  const cookies = inject(CookieService);
  const router = inject(Router);
  //token
  const token = Usuario.checkToken();
  const getToke=Usuario.getToken();
  if (!token) {
    router.navigate(['/login']);
    return of(false);
  }

  return Usuario.verificarExpiracionToken(getToke!).pipe(
    switchMap((expirado) => {
      if (!expirado) {
        return of(true); // token válido
      }

      // Intentar refrescar
      return Usuario.RefreshToken().pipe(
        map((resp: refreshToken) => {
          Usuario.setToken(resp.token);
          cookies.set('refreshToken', resp.refreshToken);
          return true;
        }),
        catchError((err) => {
          Usuario.logout();
          router.navigate(['/login']);
          return of(false);
        })
      );
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
