import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Login, Usuario } from '../models/usuario';

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
    localStorage.removeItem('token');
  }
}
