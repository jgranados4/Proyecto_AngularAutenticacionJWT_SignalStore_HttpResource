import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
export const authGuard: CanActivateFn = (route, state) => {
  const _cookies = inject(CookieService);
  //token
  const token = _cookies.check('token');
  if (token) {
    return true;
  }
  inject(Router).navigate(['/login']);
  return false;
};
