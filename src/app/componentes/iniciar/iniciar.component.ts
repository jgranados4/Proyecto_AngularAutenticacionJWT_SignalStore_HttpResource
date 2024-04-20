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
import { MessageService } from '../../core/services/message.service';

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
  //*Inject
  usuarios = inject(UsuariosService);
  msj = inject(MessageService);
  login(): void {
    const login: Login<string> = {
      email: this.formgroups.value.email,
      constrasena: this.formgroups.value.constrasena,
    };
    console.log(login);
    this.usuarios.Login(login).subscribe({
      next: (data: AuthResponse) => {
        let message = JSON.stringify(data.message);
        console.log(message);
        let tk = JSON.stringify(data.token);
        this.messageBoolean = true;
        this.msj.sendMessage(message);
        this.GetToken = JSON.parse(tk);
        localStorage.setItem('token', this.GetToken);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }
  logout(): void {
    this.usuarios.logout();
  }
}
