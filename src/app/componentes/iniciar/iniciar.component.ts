import { ChangeDetectorRef, Component, inject } from '@angular/core';
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
import { AuthResponse2 } from '../../core/models/AuthResponse';
import { MessageService } from '../../core/services/message.service';
import { Router } from '@angular/router';
import { delay } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

@Component({
    selector: 'app-iniciar',
    imports: [NavbarComponent, ReactiveFormsModule],
    templateUrl: './iniciar.component.html',
    styleUrl: './iniciar.component.css'
})
export class IniciarComponent {
  GetToken: string = '';
  //*Inject
  usuarios = inject(UsuariosService);
  router = inject(Router);
  msj = inject(MessageService);
  private _cookies = inject(CookieService);
  public fb = inject(FormBuilder);
  //
  formbuild = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    constrasena: [
      '',
      [Validators.required, Validators.minLength(4), Validators.maxLength(10)],
    ],
  });
  login(): void {
    console.log('formualario', this.formbuild.value);
    const login: Login<string> = {
      email: this.formbuild.value.email,
      constrasena: this.formbuild.value.constrasena,
    };
    this.usuarios
      .Login(login)
      .pipe(delay(1000))
      .subscribe({
        next: (response: AuthResponse2) => {
          console.log('response', response);
          this.usuarios.setToken(response.data.token);
          this._cookies.set('refreshToken', response.data.refreshToken);
          let message = JSON.stringify(response.message);
          // let tk = JSON.stringify(data.token);
          this.msj.success(message);
          // this.GetToken = JSON.parse(tk);
          // localStorage.setItem('token', this.GetToken);
          this.router.navigate(['/dashboard']);

          //recargar pagina con angular
        },
        error: (error: any) => {
          console.log('error', error);
        },
      });
  }
}
