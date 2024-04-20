export interface Usuario<T> {
  id?: number;
  nombre?: string;
  apellido?: string;
  estado?: string;
}
//login
export interface Login<T> {
  email: email;
  constrasena: constrasena;
}

type email = string | null | undefined;
type constrasena = string | null | undefined;
