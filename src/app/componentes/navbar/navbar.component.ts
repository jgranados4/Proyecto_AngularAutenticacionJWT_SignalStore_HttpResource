import {
  ChangeDetectorRef,
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
import { interval } from 'rxjs';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MenuComponent } from '../menu/menu.component';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    FontAwesomeModule,
    MenuComponent,
    CommonModule,
    DatePipe,
  ],
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
  private tokenExpire = signal<number>(0);
  //*variables
  fecha = signal<string>('');
  Getusuarios = signal<string>('');
  isSidebarActive = signal<boolean>(false);
  //*iniciar el componente
  constructor() {
    effect(() => {
      console.log('Getusuarios', this.Getusuarios());
    });
  }
  ngAfterViewChecked(): void {
    //Called after every check of the component's view. Applies to components only.
    //Add 'implements AfterViewChecked' to the class.
    const decodedName = this.usuarios.TokenDecoded()?.name;
    if (decodedName) {
      this.Getusuarios.set(decodedName);
    }
  }
  ngOnInit(): void {
    this.fecha.set(new Date().toISOString());
    interval(1000).subscribe(() => {
      this.fecha.set(new Date().toISOString());
    });
    //tiempo
    this.usuarios.exp.update((exp: any) => {
      const expiration = new Date(exp);
      if (new Date() >= expiration) {
        console.log('expirado');
        this.logout();
      }
      this.tokenExpire.set(exp);
      return exp;
    });
  }
  toggleSidebar() {
    this.isSidebarActive.set(!this.isSidebarActive());
  }
  logout(): void {
    console.log('logout');
    this.Getusuarios.set('');
    this.usuarios.logout();
    this.isAuthenticated = false;
  }
  checkToken(): boolean {
    return (this.isAuthenticated = this.usuarios.isAuthenticatedToken()
      ? true
      : false);
  }
  ngOnDestroy(): void {
    this.tokenExpire();
  }
}
