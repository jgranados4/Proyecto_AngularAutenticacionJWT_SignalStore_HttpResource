import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsuariosService } from '../../core/services/usuarios.service';
import { tokenpayload } from '../../core/models/AuthResponse';
import { JsonPipe } from '@angular/common';
import { Subscription, timeout } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, JsonPipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  isAuthenticated: boolean = false;
  //*Inject
  usuarios = inject(UsuariosService);
  //*Observables
  private tokenExpire: Subscription = new Subscription();
  //*variables
  Getusuarios: string = ''; // Change the type from '{}' to 'string'
  //*iniciar el componente
  ngOnInit(): void {
    //tiempo
    this.Getusuarios = this.usuarios.TokenDecoded()?.name || '';
    this.tokenExpire = this.usuarios.exp.subscribe((exp) => {
      console.log('exp', new Date(exp));
      const expiration = new Date(exp);
      if (new Date() >= expiration) {
        this.logout();
        //recargar la pagina
      }
    });
  }
  logout(): void {
    console.log('logout');
    this.usuarios.logout();
    this.isAuthenticated = false;
  }
  // Token(): void | any {
  //   console.log(this.usuarios.getToken().decoded?.name);
  //   return this.usuarios.getToken().token;
  // }
  //chequear si el token existe, si existe mostrar el nombre del usuario y el boton de logout
  //si no existe mostrar el boton de login
  checkToken(): boolean {
    return (this.isAuthenticated = this.usuarios.isAuthenticatedToken()
      ? true
      : false);
  }
  ngOnDestroy(): void {
    this.tokenExpire.unsubscribe();
  }
}
