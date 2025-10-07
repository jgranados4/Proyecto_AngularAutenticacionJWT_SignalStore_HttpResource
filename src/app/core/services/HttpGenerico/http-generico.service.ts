import {
  HttpClient,
  httpResource,
  HttpResourceRef,
  HttpResourceRequest,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  HttpGetInput,
  HttpGetResourceConfig,
  HttpMutationConfig,
} from './Interface/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class HttpGenericoService {
  #http = inject(HttpClient);
  // Método helper para normalizar
  private normalizeConfig<T>(
    config: HttpGetInput<T>
  ): HttpGetResourceConfig<T> {
    if (typeof config === 'string' || typeof config === 'function') {
      return { url: config } as HttpGetResourceConfig<T>;
    }
    return config;
  }
  get<T>(config: HttpGetInput<T>) {
    // Normalizar la entrada a objeto completo
    const normalizedConfig: HttpGetResourceConfig<T> =
      this.normalizeConfig(config);

    const resourceConfig = () => {
      // ✅ SOLUCIÓN: Evaluar la URL primero y verificar si es undefined
      const urlValue =
        typeof normalizedConfig.url === 'function'
          ? normalizedConfig.url()
          : normalizedConfig.url;
      if (!urlValue) {
        return undefined;
      }
      const baseConfig: HttpResourceRequest = {
        url: urlValue,
        method: 'GET',
      };
      if (normalizedConfig.headers) {
        baseConfig.headers =
          typeof normalizedConfig.headers === 'function'
            ? normalizedConfig.headers()
            : normalizedConfig.headers;
      }
      if (normalizedConfig.params) {
        baseConfig.params =
          typeof normalizedConfig.params === 'function'
            ? normalizedConfig.params()
            : normalizedConfig.params;
      }
      return baseConfig;
    };

    const options = {
      ...normalizedConfig,
    };
    return httpResource<T>(resourceConfig, options);
  }
  // ---- Mutaciones con HttpClient ----
  mutate<T>(config: HttpMutationConfig<T>): Observable<T> {
    const url = typeof config.url === 'function' ? config.url() : config.url;
    const body =
      typeof config.body === 'function' ? config.body() : config.body;
    const headers =
      typeof config.headers === 'function' ? config.headers() : config.headers;
    const params =
      typeof config.params === 'function' ? config.params() : config.params;

    const options = { headers, params };

    switch (config.method) {
      case 'POST':
        return this.#http.post<T>(url, body, options);
      case 'PUT':
        return this.#http.put<T>(url, body, options);
      case 'DELETE':
        return this.#http.delete<T>(url, options);
      case 'PATCH':
        return this.#http.patch<T>(url, body, options);
    }
  }
  // ---------------- GET TEXTO ----------------
  getText(config: HttpGetResourceConfig<string>): HttpResourceRef<string> {
    const resourceConfig = (): any => ({
      url: typeof config.url === 'function' ? config.url() : config.url,
      method: 'GET',
      headers:
        typeof config.headers === 'function'
          ? config.headers()
          : config.headers,
      params:
        typeof config.params === 'function' ? config.params() : config.params,
    });

    const options = { ...config };
    return httpResource.text(
      resourceConfig,
      options
    ) as HttpResourceRef<string>;
  }

  // ---------------- GET BLOBS ----------------
  getBlob(config: HttpGetResourceConfig<Blob>): HttpResourceRef<Blob> {
    const resourceConfig = (): any => ({
      url: typeof config.url === 'function' ? config.url() : config.url,
      method: 'GET',
      headers:
        typeof config.headers === 'function'
          ? config.headers()
          : config.headers,
      params:
        typeof config.params === 'function' ? config.params() : config.params,
    });

    const options = { ...config };
    return httpResource.blob(resourceConfig, options) as HttpResourceRef<Blob>;
  }

  // ---------------- GET ARRAYBUFFER ----------------
  getArrayBuffer(
    config: HttpGetResourceConfig<ArrayBuffer>
  ): HttpResourceRef<ArrayBuffer> {
    const resourceConfig = (): any => ({
      url: typeof config.url === 'function' ? config.url() : config.url,
      method: 'GET',
      headers:
        typeof config.headers === 'function'
          ? config.headers()
          : config.headers,
      params:
        typeof config.params === 'function' ? config.params() : config.params,
    });

    const options = { ...config };
    return httpResource.arrayBuffer(
      resourceConfig,
      options
    ) as HttpResourceRef<ArrayBuffer>;
  }
}
