import { Component, inject } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UsuariosService } from '../../core/services/usuarios.service';
import { MensajesComponent } from '../mensajes/mensajes.component';
import { Login, Usuario } from '../../core/models/usuario';
import { AuthResponse } from '../../core/models/AuthResponse';

@Component({
  selector: 'app-iniciar',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule, MensajesComponent],
  templateUrl: './iniciar.component.html',
  styleUrl: './iniciar.component.css',
})
export class IniciarComponent {
  messageBoolean: boolean = false;
  GetToken: string = '';
  formgroups = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    constrasena: new FormControl('', [Validators.required]),
  });
  constructor(private usuarios: UsuariosService) {}
  login(): void {
    const login: Login<string> = {
      email: this.formgroups.value.email,
      constrasena: this.formgroups.value.constrasena,
    };
    console.log(login);
    this.usuarios.Login(login).subscribe({
      next: (data: AuthResponse) => {
        let tk = JSON.stringify(data.token);
        this.GetToken = JSON.parse(tk);
        localStorage.setItem('token', this.GetToken);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }
}
