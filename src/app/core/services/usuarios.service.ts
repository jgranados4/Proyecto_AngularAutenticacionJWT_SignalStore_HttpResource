import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Login, Usuario } from '../models/usuario';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { tokenpayload } from '../models/AuthResponse';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly URL = environment.url;
  //*Cabecera
  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json; charset=utf-8',
  });
  //*inect
  private _cookies = inject(CookieService);
  private http = inject(HttpClient);
  constructor() {}
  ObtenerUsuarios() {
    return this.http.get(`${this.URL}/UsuarioAUs`);
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
  }
  setToken(data: any): void {
    return this._cookies.set('token', data);
  }
  getToken(): { token: string | null; decoded: tokenpayload | null } {
    let token = this._cookies.get('token');
    let decoded: JwtPayload | null = null;
    try {
      if (token) {
        //enviarlo tambien en el return
        decoded = jwtDecode<JwtPayload>(token);
      }
    } catch (error) {
      console.log(error);
    }
    return { token, decoded: decoded as tokenpayload };
  }
  //*Chequear si el token existe
  isAuthenticatedToken(): boolean {
    return this._cookies.check('token');
  }
  //agregar tiempo cookies  y el tiempo viene en el token

}
