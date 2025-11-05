import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  AuthResponse2,
  tokenpayload2,
  refreshToken,
  LoginData,
} from '../models/AuthResponse';
import { CookieService } from 'ngx-cookie-service';
import { HttpGenericoService } from './HttpGenerico/http-generico.service';
import { environment } from 'src/environments/environment.development';
import { HttpHeaders } from '@angular/common/http';
import { Observable, retry, tap } from 'rxjs';
import { Router } from '@angular/router';
import { Login } from '../models/usuario';

@Injectable({ providedIn: 'root' })
export class SignalStoreService {
  private readonly cookies = inject(CookieService);
  private readonly HttpResource = inject(HttpGenericoService);
  private readonly router = inject(Router);
  private readonly URL = environment.url;
  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json; charset=utf-8',
  });

  private readonly TOKEN_KEY = 'token';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';

  //* ==================== SIGNALS ====================
  private readonly stateSignal = signal(this.cookies.get(this.TOKEN_KEY) || '');
  private readonly refreshTokenSignal = signal(
    this.cookies.get(this.REFRESH_TOKEN_KEY) || ''
  );
  private readonly contaSegundo = signal(0);
  private readonly isRefreshingToken = signal(false);
  private readonly lastRefreshTimestamp = signal(0);
  private readonly isNavigatingToLogin = signal(false);

  //* ==================== COMPUTED PÚBLICOS ====================
  readonly currentToken = computed(() => this.stateSignal());
  readonly currentRefreshToken = computed(() => this.refreshTokenSignal());
  readonly checkToken = computed(() => {
    const token = this.stateSignal();
    return !!token && token.trim().length > 0;
  });

  //* ==================== HTTP RESOURCE ====================
  TokenDecoded2 = this.HttpResource.get<AuthResponse2<tokenpayload2>>({
    url: `${this.URL}/UsuarioAUs/DecodeToken`,
    params: () => {
      const token = this.currentToken();
      return token && token.trim() ? { token } : undefined;
    },
  });

  RefreshToken(): Observable<refreshToken> {
    return this.HttpResource.mutate<refreshToken>({
      method: 'POST',
      url: `${this.URL}/RefreshToken/refresh`,
      body: { refreshToken: this.currentRefreshToken() },
      headers: this.headers,
    }).pipe(
      retry(1),
      tap((response)=>{
        this.updateToken(response.token)
        this.updateRefreshToken(response.refreshToken)
      })
    );
  }
   Login(datos: Login): Observable<AuthResponse2> {
      return this.HttpResource.mutate<AuthResponse2<LoginData>>({
        method: 'POST',
        url: `${this.URL}/UsuarioAUs/login`,
        body: datos,
        headers: this.headers,
      }).pipe(
        tap((response)=>{
          this.setToken(
            response.data.token,
            response.data.refreshToken
          );
        } )
      );
    }
  //* ==================== TIEMPO RESTANTE ====================
  tiempoRestanteSegundos = computed(() => {
    this.contaSegundo(); // Reactividad cada segundo

    if (!this.checkToken()) {
      return 0;
    }

    // Si el resource está cargando o no tiene datos, retornar -1 (estado desconocido)
    const resourceStatus = this.TokenDecoded2.status();
    if (resourceStatus === 'idle' || this.TokenDecoded2.isLoading()) {
      return -1; // -1 indica "calculando"
    }
    // Si hay error o no hay datos, retornar 0
    if (this.TokenDecoded2.error() || !this.TokenDecoded2.hasValue()) {
      return 0;
    }

    const tokenData = this.TokenDecoded2.value()?.data;
    if (!tokenData?.expiracion) {
      return 0;
    }

    try {
      const expiracionStr =
        tokenData.expiracion instanceof Date
          ? tokenData.expiracion.toISOString()
          : tokenData.expiracion;

      const segundosRestantes = Math.floor(
        (new Date(expiracionStr).getTime() - Date.now()) / 1000
      );

      return Math.max(0, segundosRestantes);
    } catch {
      return 0;
    }
  });
  //* ==================== TOKEN STATUS ====================
  tokenStatus = computed(() => {
  const segundos = this.tiempoRestanteSegundos();

  // Sin token en cookie
  if (!this.checkToken()) {
    return 'no-token';
  }

  // Estado desconocido (aún calculando)
  if (segundos === -1) {
    return 'validating';
  }

  // Token expirado (0 segundos o menos)
  if (segundos <= 0) {
    return 'expired';
  }

  // Token válido
  return 'valid';
  });
  isTokenExpired = computed(() => this.tokenStatus() === 'expired');
  tiempoRestante = computed(() => {
     const segundos = this.tiempoRestanteSegundos();

     if (segundos === -1) return 'Calculando...';
     if (segundos <= 0) return 'Expirado';

     const minutos = Math.floor(segundos / 60);
     const segs = segundos % 60;
     return `${minutos}m ${segs.toString().padStart(2, '0')}s`;
  });

  // Umbral: 3 minutos antes de expirar
  readonly needsRefreshSoon = computed(() => {
    const segundos = this.tiempoRestanteSegundos();
    return segundos > 0 && segundos <= 180; //3minutos
  });

  //* ==================== TOKEN INFO ====================
  tokenInfo = computed(() => {
    if (!this.TokenDecoded2.hasValue()) return null;

    const tokenData = this.TokenDecoded2.value().data;
    return {
      userId: tokenData.userId,
      email: tokenData?.email || '',
      nombre: tokenData.nombre,
      role: tokenData?.role || '',
      expiracion: tokenData?.expiracion || '',
      estaExpirado: this.isTokenExpired(),
      tiempoRestante: this.tiempoRestante(),
      tiempoRestanteSegundos: this.tiempoRestanteSegundos(),
    };
  });

  isAuthenticated = computed(() => this.tokenStatus() === 'valid');

  //* ==================== CONSTRUCTOR ====================
  constructor() {
    this.startTickerTimer();
    effect(() => {
       const status = this.tokenStatus();
       const segundos = this.tiempoRestanteSegundos();

       // 🔥 Logging para debug (puedes comentarlo después)
       console.log(`🕐 Status: ${status}, Segundos: ${segundos}`);

       // Si el token expiró (status === 'expired'), cerrar sesión
       if (status === 'expired' && segundos === 0) {
         console.warn('⏰ Token expirado detectado → cerrando sesión');

         // Importante: NO llamar logout aquí directamente para evitar loops
         // Usar setTimeout para ejecutar en el siguiente tick
         setTimeout(() => {
           this.logoutAndNavigate();
         }, 0);
       }
    });
  }

  //* ==================== EFFECTS ====================

  // Effect 1: Timer cada segundo
  private startTickerTimer(): void {
    effect((onCleanup) => {
      // Si no hay token, resetear contador
      if (!this.checkToken()) {
        this.contaSegundo.set(0);
        return;
      }

      // 🔥 NUEVO: Si el token ya expiró, NO iniciar el timer
      if (this.isTokenExpired()) {
        console.log('⏹️ Token expirado - timer detenido');
        return;
      }

      const interval = setInterval(() => {
        // 🔥 NUEVO: Verificar expiración antes de cada tick
        if (this.isTokenExpired()) {
          console.log('⏹️ Token expiró durante timer - deteniendo');
          clearInterval(interval);
          return;
        }

        this.contaSegundo.update((tick) => tick + 1);
      }, 1000);

      onCleanup(() => {
        clearInterval(interval);
        console.log('🧹 Timer limpiado');
      });
    });
  }

  //* ==================== MUTACIÓN DE TOKENS ====================

  setToken(token: string, refreshToken?: string): void {
    if (!token || token.trim() === '') {
      console.warn('⚠️ Token vacío');
      return;
    }

    this.stateSignal.set(token);
    this.cookies.set(this.TOKEN_KEY, token, {
      path: '/',
      secure: environment.production,
      sameSite: 'Strict',
      expires: 0.0208,
    });

    if (refreshToken?.trim()) {
      this.updateRefreshToken(refreshToken);
    }

    this.isNavigatingToLogin.set(false);
    this.contaSegundo.set(0);
    this.TokenDecoded2.reload();
    console.log('✅ Token guardado');
  }

  updateToken(newToken: string): void {
    if (!newToken || newToken.trim() === '') return;

    this.stateSignal.set(newToken);
    this.cookies.set(this.TOKEN_KEY, newToken, {
      path: '/',
      secure: environment.production,
      sameSite: 'Strict',
      expires: 0.0208,
    });
    this.contaSegundo.set(0);
  }

  updateRefreshToken(newRefreshToken: string): void {
    if (!newRefreshToken || newRefreshToken.trim() === '') return;

    this.refreshTokenSignal.set(newRefreshToken);
    this.cookies.set(this.REFRESH_TOKEN_KEY, newRefreshToken, {
      path: '/',
      secure: environment.production,
      sameSite: 'Strict',
      expires: 7, // 90 días
    });
  }

  logout(): void {
    this.stateSignal.set('');
    this.refreshTokenSignal.set('');
    this.isRefreshingToken.set(false);
    this.lastRefreshTimestamp.set(0);
    this.contaSegundo.set(0);
    this.cookies.delete(this.TOKEN_KEY, '/');
    this.cookies.delete(this.REFRESH_TOKEN_KEY, '/');
  }

  logoutAndNavigate(returnUrl?: string): void {
    // Protección contra navegaciones múltiples
    if (this.isNavigatingToLogin()) {
      console.log('⏭️ Ya navegando a login');
      return;
    }

    this.isNavigatingToLogin.set(true);
    this.logout();
    const currentUrl = this.router.url;
    const publicRoutes = ['/login', '/registrar'];
    const isPublic = publicRoutes.some((route) => currentUrl.startsWith(route));
    if (isPublic) {
      // Ya estamos en ruta pública → no hacemos navegación
      this.isNavigatingToLogin.set(false);
      return;
    }
    const targetReturnUrl = returnUrl ?? currentUrl;
    this.router
      .navigate(['/login'], {
        queryParams: { returnUrl: targetReturnUrl },
        replaceUrl: true,
      })
      .then((navigated) => {
        if (!navigated) {
          console.warn('⚠️ Navegación falló, forzando...');
          window.location.href = '/login';
        }
        this.isNavigatingToLogin.set(false);
      })
      .catch((error) => {
        console.error('❌ Error navegando a login:', error);
        window.location.href = '/login';
        this.isNavigatingToLogin.set(false);
      });
  }

  //* ==================== MÉTODOS PÚBLICOS ====================

  reloadTokenData(): void {
    this.TokenDecoded2.reload();
  }

  hasValidSession(): boolean {
    const status = this.tokenStatus();
    return status === 'valid' || status === 'validating';
  }
  startRefreshing(): void {
    this.isRefreshingToken.set(true);
    this.lastRefreshTimestamp.set(Date.now());
  }
  canRefreshNow(): boolean {
    const lastRefresh = this.lastRefreshTimestamp();
    const now = Date.now();
    const COOLDOWN_MS = 30000; // 30 segundos

    return !lastRefresh || now - lastRefresh >= COOLDOWN_MS;
  }
  /**
   * ✅ Marca que el refresh finalizó
   */
  finishRefreshing(): void {
    this.isRefreshingToken.set(false);
  }
  isRefreshing(): boolean {
    return this.isRefreshingToken();
  }
}
