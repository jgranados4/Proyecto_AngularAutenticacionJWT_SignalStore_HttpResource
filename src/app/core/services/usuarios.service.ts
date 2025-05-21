import { inject, Injectable, Signal, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Login, Usuario } from '../models/usuario';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { tokenpayload, tokenpayload2 } from '../models/AuthResponse';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly URL = environment.url;
  //*Cabecera
  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json; charset=utf-8',
  });
  //*inject
  private _cookies = inject(CookieService);
  private http = inject(HttpClient);
  router = inject(Router);
  //*Observable
  ObtenerUsuarios() {
    return this.http.get<Usuario<number | string>>(`${this.URL}/UsuarioAUs`);
  }
  //*Crear
  PostUsuario(datos: any) {
    return this.http.post(`${this.URL}/UsuarioAUs`, datos, {
      headers: this.headers,
    });
  }
  //*Login
  Login(datos: Login<string>) {
    return this.http.post(`${this.URL}/UsuarioAUs/login`, datos, {
      headers: this.headers,
    });
  }
  logout(): void {
    this._cookies.delete('token');
    this.router.navigate(['/login']);
  }
  setToken(data: any): void {
    return this._cookies.set('token', data);
  }
  getToken(): string | null {
    let token = this._cookies.get('token');
    return token;
  }
  //*Chequear si el token existe
  isAuthenticatedToken(): boolean {
    return this._cookies.check('token');
  }

  TokenDecoded2(token: string | unknown): Observable<tokenpayload2 | null> {
    const tokenStr = typeof token === 'string' ? token : '';
    return this.http
      .get<tokenpayload2>(`${this.URL}/UsuarioAUs/DecodeToken`, {
        params: { token: tokenStr },
      })
      .pipe(
        catchError((erro) => {
          console.error;
          return of(null);
        })
      );
  }
}
