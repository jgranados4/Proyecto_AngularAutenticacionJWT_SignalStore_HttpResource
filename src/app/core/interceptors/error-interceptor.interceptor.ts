import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { MessageService } from '../services/message.service';

export const errorInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  const mensaje = inject(MessageService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        // Client side error
        mensaje.error('No internet connection.');
      } else {
        // Server side error
        switch (error.status) {
          case 401:
            mensaje.warning('Unauthorized. Please log in again.');
            router.navigate(['/login']);
            break;
          case 403:
            mensaje.error('Forbidden. Permission issue.');
            break;
          case 404:
            mensaje.info('Requested resource not found.');
            break;
          case 500:
            mensaje.error('Server error. Please try again later.');
            break;
          default:
            mensaje.error('Unexpected error. Please try again.');
        }
        console.error(`Error ${error.status}:`, error.message);
      }
      return throwError(() => error);
    })
  );
};
