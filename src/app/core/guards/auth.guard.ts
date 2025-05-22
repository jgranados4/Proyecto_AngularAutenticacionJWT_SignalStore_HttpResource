import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsuariosService } from '../services/usuarios.service';
export const authGuard: CanActivateFn = (route, state) => {
  const Usuario = inject(UsuariosService);
  //token
  const tok = Usuario.checkToken();
  if (tok) {
    return true;
  }
  inject(Router).navigate(['/login']);
  return false;
};
