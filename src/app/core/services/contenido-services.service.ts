import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ICrudService } from '../models/CRUD';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContenidoServicesService implements ICrudService<any> {
  private readonly URL = environment.url;
  //*Cabecera
  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json; charset=utf-8',
  });

  constructor(private http: HttpClient) {}
  //*Crear
  PostContenido(datos: any) {
    return this.http.post(`${this.URL}/Usuarios`, datos, {
      headers: this.headers,
    });
  }
  //*Metodo de Obtener todo  con Procedure
  GetContenido(i: number): Observable<any> {
    const body = JSON.stringify({ i });
    return this.http.post(`${this.URL}/Usuarios/ProcedureUsuario`, body, {
      headers: this.headers,
    });
  }
  //* editar
  PutContenido(id: number, datos: any) {
    return this.http.put(`${this.URL}/Usuarios/${id}`, datos, {
      headers: this.headers,
    });
  }
  //*Eliminar
  DeleteContenido(id: number) {
    return this.http.delete(`${this.URL}/Usuarios/${id}`);
  }
  //*Eliminar todo
  AllContenido() {
    return this.http.delete(`${this.URL}/Usuarios/DeleteTotal`);
  }
}
