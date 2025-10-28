import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { Login, Usuario } from '../models/usuario';
import { UsuariosService } from './usuarios.service';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { AuthResponse2, LoginData } from '../models/AuthResponse';
interface UsuariosState {
  error: string | null;
}
@Injectable({
  providedIn: 'root',
})
export class UsuariosStoreService {
  readonly #usuarioService = inject(UsuariosService);
  /**
   * Recurso HTTP reactivo - Se actualiza automáticamente
   * Expone: value(), hasValue(), isLoading(), error()
   */
  readonly usuariosResource = this.#usuarioService.GetUsuario;
  // ===== Estado local adicional (no cubierto por httpResource) =====
  readonly #stateSignal = signal<UsuariosState>({
    error: null,
  });
  // ===== Signals públicos derivados de httpResource =====

  /**
   * Lista de usuarios - Directamente desde httpResource
   */
  readonly usuarios: Signal<Usuario[]> = computed(() => {
    const value = this.usuariosResource.hasValue()
      ? this.usuariosResource.value().data
      : [];
    return Array.isArray(value) ? value : [];
  });

  /**
   * Estado de carga - Desde httpResource
   */
  readonly loading: Signal<boolean> = computed(() =>
    this.usuariosResource.isLoading()
  );

  /**
   * Error de carga de usuarios - Desde httpResource
   */
  readonly loadingError: Signal<any> = computed(() =>
    this.usuariosResource.error()
  );

  // ✅ Método para recargar manualmente
  reloadUsuarios(): void {
    this.usuariosResource.reload();
  }

  /**
   * Error general (login, crear, etc.) - Desde state local
   */
  readonly error: Signal<string | null> = computed(
    () => this.#stateSignal().error
  );

  /**
   * Computed: Indica si hay algún error (de carga o de operaciones)
   */
  readonly hasError: Signal<boolean> = computed(
    () => this.loadingError() !== null || this.error() !== null
  );

  /**
   * Computed: Cuenta total de usuarios
   */
  readonly usuariosCount: Signal<number> = computed(
    () => this.usuarios().length
  );

  /**
   * Computed: Estado completo combinado
   */
  readonly state = computed(() => ({
    usuarios: this.usuarios(),
    loading: this.loading(),
    loadingError: this.loadingError(),
    error: this.error(),
    hasError: this.hasError(),
    count: this.usuariosCount(),
  }));
  // ===== Métodos privados =====

  readonly #patchState = (patch: Partial<UsuariosState>): void => {
    this.#stateSignal.update((state) => ({ ...state, ...patch }));
  };
  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Crear usuario - Usa tu endpoint CrearUsuario
   * Después de crear, refresca automáticamente la lista
   */
  crear(datos: any): Observable<any> {
    this.#patchState({ error: null });
    console.log('registro', datos);
    return this.#usuarioService.CrearUsuario(datos).pipe(
      tap((response) => {
        console.log('✅ Usuario creado:', response);
      }),
      catchError((err) => {
        const message = err?.message ?? 'Error al crear usuario';
        this.#patchState({ error: message });
        return throwError(() => err);
      })
    );
  }

  /**
   * Actualizar usuario en la lista (optimistic update)
   * Nota: Como usuarios viene de httpResource, esto NO muta el recurso
   * Es solo para updates optimistas en la UI, deberías hacer una petición real
   */
  updateUsuarioOptimistic(
    id: number,
    usuarioActualizado: Usuario
  ): Observable<any> {
    this.#patchState({ error: null });
    console.log('Actualizar', usuarioActualizado);
    return this.#usuarioService.EditarUsuario(id, usuarioActualizado).pipe(
      tap((response) => {
        console.log('✅ Usuario editado:', response);
      }),
      catchError((err) => {
        const message = err?.message ?? 'Error al Actualizar usuario';
        this.#patchState({ error: message });
        return throwError(() => err);
      })
    );
  }

  /**
   * Eliminar usuario (debe hacer petición DELETE al backend)
   */
  deleteUsuario(usuarioId: number): Observable<any> {
    this.#patchState({ error: null });
    console.log('Eliminar', usuarioId);
    return this.#usuarioService.EliminarUsuario(usuarioId).pipe(
      tap((response) => {
        console.log('✅ Usuario editado:', response);
      }),
      catchError((err) => {
        const message = err?.message ?? 'Error al eliminar el  usuario';
        this.#patchState({ error: message });
        return throwError(() => err);
      })
    );
  }

  /**
   * Buscar usuario por ID en la lista cargada
   */
  findUsuarioById(id: number): Signal<Usuario | undefined> {
    return computed(() => this.usuarios().find((u) => u.id === id));
  }

  /**
   * Filtrar usuarios por criterio
   */
  filterUsuarios(predicate: (u: Usuario) => boolean): Signal<Usuario[]> {
    return computed(() => this.usuarios().filter(predicate));
  }

  /**
   * Limpiar error local (no afecta errores de httpResource)
   */
  clearError(): void {
    this.#patchState({ error: null });
  }

  /**
   * Resetear solo el estado local (no afecta httpResource)
   */
  reset(): void {
    this.#patchState({
      error: null,
    });
  }
}
