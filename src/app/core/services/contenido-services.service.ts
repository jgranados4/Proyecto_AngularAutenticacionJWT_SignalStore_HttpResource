import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ContenidoServicesService {
  private readonly URL = environment.url;

  constructor(private http: HttpClient) {}
  //*Crear
  PostContenido(datos: any) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json; charset=utf-8',
    });

    return this.http.post(`${this.URL}/Usuarios`, datos, {
      headers,
    });
  }
  //*Metodo de Obtener todo  con Procedure
  GetContenido(i: number) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json; charset=utf-8',
    });

    const body = JSON.stringify({ i });

    return this.http.post(`${this.URL}/Usuarios/ProcedureUsuario`, body, {
      headers,
    });
  }
  //* editar
  PutContenido(id: number,datos:any) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json; charset=utf-8',
    });

    return this.http.put(`${this.URL}/Usuarios/${id}`, datos, {
      headers,
    });
  }
}
