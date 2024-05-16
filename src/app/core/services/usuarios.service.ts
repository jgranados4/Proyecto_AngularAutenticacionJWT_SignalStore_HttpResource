import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Login, Usuario } from '../models/usuario';
import { CookieService } from 'ngx-cookie-service';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { tokenpayload } from '../models/AuthResponse';
import { BehaviorSubject } from 'rxjs';

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
  //*Observable
  public exp: BehaviorSubject<number> = new BehaviorSubject<number>(0);
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
  getToken(): string | null {
    let token = this._cookies.get('token');
    return token;
  }
  //*Chequear si el token existe
  isAuthenticatedToken(): boolean {
    return this._cookies.check('token');
  }
  //agregar tiempo cookies  y el tiempo viene en el token
  TokenDecoded(): tokenpayload | null {
    let decoded: JwtPayload | null = null;
    try {
      const token = this.getToken();
      if (token) {
        //enviarlo tambien en el return
        decoded = jwtDecode<JwtPayload>(token);
        console.log('decoded', decoded);
        this.exp.next((decoded.exp as number) * 1000);
      }
    } catch (error) {
      console.log(error);
    }
    return decoded as tokenpayload;
  }
}
