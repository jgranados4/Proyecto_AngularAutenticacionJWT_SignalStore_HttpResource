/**
 * Interfaz para configurar requests HTTP
 */

import { HttpHeaders, HttpParams, HttpResourceOptions } from '@angular/common/http';
// Tipo union para aceptar las tres formas
export type HttpGetInput<T> =
  | string
  | (() => string)
  | HttpGetResourceConfig<T>;

export interface HttpGetResourceConfig<T> extends HttpResourceOptions<T, any> {
  url: string | (() => string | undefined); // URL o función reactiva
  headers?: Record<string, string> | (() => Record<string, string>);
  params?: Record<string, any> | (() => Record<string, any>);
}
/**
 * Configuración para POST/PUT/DELETE con HttpClient
 */
export interface HttpMutationConfig<T> {
  url: string | (() => string);
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any | (() => any);
  headers?:
    | HttpHeaders
    | Record<string, string>
    | (() => HttpHeaders | Record<string, string>);
  params?:
    | HttpParams
    | Record<string, any>
    | (() => HttpParams | Record<string, any>);
}
