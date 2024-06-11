import { Component, inject } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UsuariosService } from '../../core/services/usuarios.service';
import { MessageService } from '../../core/services/message.service';
import { MensajesComponent } from '../mensajes/mensajes.component';
import { delay } from 'rxjs';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-registrate',
  standalone: true,
  imports: [NavbarComponent, MensajesComponent, ReactiveFormsModule, JsonPipe],
  templateUrl: './registrate.component.html',
  styleUrl: './registrate.component.css',
})
export class RegistrateComponent {
  messageBoolean: boolean = false;
  //*inject
  usuario = inject(UsuariosService);
  msj = inject(MessageService);
  fb = inject(FormBuilder);
  //*Formulario Reactivo
  formbuil = this.fb.group({
    nombre: ['', [Validators.required]],
    constrasena: [
      '',
      [Validators.required, Validators.minLength(4), Validators.maxLength(10)],
    ],
    email: ['', [Validators.required, Validators.email]],
  });

  //*Registrar
  registrar() {
    this.usuario
      .PostUsuario(this.formbuil.value)
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
