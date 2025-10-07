import { FormControl } from "@angular/forms";

export interface Usuario {
  id?: number;
  nombre?: string;
  email?: string;
  rol?: string;
}
//login
export interface Login {
  email: email;
  constrasena: constrasena;
}

type email = string | null | undefined;
type constrasena = string | null | undefined;

export interface UsuarioForm {
  nombre: FormControl<string>;
  email: FormControl<string>;
  rol: FormControl<string>;
}