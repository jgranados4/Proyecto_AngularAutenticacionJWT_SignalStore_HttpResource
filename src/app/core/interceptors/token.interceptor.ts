import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { UsuariosService } from '../services/usuarios.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { refreshToken } from '../models/AuthResponse';
import { CookieService } from 'ngx-cookie-service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const cookies = inject(CookieService);
  const usuarios = inject(UsuariosService);
  const token = usuarios.getToken();
  const CloneRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(CloneRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/login')) {
        return usuarios.RefreshToken().pipe(
          switchMap((resp: refreshToken) => {
            const token=resp.token;
              usuarios.setToken(token);
            cookies.set('refreshToken', resp.refreshToken); // actualizar refreshToken también
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`,
              },
            });
            return next(retryReq);
          }),
          catchError((err) => {
            usuarios.logout();
            return throwError(() => err);
          })
        );
      }
      return throwError(() => error);
    })
  );
  // return next(CloneRequest);
};
