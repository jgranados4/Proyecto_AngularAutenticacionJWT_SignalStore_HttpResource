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
import { MessageService } from '@app/core/services/message.service';

@Component({
    selector: 'app-navbar',
    imports: [RouterLink, FontAwesomeModule, CommonModule, DatePipe],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  //icon
  faBars = faBars;
  //*Inject
  usuarios = inject(UsuariosService);
  mensja=inject(MessageService)

  //*Observables
  //*variables
  readonly fecha = signal<string>(new Date().toISOString());
  decodedToken = signal<tokenpayload2 | null>(null);
  isAuthenticated = computed(() => this.usuarios.checkToken());
  readonly tiempoRestanteToken = computed(() => {
    const expiracionStr = this.decodedToken()?.expiracion;
    this.fecha();
    if (!expiracionStr) return null;

    const expiracion = new Date(expiracionStr).getTime(); // en ms
    const ahora = Date.now(); // en ms
    const diferencia = expiracion - ahora;

    return diferencia > 0 ? Math.floor(diferencia / 1000) : 0; // en segundos
  });

  readonly nombreUsuario = computed(() => this.decodedToken()?.nombre ?? '');
  isSidebarActive = signal<boolean>(false);

  //*iniciar el componente
  constructor() {
    interval(1000).subscribe(() => {
      this.fecha.set(new Date().toISOString());
      const segundosRestantes = this.tiempoRestanteToken();

      if (segundosRestantes !== null) {
        console.log('Segundos restantes:', segundosRestantes);

        if (segundosRestantes === 0) {
          console.warn('Token expirado, cerrando sesión...');
          this.logout();
        } else if (segundosRestantes <= 60) {
          console.warn(
            `¡Advertencia! El token expirará en ${segundosRestantes} segundos.`
          );
        }
      }
    });

    effect(
      () => {
        console.log('boolean', this.isAuthenticated());
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
  formatearTiempoRestante(segundos: number): string {
    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;
    return `${min.toString().padStart(2, '0')}:${sec
      .toString()
      .padStart(2, '0')}`;
  }

  logout(): void {
    this.usuarios.logout();
    this.decodedToken.set(null);
  }
}
