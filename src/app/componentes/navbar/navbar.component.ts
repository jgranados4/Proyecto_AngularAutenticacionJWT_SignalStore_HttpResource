import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  EffectCleanupFn,
  EffectRef,
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
import { CommonModule, DatePipe } from '@angular/common';
import { tokenpayload2 } from '@app/core/models/AuthResponse';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, FontAwesomeModule, CommonModule, DatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  //icon
  faBars = faBars;
  //*Inject
  usuarios = inject(UsuariosService);

  //*Observables
  private tokenExpire = signal<number>(0);
  //*variables
  readonly fecha = signal<string>(new Date().toISOString());
  decodedToken = signal<tokenpayload2 | null>(null);
  readonly isAuthenticated = computed(() =>
    this.usuarios.isAuthenticatedToken()
  );
  readonly nombreUsuario = computed(() => this.decodedToken()?.nombre ?? '');
  isSidebarActive = signal<boolean>(false);

  //*iniciar el componente
  constructor() {
    interval(1000).subscribe(() => {
      this.fecha.set(new Date().toISOString());
    });

    effect(
      () => {
        if (this.isAuthenticated()) {
          const token = this.usuarios.getToken();
          this.usuarios.TokenDecoded2(token).subscribe({
            next: (result) => {
              if (result) {
                this.decodedToken.set(result);
                console.log('Token decodificado:', result);
              } else {
                console.warn('No se pudo decodificar el token.');
              }
            },
            error: (err) => console.error('Error en la petición:', err),
          });
        } else {
        }
      },
      {
        allowSignalWrites: true,
      }
    );
  }
  toggleSidebar() {
    this.isSidebarActive.set(!this.isSidebarActive());
  }
  logout(): void {
    console.log('logout');
    this.usuarios.logout();
    this.decodedToken.set(null);
  }
}
