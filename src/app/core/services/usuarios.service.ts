import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Login, Usuario } from '../models/usuario';
import { CookieService } from 'ngx-cookie-service';
import {
  AuthResponse2,
  LoginData,
  refreshToken,
  tokenpayload2,
} from '../models/AuthResponse';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of } from 'rxjs';
import { HttpGenericoService } from './HttpGenerico/http-generico.service';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly URL = environment.url;
  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json; charset=utf-8',
  });
  //*inject
  private _cookies = inject(CookieService);
  router = inject(Router);
  private HttpResource = inject(HttpGenericoService);
  //*ENDPOINTS
  //*HttpResource
  GetUsuario = this.HttpResource.get<AuthResponse2<Usuario>>({
    url: `${this.URL}/UsuarioAUs`,
  });
  //*Crear
  CrearUsuario(datos: any) {
    return this.HttpResource.mutate({
      method: 'POST',
      url: `${this.URL}/UsuarioAUs`,
      body: datos,
      headers: this.headers,
    });
  }
  EditarUsuario(id: number, datos: any) {
    return this.HttpResource.mutate({
      method: 'PUT',
      url: `${this.URL}/UsuarioAUs/${id}`,
      body: datos,
      headers: this.headers,
    });
  }
  EliminarUsuario(id: number) {
    return this.HttpResource.mutate({
      method: 'DELETE',
      url: `${this.URL}/UsuarioAUs/${id}`,
      headers: this.headers,
    });
  }
  //*Login
  Login(datos: Login): Observable<AuthResponse2> {
    return this.HttpResource.mutate<AuthResponse2<LoginData>>({
      method: 'POST',
      url: `${this.URL}/UsuarioAUs/login`,
      body: datos,
      headers: this.headers,
    });
  }
  //* Refrescar Token
  RefreshToken(): Observable<refreshToken> {
    const refreshToken = this._cookies.get('refreshToken');
    return this.HttpResource.mutate<refreshToken>({
      method: 'POST',
      url: `${this.URL}/RefreshToken/refresh`,
      body: { refreshToken: refreshToken },
      headers: this.headers,
    });
  }
}
