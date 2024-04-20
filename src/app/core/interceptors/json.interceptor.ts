import { HttpInterceptorFn } from '@angular/common/http';

export const jsonInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
