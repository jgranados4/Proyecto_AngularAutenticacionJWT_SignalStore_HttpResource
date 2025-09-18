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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  //icon
  faBars = faBars;
  //*Inject
  usuarios = inject(UsuariosService);
  mensja = inject(MessageService);

  //*Observables
  //*variables
  readonly fecha = signal<string>(new Date().toISOString());
  isAuthenticated = computed(() => this.usuarios.checkToken());

  // Computed para información completa del token
  tokenInfo = computed(() => {
    if (!this.usuarios.TokenDecoded2.hasValue()) {
      return null;
    }

    const tokenData = this.usuarios.TokenDecoded2.value();
    return {
      id: tokenData.id,
      email: tokenData?.email || '',
      nombre: tokenData.nombre,
      rol: tokenData?.rol || '',
      expiracion: tokenData?.expiracion || '',
      estaExpirado: this.isTokenExpired(),
      tiempoRestante: this.calcularTiempoRestante(
        typeof tokenData?.expiracion === 'string'
          ? tokenData.expiracion
          : tokenData?.expiracion instanceof Date
          ? tokenData.expiracion.toISOString()
          : undefined
      ),
    };
  });

  isSidebarActive = signal<boolean>(false);
  // Computed para verificar si el token está expirado
  isTokenExpired = computed(() => {
    // Verificar si el resource tiene valor
    if (!this.usuarios.TokenDecoded2.hasValue()) {
      return false; // No expirado si aún no tenemos datos
    }
    const tokenData = this.usuarios.TokenDecoded2.value();
    if (!tokenData?.expiracion) {
      return true; // Considerar expirado si no hay fecha
    }

    const expiracion = new Date(tokenData.expiracion).getTime();
    const ahora = Date.now();
    return ahora >= expiracion;
  });
  private calcularTiempoRestante(expiracion?: string): string {
    if (!expiracion) return 'Desconocido';

    try {
      const expTimestamp = new Date(expiracion).getTime();
      const ahora = Date.now();
      const diferencia = expTimestamp - ahora;

      if (diferencia <= 0) return 'Expirado';

      const horas = Math.floor(diferencia / (1000 * 60 * 60));
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

      if (horas > 0) {
        return `${horas}h ${minutos}m`;
      } else {
        return `${minutos}m`;
      }
    } catch {
      return 'Error calculando';
    }
  }
  //*iniciar el componente
  constructor() {
    interval(1000).subscribe(() => {
      this.fecha.set(new Date().toISOString());
      const tiempoRestante = this.tokenInfo()?.tiempoRestante;

      if (tiempoRestante !== null && tiempoRestante !== undefined) {
        console.log('Tiempo restante:', tiempoRestante);

        if (tiempoRestante === 'Expirado') {
          console.warn('Token expirado, cerrando sesión...');
          this.logout();
        } else if (typeof tiempoRestante === 'string') {
          // Opcional: puedes extraer los minutos si el formato es "Xm" o "Xh Ym"
          const minutosMatch = tiempoRestante.match(/(\d+)m/);
          if (minutosMatch && parseInt(minutosMatch[1], 10) <= 1) {
            console.warn(
              `¡Advertencia! El token expirará en ${tiempoRestante}.`
            );
          }
        }
      }
    });

    effect(
      () => {
        // console.log('boolean', this.isAuthenticated());
        // const token = this.usuarios.getToken();
        // const usuario = this.usuarios.TokenDecoded2.value();
        // console.log('data', usuario, 'token', token);
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
    this.usuarios.logout();
  }
}
