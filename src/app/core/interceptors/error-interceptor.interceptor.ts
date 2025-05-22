import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';

export const errorInterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        // Client side error
        toastr.error('No internet connection.');
      } else {
        // Server side error
        switch (error.status) {
          case 401:
            toastr.warning('Unauthorized. Please log in again.');
            router.navigate(['/login']);
            break;
          case 403:
            toastr.error('Forbidden. Permission issue.');
            break;
          case 404:
            toastr.info('Requested resource not found.');
            break;
          case 500:
            toastr.error('Server error. Please try again later.');
            break;
          default:
            toastr.error('Unexpected error. Please try again.');
        }
        console.error(`Error ${error.status}:`, error.message);
      }
      return throwError(() => error);
    })
  );
};
