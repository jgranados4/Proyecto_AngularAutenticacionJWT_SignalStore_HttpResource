import { inject, Injectable, Signal, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Login, Usuario } from '../models/usuario';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import {
  AuthResponse2,
  tokenpayload,
  tokenpayload2,
} from '../models/AuthResponse';
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
  //*Chequear si el token existe

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
