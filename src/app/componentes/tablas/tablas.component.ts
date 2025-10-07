import {
  Component,
  computed,
  effect,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  NonNullableFormBuilder,
} from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faRepeat } from '@fortawesome/free-solid-svg-icons';
import { UsuariosStoreService } from '@app/core/services';
import { Usuario, UsuarioForm } from '@app/core/models/usuario';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-tablas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './tablas.component.html',
  styleUrl: './tablas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ OnPush para mejor rendimiento
})
export class TablasComponent {
  // ✅ Inyecciones funcionales
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);
  private destroyRef = inject(DestroyRef);
  readonly store = inject(UsuariosStoreService);

  // ✅ Signals para estado reactivo
  readonly tablaSeleccionada = signal<string>('tabla1');
  readonly clickAnimation = signal(false);
  readonly modoEdicion = signal<'crear' | 'editar' | null>(null);
  readonly usuarioEditando = signal<Usuario | null>(null);

  // ✅ Computed signals
  readonly isCreando = computed(() => this.modoEdicion() === 'crear');
  readonly isEditando = computed(() => this.modoEdicion() === 'editar');
  readonly mostrarTabla = computed(() => this.tablaSeleccionada() === 'tabla1');

  // ✅ Formulario tipado y reactivo
  readonly usuarioForm: FormGroup<UsuarioForm> = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    rol: ['', [Validators.required]],
  });

  // ✅ Formulario para edición inline
  readonly editForm: FormGroup<UsuarioForm> = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    rol: ['', Validators.required],
  });

  // ✅ Iconos
  readonly faRepeat = faRepeat;

  constructor() {
    // ✅ Effect para debugging (solo en desarrollo)
    effect(() => {
      console.log('Estado usuarios:', this.store.state());
    });
  }

  // ✅ Animación del botón de recarga
  activarAnimacion(): void {
    this.clickAnimation.set(true);
    setTimeout(() => this.clickAnimation.set(false), 1000);
  }

  // ✅ Crear nuevo usuario

  // ✅ Iniciar edición de usuario
  iniciarEdicion(usuario: Usuario): void {
    this.modoEdicion.set('editar');
    this.usuarioEditando.set(usuario);
    this.editForm.patchValue({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    });
  }

  // ✅ Guardar edición
  guardarEdicion(id: number): void {
    console.log('ide', id);
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const usuarioActualizado = this.editForm.getRawValue();
    this.store
      .updateUsuarioOptimistic(id, usuarioActualizado)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log('entro al backend');
          this.cancelarEdicion();
          this.store.reloadUsuarios();
        },
      });
  }

  // ✅ Cancelar edición
  cancelarEdicion(): void {
    this.modoEdicion.set(null);
    this.usuarioEditando.set(null);
    this.editForm.reset();
  }

  // ✅ Eliminar usuario individual
  eliminar(id: number): void {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.store.deleteUsuario(id);
    }
  }

  // ✅ Recargar datos
  recargar(): void {
    this.activarAnimacion();
  }

  // ✅ Scroll a tabla específica
  scrollATabla(tablaId: string): void {
    this.tablaSeleccionada.set(tablaId);

    // Scroll suave al elemento
    setTimeout(() => {
      const elemento = document.getElementById(tablaId);
      elemento?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  // ✅ Navegar a Home
  volverHome(): void {
    this.router.navigate(['/dashboard/Home']);
  }

  // ✅ Verificar si un usuario está en edición
  estaEditando(id: number): boolean {
    return this.isEditando() && this.usuarioEditando()?.id === id;
  }

  // ✅ Track function para @for
  trackByUsuarioId(_index: number, usuario: Usuario): number {
    return usuario.id!;
  }
}
