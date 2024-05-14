import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { UsuariosService } from '../services/usuarios.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  //const token = localStorage.getItem('token');
  const usuarios = inject(UsuariosService);
  const token = usuarios.getToken().token;
  const CloneRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
  return next(CloneRequest);
};
