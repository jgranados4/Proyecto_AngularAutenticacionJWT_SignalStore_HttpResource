import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './core/interceptors/token.interceptor';
import { provideToastr } from 'ngx-toastr';
import { errorInterceptorInterceptor } from './core/interceptors/error-interceptor.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideToastr({ timeOut: 4000, preventDuplicates: true }),
    provideHttpClient(
      withInterceptors([tokenInterceptor, errorInterceptorInterceptor])
    ),
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
  ],
};
