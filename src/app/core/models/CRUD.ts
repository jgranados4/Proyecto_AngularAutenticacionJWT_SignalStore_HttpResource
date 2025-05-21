import { Observable } from 'rxjs';

export interface ICrudService<T> {
  PostContenido(datos: T): Observable<any>;
  GetContenido(i: number): Observable<T[]>;
  PutContenido(id: number, datos: T): Observable<any>;
  DeleteContenido(id: number): Observable<any>;
  AllContenido(): Observable<any>;
}
