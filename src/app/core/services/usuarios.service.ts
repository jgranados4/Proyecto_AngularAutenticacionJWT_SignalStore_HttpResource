import { inject, Injectable, Signal, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Login, Usuario } from '../models/usuario';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import {
  AuthResponse2,
  refreshToken,
  tokenpayload,
  tokenpayload2,
} from '../models/AuthResponse';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of } from 'rxjs';

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
  private CheckToken = signal<boolean>(this._cookies.check('token'));
  checkToken = this.CheckToken.asReadonly();
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
  Login(datos: Login<string>): Observable<AuthResponse2> {
    return this.http.post<AuthResponse2>(
      `${this.URL}/UsuarioAUs/login`,
      datos,
      {
        headers: this.headers,
      }
    );
  }
  logout(): void {
    this.CheckToken.set(false);
    console.log('boolen', this.checkToken());
    this._cookies.delete('token');
    this._cookies.delete('refreshToken');
    this.router.navigate(['/login']);
  }
  setToken(data: any): void {
    this.CheckToken.set(true);
    this._cookies.set('token', data);
  }
  getToken(): string | null {
    let token = this._cookies.get('token');
    return token;
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
  verificarExpiracionToken(token: string): Observable<boolean> {
    if (!token) return of(true); // Si no hay token, está "expirado"

    return this.TokenDecoded2(token).pipe(
      map((payload) => {
        if (!payload?.expiracion) return true;

        const expiracion = new Date(payload.expiracion).getTime();
        const ahora = Date.now();
        return ahora >= expiracion; // true si ya expiró
      }),
      catchError((err) => {
        console.error('Error al verificar expiración del token:', err);
        return of(true); // Si hay error, asumimos expirado
      })
    );
  }

  RefreshToken(): Observable<refreshToken> {
    const refreshToken = this._cookies.get('refreshToken');
    return this.http.post<refreshToken>(
      `${this.URL}/RefreshToken/refresh`,
      refreshToken,
      {
        headers: this.headers,
      }
    );
  }
}
