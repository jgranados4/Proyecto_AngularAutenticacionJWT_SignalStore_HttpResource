import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UsuariosService } from '@core/services/usuarios.service';
import { Login } from '../../core/models/usuario';
import { MessageService } from '../../core/services/message.service';
import { Router } from '@angular/router';
import { delay } from 'rxjs';
import { SignalStoreService } from '@app/core/services/TokenStore.service';

@Component({
  selector: 'app-iniciar',
  imports: [ReactiveFormsModule],
  templateUrl: './iniciar.component.html',
  styleUrl: './iniciar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IniciarComponent {
  GetToken: string = '';
  //*Inject
  usuarios = inject(SignalStoreService);
  auth = inject(UsuariosService);
  router = inject(Router);
  msj = inject(MessageService);
  public fb = inject(FormBuilder);
  //
  formbuild = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    constrasena: [
      '',
      [Validators.required, Validators.minLength(4), Validators.maxLength(20)],
    ],
  });
  login(): void {
    console.log('formualario', this.formbuild.value);
    const login: Login = {
      email: this.formbuild.value.email,
      constrasena: this.formbuild.value.constrasena,
    };
    this.auth
      .Login(login)
      .pipe(delay(1000))
      .subscribe({
        next: (response: any) => {
          console.log('response', response);
          this.usuarios.setToken(
            response.data.token,
            response.data.refreshToken
          );
          this.usuarios.debugTokenState();
          let message = JSON.stringify(response.message);
          this.msj.success(message);
          this.router.navigate(['/dashboard']);

          //recargar pagina con angular
        },
        error: (error: any) => {
          console.log('error', error);
        },
      });
  }
}
