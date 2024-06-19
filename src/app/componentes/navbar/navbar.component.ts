import {
  Component,
  effect,
  inject,
  model,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsuariosService } from '../../core/services/usuarios.service';
import { Subscription } from 'rxjs';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MenuComponent } from '../menu/menu.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, FontAwesomeModule, MenuComponent, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  //icon
  faBars = faBars;
  isAuthenticated: boolean = false;
  //*Inject
  usuarios = inject(UsuariosService);
  //*Observables
  private tokenExpire: Subscription = new Subscription();
  //*variables
  Getusuarios: string = ''; // Change the type from '{}' to 'string'
  isSidebarActive = signal<boolean>(false);
  //*iniciar el componente
  constructor() {
    effect(() => {
      console.log('isSidebarActive', this.isSidebarActive());
    });
  }
  ngOnInit(): void {
    //tiempo
    this.Getusuarios = this.usuarios.TokenDecoded()?.name || '';
    this.tokenExpire = this.usuarios.exp.subscribe((exp) => {
      const expiration = new Date(exp);
      if (new Date() >= expiration) {
        this.logout();
        //recargar la pagina
      }
    });
  }
  toggleSidebar() {
    this.isSidebarActive.set(!this.isSidebarActive());
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
