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
import { delay } from 'rxjs';
import { JsonPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-registrate',
    imports: [NavbarComponent, ReactiveFormsModule, JsonPipe],
    templateUrl: './registrate.component.html',
    styleUrl: './registrate.component.css'
})
export class RegistrateComponent {
  messageBoolean: boolean = false;
  //*inject
  usuario = inject(UsuariosService);
  msj = inject(MessageService);
  router = inject(Router);
  fb = inject(FormBuilder);
  toast = inject(ToastrService);
  //*Formulario Reactivo
  formbuil = this.fb.group({
    nombre: ['', [Validators.required]],
    constrasena: [
      '',
      [Validators.required, Validators.minLength(4), Validators.maxLength(10)],
    ],
    email: ['', [Validators.required, Validators.email]],
    rol: ['', Validators.required],
  });

  //*Registrar
  registrar() {
    const usuarioRegistrado = `Usuario: ${this.formbuil.value.nombre}\nCorreo: ${this.formbuil.value.email}\nTipo: ${this.formbuil.value.rol}`;
    this.usuario
      .PostUsuario(this.formbuil.value)
      .pipe(delay(1000))
      .subscribe({
        next: (data) => {
          console.log(data);
          const message = 'Registro Exitoso';
          this.msj.success(usuarioRegistrado, message);
          this.messageBoolean = true;
          setTimeout(() => {
            this.router.navigateByUrl('/login');
          }, 1000);
        },
        error: (error) => {
          console.log(error);
        },
      });
  }
}
