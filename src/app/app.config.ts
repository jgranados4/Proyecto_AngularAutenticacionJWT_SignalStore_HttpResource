import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { tokenInterceptor } from './core/interceptors/token.interceptor';
import { provideToastr } from 'ngx-toastr';
import { errorInterceptorInterceptor } from './core/interceptors/error-interceptor.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideToastr({ timeOut: 4000, preventDuplicates: true }),
    provideHttpClient(
      withFetch(),
      withInterceptors([tokenInterceptor, errorInterceptorInterceptor])
    ),
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
  ],
};
