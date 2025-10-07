import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  isDevMode,
  model,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import {
  faArrowsRotate,
  faBars,
  faCheck,
  faDoorOpen,
  faRotateRight,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule, DatePipe } from '@angular/common';
import { MessageService } from '@app/core/services/message.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UsuariosService } from '@app/core/services';
import { SignalStoreService } from '@app/core/services/TokenStore.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, FontAwesomeModule, CommonModule, DatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  //icon
  open = faDoorOpen;
  rotateright = faRotateRight;
  arrowsrotate = faArrowsRotate;
  triangleexclamation = faTriangleExclamation;
  check=faCheck;
  //*Inject
  usuarios = inject(SignalStoreService);
  mensja = inject(MessageService);
  #ref = inject(DestroyRef);

  //*Observables
  //*variables
  readonly fecha = signal<string>(new Date().toISOString());
  isAuthenticated = this.usuarios.isAuthenticated;

  // Computed
  // ✅ Método para forzar recarga del token
  refreshTokenData(): void {
    console.log('🔄 Recargando datos del token...');
    this.usuarios.reloadTokenData();
  }
  // ✅ Computed para formatear información del usuario
  userDisplayName = computed(() => {
    const tokenInfo = this.usuarios.tokenInfo();
    return tokenInfo?.nombre || 'Usuario';
  });

  // ✅ Computed para mostrar rol
  userRole = computed(() => {
    const tokenInfo = this.usuarios.tokenInfo();
    return tokenInfo?.role || 'Sin rol';
  });
  // ✅ Computed para clase CSS del estado
  tokenStatusClass = computed(() => {
    const status = this.usuarios.tokenStatus();
    return `token-status-${status}`;
  });
  // ✅ COMPUTED: Estado crítico del token (para alertas)
  tokenCriticalState = computed(() => {
    const tokenInfo = this.usuarios.tokenInfo();
    const status = this.usuarios.tokenStatus();

    if (!tokenInfo?.tiempoRestante) return null;

    const timeRemaining = tokenInfo.tiempoRestante;

    if (timeRemaining === 'Expirado') {
      return {
        type: 'expired',
        message: 'Token expirado - cerrando sesión',
        shouldLogout: true,
      };
    }

    // Verificar advertencia de 1 minuto
    const minutosMatch = timeRemaining.match(/(\d+)m/);
    if (minutosMatch && parseInt(minutosMatch[1], 10) <= 1) {
      return {
        type: 'warning',
        message: `Token expirará en ${timeRemaining}`,
        shouldLogout: false,
      };
    }

    return null;
  });

  isSidebarActive = signal<boolean>(false);
  constructor() {
    effect(() => {
      const criticalState = this.tokenCriticalState();

      if (!criticalState) return;

      if (criticalState.shouldLogout) {
        console.warn('🚨 Token expirado - cerrando sesión automáticamente');
        this.logout();
        return;
      }

      if (criticalState.type === 'warning') {
        console.warn(`⚠️ ${criticalState.message}`);
        this, this.mensja.warning(criticalState.message);
      }
    });
    // ✅ Effect para debugging (solo en desarrollo)
    if (this.isDevMode()) {
      effect(() => {
        this.usuarios.debugTokenState();
        console.log('contenido', this.usuarios.tokenInfo());
      });
    }
    interval(1000)
      .pipe(takeUntilDestroyed(this.#ref))
      .subscribe(() => {
        this.fecha.set(new Date().toISOString());
      });
  }
  toggleSidebar() {
    this.isSidebarActive.set(!this.isSidebarActive());
  }

  logout(): void {
    this.usuarios.logout();
  }

  // ✅ Método para obtener clase CSS del rol
  getRoleClass(role?: string): string {
    if (!role) return 'role-guest';

    const roleLower = role.toLowerCase();

    if (roleLower.includes('admin')) return 'role-admin';
    if (roleLower.includes('user') || roleLower.includes('usuario'))
      return 'role-user';

    return 'role-guest';
  }
  private isDevMode(): boolean {
    return isDevMode();
  }
  getUserInitials(): string {
    const nombre = this.userDisplayName();
    return nombre
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }
  getExpirationTagClass(isExpired: boolean): string {
    return isExpired ? 'is-danger' : 'is-success';
  }
  getTimeRemainingTagClass(timeRemaining?: string): string {
    if (!timeRemaining) return 'is-info';
    if (timeRemaining === 'Expirado') return 'is-danger';

    const minutosMatch = timeRemaining.match(/(\d+)m/);
    if (minutosMatch && parseInt(minutosMatch[1], 10) <= 5) {
      return 'is-warning';
    }

    return 'is-success';
  }
  getRoleTagClass(role?: string): string {
    if (!role) return 'is-light';

    const roleLower = role.toLowerCase();

    if (roleLower.includes('admin')) return 'is-danger';
    if (roleLower.includes('user')) return 'is-primary';

    return 'is-light';
  }
}
