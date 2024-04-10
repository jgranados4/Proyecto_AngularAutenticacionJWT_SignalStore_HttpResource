import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UsuariosService } from '../../core/services/usuarios.service';
import { MessageService } from '../../core/services/message.service';
import { MensajesComponent } from '../mensajes/mensajes.component';
import { delay } from 'rxjs';

@Component({
  selector: 'app-registrate',
  standalone: true,
  imports: [NavbarComponent, MensajesComponent, ReactiveFormsModule],
  templateUrl: './registrate.component.html',
  styleUrl: './registrate.component.css',
})
export class RegistrateComponent {
  messageBoolean: boolean = false;
  constructor(private usuario: UsuariosService, private msj: MessageService) {}
  //*Formulario Reactivo
  formGroup = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    constrasena: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  //*Registrar
  registrar() {
    console.log(this.formGroup.value);
    this.usuario
      .PostUsuario(this.formGroup.value)
      .pipe(delay(1000))
      .subscribe({
        next: (data) => {
          console.log(data);
          const message = 'Registro Exitoso';
          this.msj.sendMessage(message);
          this.messageBoolean = true;
        },
        error: (error) => {
          console.log(error);
        },
      });
  }
}
