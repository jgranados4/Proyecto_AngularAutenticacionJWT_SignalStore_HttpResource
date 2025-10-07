import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { AuthResponse2, tokenpayload2 } from '../models/AuthResponse';
import { CookieService } from 'ngx-cookie-service';
import { HttpGenericoService } from './HttpGenerico/http-generico.service';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class SignalStoreService {
  private readonly cookies = inject(CookieService);
  private readonly HttpResource = inject(HttpGenericoService);
  private readonly URL = environment.url;
  //* ========== STATE ==========
  private readonly stateSignal = signal<string>(
    this.cookies.get('token') || ''
  );
  /**
   * RefreshToken (privado)
   */
  private readonly refreshTokenSignal = signal<string>(
    this.cookies.get('refreshToken') || ''
  );
  //* ==================== SIGNALS BÁSICOS ====================
  /**
   * Token actual (readonly)
   */
  readonly currentToken = computed(() => this.stateSignal());
  /**
   * RefreshToken actual (readonly)
   */
  readonly currentRefreshToken = computed(() => this.refreshTokenSignal());

  /**
   * Verifica si existe token
   */
  readonly checkToken = computed(() => !!this.stateSignal());
  //* ==================== ENDPOINTS ====================
  TokenDecoded2 = this.HttpResource.get<AuthResponse2<tokenpayload2>>({
    url: `${this.URL}/UsuarioAUs/DecodeToken`,
    params: () => {
      const token = this.stateSignal();
      // Solo hacer request si hay token
      return token ? { token } : undefined;
    },
  });
  //* ==================== COMPUTED SIGNALS DERIVADOS ====================
  tokenStatus = computed(() => {
    const token = this.stateSignal();

    if (!token) return 'no-token';
    if (this.TokenDecoded2.isLoading()) return 'validating';
    if (this.TokenDecoded2.error()) return 'error';
    if (this.isTokenExpired()) return 'expired';

    return 'valid';
  });
  isTokenExpired = computed(() => {
    if (!this.TokenDecoded2.hasValue()) {
      return false; // No expirado si aún no tenemos datos
    }
    const tokenData = this.TokenDecoded2.value().data;
    // Verificar por tiempoRestante (en segundos)
    if (tokenData?.tiempoRestante !== undefined) {
      return tokenData.tiempoRestante <= 0;
    }
    // Verificar por fecha de expiración
    if (!tokenData?.expiracion) {
      return true;
    }
    const expiracion = new Date(tokenData.expiracion).getTime();
    const ahora = Date.now();
    return ahora >= expiracion;
  });
  tokenInfo = computed(() => {
    if (!this.TokenDecoded2.hasValue()) {
      return null;
    }
    const tokenData = this.TokenDecoded2.value().data;
    return {
      userId: tokenData.userId,
      email: tokenData?.email || '',
      nombre: tokenData.nombre,
      role: tokenData?.role || '',
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
  isAuthenticated = computed(() => {
    return this.tokenStatus() === 'valid';
  });
  reload = computed(() => this.TokenDecoded2.reload());
  //* ==================== MÉTODOS DE MUTACIÓN ====================

  /**
   * Establece un nuevo token
   * ✅ Automáticamente dispara la recarga de TokenDecoded
   */
  setToken(token: string, refreshToken?: string): void {
    // 1. Actualizar signal
    this.stateSignal.set(token);

    // 2. Sincronizar con cookies (side-effect explícito)
    if (token) {
      this.cookies.set('token', token, {
        path: '/',
        secure: true,
        sameSite: 'Strict',
        expires: 7,
      });
      console.log('✅ Token guardado');
    } else {
      this.cookies.delete('token', '/');
    }

    // 3. Manejar refreshToken si existe
    if (refreshToken) {
      this.refreshTokenSignal.set(refreshToken);
      this.cookies.set('refreshToken', refreshToken, {
        path: '/',
        secure: true,
        sameSite: 'Strict',
        expires: 30,
      });
      console.log('✅ RefreshToken guardado');
    }
  }
  /**
   * Actualiza solo el token de acceso
   */
  updateToken(newToken: string): void {
    this.stateSignal.set(newToken);

    this.cookies.set('token', newToken, {
      path: '/',
      secure: true,
      sameSite: 'Strict',
      expires: 7
    });
  }

  /**
   * Actualiza solo el refreshToken
   */
  updateRefreshToken(newRefreshToken: string): void {
    this.refreshTokenSignal.set(newRefreshToken);

    this.cookies.set('refreshToken', newRefreshToken, {
      path: '/',
      secure: true,
      sameSite: 'Strict',
      expires: 30,
    });
  }
  logout(): void {
    // Limpiar todo de forma explícita
    this.stateSignal.set('');
    this.refreshTokenSignal.set('');
    this.cookies.delete('token', '/');
    this.cookies.delete('refreshToken', '/');
  }
  reloadTokenData(): void {
    this.TokenDecoded2.reload();
  }
  //* ==================== UTILIDADES ====================
  private calcularTiempoRestante(
    expiracion?: string,
    tiempoRestanteSegundos?: number
  ): string {
    try {
      let diferenciaMs: number;

      // Caso 1: Si viene tiempoRestante en segundos
      if (tiempoRestanteSegundos !== undefined) {
        diferenciaMs = tiempoRestanteSegundos * 1000; // Convertir a milisegundos
      }
      // Caso 2: Si viene fecha de expiración ISO
      else if (expiracion) {
        const expTimestamp = new Date(expiracion).getTime();
        const ahora = Date.now();
        diferenciaMs = expTimestamp - ahora;
      }
      // Caso 3: No hay información
      else {
        return 'Desconocido';
      }

      // Si ya expiró
      if (diferenciaMs <= 0) {
        return 'Expirado';
      }

      // Calcular unidades de tiempo
      const segundos = Math.floor(diferenciaMs / 1000);
      const minutos = Math.floor(segundos / 60);
      const horas = Math.floor(minutos / 60);
      const dias = Math.floor(horas / 24);

      // Formatear según la cantidad de tiempo restante
      if (dias > 0) {
        const horasRestantes = horas % 24;
        return horasRestantes > 0 ? `${dias}d ${horasRestantes}h` : `${dias}d`;
      } else if (horas > 0) {
        const minutosRestantes = minutos % 60;
        return minutosRestantes > 0
          ? `${horas}h ${minutosRestantes}m`
          : `${horas}h`;
      } else if (minutos > 0) {
        const segundosRestantes = segundos % 60;
        return segundosRestantes > 0
          ? `${minutos}m ${segundosRestantes}s`
          : `${minutos}m`;
      } else {
        return `${segundos}s`;
      }
    } catch (error) {
      console.error('Error calculando tiempo restante:', error);
      return 'Error calculando';
    }
  }
  debugTokenState(): void {
    console.group('🔐 Auth Store Debug');
    console.table({
      'Cookie Exists': this.cookies.check('token'),
      'Cookie Value': this.cookies.get('token')?.substring(0, 20) + '...',
      'Signal Check': this.checkToken(),
      'Signal Token': this.currentToken()?.substring(0, 20) + '...',
      'Is Authenticated': this.isAuthenticated(),
      'Token Status': this.tokenStatus(),
      'Is Loading': this.TokenDecoded2.isLoading(),
      'Has Error': !!this.TokenDecoded2.error(),
    });

    const info = this.tokenInfo();
    if (info) {
      console.log('Token Info:', info);
    }

    console.groupEnd();
  }
}
