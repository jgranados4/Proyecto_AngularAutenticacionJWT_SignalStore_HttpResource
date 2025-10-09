import { computed, effect, inject, Injectable, signal } from '@angular/core';
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

  //* ========== COOKIES KEYS ==========
  private readonly TOKEN_KEY = 'token';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';

  //* ========== STATE SIGNALS ==========
  /**
   * ✅ Inicializa desde cookies de forma segura
   */
  private readonly stateSignal = signal<string>(
    this.cookies.get(this.TOKEN_KEY) || ''
  );
  /**
   * RefreshToken (privado)
   */
  private readonly refreshTokenSignal = signal<string>(
    this.cookies.get(this.REFRESH_TOKEN_KEY) || ''
  );

  //* ==================== SIGNALS PÚBLICOS ====================
  readonly currentToken = computed(() => this.stateSignal());
  readonly currentRefreshToken = computed(() => this.refreshTokenSignal());
  readonly checkToken = computed(() => {
    const token = this.stateSignal();
    return !!token && token.trim().length > 0;
  });

  //* ==================== HTTP RESOURCE ====================
  /**
   * ✅ Resource solo se ejecuta si hay token válido
   */
  TokenDecoded2 = this.HttpResource.get<AuthResponse2<tokenpayload2>>({
    url: `${this.URL}/UsuarioAUs/DecodeToken`,
    params: () => {
      const token = this.currentToken();
      // Solo hacer request si hay token válido (no vacío)
      return token && token.trim() ? { token } : undefined;
    },
  });

  //* ==================== COMPUTED SIGNALS DERIVADOS ====================
  /**
   * ✅ OPTIMIZADO: Token status con manejo correcto de todos los estados
   */
  tokenStatus = computed(() => {
    const token = this.stateSignal();

    // 1️⃣ Sin token
    if (!token || token.trim() === '') {
      return 'no-token';
    }

    // 2️⃣ Resource no se ha ejecutado (idle)
    const resourceStatus = this.TokenDecoded2.status();
    if (resourceStatus === 'idle') {
      // Si hay token pero resource está idle, probablemente params retornó undefined
      return 'no-token';
    }

    // 3️⃣ Cargando SOLO si no hay valor previo
    if (this.TokenDecoded2.isLoading()) {
      return 'validating';
    }

    // 4️⃣ Error en la decodificación
    if (this.TokenDecoded2.error()) {
      this.logout();
      console.error(
        '❌ Error decodificando token:',
        this.TokenDecoded2.error()
      );
      return 'error';
    }

    // 5️⃣ Token decodificado - Verificar expiración
    if (this.TokenDecoded2.hasValue()) {
      const tokenData = this.TokenDecoded2.value().data;

      // Verificar expiración por tiempoRestante (prioritario)
      if (tokenData?.tiempoRestante !== undefined) {
        const isExpired = tokenData.tiempoRestante <= 0;
        return isExpired ? 'expired' : 'valid';
      }

      // Verificar por fecha de expiración
      if (tokenData?.expiracion) {
        const expiracion = new Date(tokenData.expiracion).getTime();
        const ahora = Date.now();
        const bufferMs = 60000; // 1 minuto de buffer

        const isExpired = ahora >= expiracion - bufferMs;
        return isExpired ? 'expired' : 'valid';
      }

      // Si no hay info de expiración, considerar válido
      return 'valid';
    }

    // 6️⃣ Fallback: considerar expirado si no hay datos
    return 'expired';
  });

  /**
   * ✅ OPTIMIZADO: Verificación de expiración sin computed anidado
   */
  isTokenExpired = computed(() => {
    const status = this.tokenStatus();
    return status === 'expired';
  });

  /**
   * ✅ Información detallada del token
   */
  tokenInfo = computed(() => {
    if (!this.TokenDecoded2.hasValue()) {
      return null;
    }

    const tokenData = this.TokenDecoded2.value().data;
    const expiracionStr =
      typeof tokenData?.expiracion === 'string'
        ? tokenData.expiracion
        : tokenData?.expiracion instanceof Date
        ? tokenData.expiracion.toISOString()
        : undefined;

    return {
      userId: tokenData.userId,
      email: tokenData?.email || '',
      nombre: tokenData.nombre,
      role: tokenData?.role || '',
      expiracion: tokenData?.expiracion || '',
      estaExpirado: this.isTokenExpired(),
      tiempoRestante: this.calcularTiempoRestante(
        expiracionStr,
        tokenData?.tiempoRestante
      ),
      tiempoRestanteSegundos: tokenData?.tiempoRestante,
    };
  });

  /**
   * ✅ Usuario autenticado (token válido)
   */
  isAuthenticated = computed(() => {
    return this.tokenStatus() === 'valid';
  });

  /**
   * ✅ Verificar si hay sesión persistida (al iniciar app)
   */
  hasPersistedSession = computed(() => {
    const token = this.stateSignal();
    const refreshToken = this.refreshTokenSignal();
    return !!(token && refreshToken);
  });

  //* ==================== CONSTRUCTOR CON DEBUGGING ====================
  constructor() {
    // 🔍 Effect para debugging (solo en desarrollo)
    if (!environment.production) {
      effect(() => {
        const status = this.tokenStatus();
        console.log(`📊 Token Status Changed: ${status}`);

        if (status === 'validating') {
          console.log('⏳ Resource loading...');
        }

        if (status === 'valid') {
          const info = this.tokenInfo();
          console.log('✅ Token válido:', {
            usuario: info?.nombre,
            expira: info?.tiempoRestante,
          });
        }
      });
    }

    // ✅ Log inicial de sesión persistida
    if (this.hasPersistedSession()) {
      console.log('🔐 Sesión persistida detectada al iniciar');
    }
  }

  //* ==================== MÉTODOS DE MUTACIÓN ====================
  /**
   * ✅ Establece nuevo token + refreshToken
   * Persiste en cookies de forma segura
   */
  setToken(token: string, refreshToken?: string): void {
    // 1. Validar token
    if (!token || token.trim() === '') {
      console.warn('⚠️ Intentando establecer token vacío');
      return;
    }

    // 2. Actualizar signal
    this.stateSignal.set(token);

    // 3. Persistir en cookie
    this.cookies.set(this.TOKEN_KEY, token, {
      path: '/',
      secure: environment.production, // Solo HTTPS en producción
      sameSite: 'Strict',
      expires: 0.0208, // 7 días
    });

    console.log('✅ Token guardado');

    // 4. Manejar refreshToken si existe
    if (refreshToken && refreshToken.trim()) {
      this.updateRefreshToken(refreshToken);
    }
  }

  /**
   * ✅ Actualiza solo el token de acceso
   */
  updateToken(newToken: string): void {
    if (!newToken || newToken.trim() === '') {
      console.warn('⚠️ Intentando actualizar con token vacío');
      return;
    }

    this.stateSignal.set(newToken);

    this.cookies.set(this.TOKEN_KEY, newToken, {
      path: '/',
      secure: environment.production,
      sameSite: 'Strict',
      expires: 0.0208,
    });

    console.log('✅ Token actualizado');
  }

  /**
   * ✅ Actualiza solo el refreshToken
   */
  updateRefreshToken(newRefreshToken: string): void {
    if (!newRefreshToken || newRefreshToken.trim() === '') {
      console.warn('⚠️ Intentando actualizar con refresh token vacío');
      return;
    }

    this.refreshTokenSignal.set(newRefreshToken);

    this.cookies.set(this.REFRESH_TOKEN_KEY, newRefreshToken, {
      path: '/',
      secure: environment.production,
      sameSite: 'Strict',
      expires: 7,
    });

    console.log('✅ Refresh token actualizado');
  }

  /**
   * ✅ Cierra sesión y limpia todo
   */
  logout(): void {
    console.log('🚪 Cerrando sesión...');

    // Limpiar signals
    this.stateSignal.set('');
    this.refreshTokenSignal.set('');

    // Limpiar cookies
    this.cookies.delete(this.TOKEN_KEY, '/');
    this.cookies.delete(this.REFRESH_TOKEN_KEY, '/');

    console.log('✅ Sesión cerrada - Estado limpiado');
  }

  /**
   * ✅ Recarga manual del resource
   */
  reloadTokenData(): void {
    console.log('🔄 Recargando datos del token...');
    this.TokenDecoded2.reload();
  }

  /**
   * ✅ Verifica si hay sesión válida (útil para guards)
   */
  hasValidSession(): boolean {
    const status = this.tokenStatus();
    return status === 'valid' || status === 'validating';
  }

  //* ==================== HELPERS PRIVADOS ====================

  /**
   * ✅ Calcula tiempo restante en formato legible
   */
  private calcularTiempoRestante(
    expiracion?: string,
    tiempoRestanteSegundos?: number
  ): string {
    try {
      let diferenciaMs: number;

      // Caso 1: Si viene tiempoRestante en segundos (prioritario)
      if (tiempoRestanteSegundos !== undefined) {
        diferenciaMs = tiempoRestanteSegundos * 1000;
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
      console.error('❌ Error calculando tiempo restante:', error);
      return 'Error';
    }
  }

  //* ==================== DEBUG ====================

  /**
   * 🔍 Información de debugging detallada
   */
  debugTokenState(): void {
    console.group('🔐 Auth Store Debug');

    // Estado de cookies
    console.log('📦 Cookies:', {
      tokenExists: this.cookies.check(this.TOKEN_KEY),
      refreshTokenExists: this.cookies.check(this.REFRESH_TOKEN_KEY),
      tokenPreview: this.cookies.get(this.TOKEN_KEY)?.substring(0, 30) + '...',
    });

    // Estado de signals
    console.log('⚡ Signals:', {
      checkToken: this.checkToken(),
      tokenStatus: this.tokenStatus(),
      isAuthenticated: this.isAuthenticated(),
      hasPersistedSession: this.hasPersistedSession(),
    });

    // Estado del resource
    console.log('📡 Resource:', {
      status: this.TokenDecoded2.status(),
      isLoading: this.TokenDecoded2.isLoading(),
      hasValue: this.TokenDecoded2.hasValue(),
      hasError: !!this.TokenDecoded2.error(),
      errorMessage: this.TokenDecoded2.error()?.message || 'N/A',
    });

    // Info del token
    const info = this.tokenInfo();
    if (info) {
      console.log('ℹ️ Token Info:', {
        usuario: info.nombre,
        email: info.email,
        role: info.role,
        expirado: info.estaExpirado,
        tiempoRestante: info.tiempoRestante,
      });
    } else {
      console.log('ℹ️ Token Info: No disponible');
    }

    console.groupEnd();
  }

  /**
   * 🧪 Simular expiración (solo para testing)
   */
  _debugForceExpire(): void {
    if (environment.production) {
      console.warn('⚠️ debugForceExpire solo disponible en desarrollo');
      return;
    }

    // Forzar recarga del resource
    this.reloadTokenData();
    console.log('🧪 Token forzado a revalidar');
  }
}
