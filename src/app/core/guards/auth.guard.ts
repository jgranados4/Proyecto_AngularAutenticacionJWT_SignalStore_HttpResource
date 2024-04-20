import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  //token
  const token = localStorage.getItem('token');
  if (token) {
    return true;
  }
  inject(Router).navigate(['/login']);
  return false;
};
