import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  faArrowsRotate,
  faCheck,
  faDoorOpen,
  faRotateRight,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule, DatePipe } from '@angular/common';
import { MessageService } from '@app/core/services/message.service';
import { SignalStoreService } from '@app/core/services/TokenStore.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, FontAwesomeModule, CommonModule, DatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private readonly usuarios = inject(SignalStoreService);
  private readonly mensaje = inject(MessageService);

  //* ==================== ICONS ====================
  readonly open = faDoorOpen;
  readonly rotateright = faRotateRight;
  readonly arrowsrotate = faArrowsRotate;
  readonly triangleexclamation = faTriangleExclamation;
  readonly check = faCheck;

  //* ==================== SIGNALS ====================
  readonly fecha = signal(new Date().toISOString());

  //* ==================== EXPOSICIÓN DEL SERVICIO ====================
  readonly tokenInfo = this.usuarios.tokenInfo;
  readonly tokenStatus = this.usuarios.tokenStatus;
  readonly isAuthenticated = this.usuarios.isAuthenticated;
  readonly isLoading = computed(() => this.usuarios.TokenDecoded2.isLoading());

  //* ==================== COMPUTED ====================
  readonly userDisplayName = computed(
    () => this.tokenInfo()?.nombre || 'Usuario'
  );
  readonly userRole = computed(() => this.tokenInfo()?.role || 'Sin rol');

  readonly tokenCriticalState = computed(() => {
    const tokenInfo = this.tokenInfo();
    if (!tokenInfo?.tiempoRestante) return null;

    const timeRemaining = tokenInfo.tiempoRestante;
    const minutosMatch = timeRemaining.match(/(\d+)m/);

    if (minutosMatch) {
      const minutos = parseInt(minutosMatch[1], 10);

      if (minutos < 1) {
        return {
          type: 'critical',
          message: `⚠️ Token expirará en ${timeRemaining}`,
        };
      }

      if (minutos < 3) {
        return {
          type: 'warning',
          message: `Token expirará en ${timeRemaining}`,
        };
      }
    }

    return null;
  });

  //* ==================== CONSTRUCTOR ====================
  constructor() {
    this.setupTokenMonitoring();
    this.setupClockTimer();
  }

  //* ==================== EFFECTS ====================

  private setupTokenMonitoring(): void {
    effect(() => {
      const criticalState = this.tokenCriticalState();
      if (!criticalState) return;

      if (criticalState.type === 'warning') {
        this.mensaje.warning(criticalState.message);
      } else if (criticalState.type === 'critical') {
        this.mensaje.error(criticalState.message);
      }
    });
  }

  private setupClockTimer(): void {
    effect((onCleanup) => {
      this.fecha.set(new Date().toISOString());

      const interval = setInterval(() => {
        this.fecha.set(new Date().toISOString());
      }, 1000);

      onCleanup(() => clearInterval(interval));
    });
  }

  //* ==================== MÉTODOS PÚBLICOS ====================

  logout(): void {
    this.usuarios.logoutAndNavigate();
  }

  refreshTokenData(): void {
    this.usuarios.reloadTokenData();
  }

  //* ==================== HELPERS DE VISTA ====================

  getUserInitials(): string {
    const nombre = this.userDisplayName();
    return nombre
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  getRoleClass(role?: string): string {
    if (!role) return 'role-guest';
    const roleLower = role.toLowerCase();

    if (roleLower.includes('admin')) return 'role-admin';
    if (roleLower.includes('user') || roleLower.includes('usuario'))
      return 'role-user';

    return 'role-guest';
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
