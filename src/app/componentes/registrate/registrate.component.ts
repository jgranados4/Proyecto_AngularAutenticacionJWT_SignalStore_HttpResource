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
import { UsuariosStoreService } from '@app/core/services/usuariosStore.service';

@Component({
  selector: 'app-registrate',
  imports: [NavbarComponent, ReactiveFormsModule, JsonPipe],
  templateUrl: './registrate.component.html',
  styleUrl: './registrate.component.css',
})
export class RegistrateComponent {
  //*inject
  usuario = inject(UsuariosStoreService);
  msj = inject(MessageService);
  router = inject(Router);
  fb = inject(FormBuilder);
  toast = inject(ToastrService);
  //*Formulario Reactivo
  formbuil = this.fb.group({
    nombre: ['', [Validators.required]],
    Contrasena: [
      '',
      [Validators.required, Validators.minLength(4), Validators.maxLength(20)],
    ],
    email: ['', [Validators.required, Validators.email]],
    rol: ['', Validators.required],
  });

  //*Registrar
  registrar() {
    const usuarioRegistrado = `Usuario: ${this.formbuil.value.nombre}\nCorreo: ${this.formbuil.value.email}\nTipo: ${this.formbuil.value.rol}`;
    this.usuario.crear(this.formbuil.value).subscribe({
      next: (data) => {
        const message = 'Registro Exitoso';
        this.msj.success(usuarioRegistrado, message);
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
