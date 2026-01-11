import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  DestroyRef
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
// Asumimos que estos existen según tu código original
import { Login } from '../../core/models/usuario';
import { MessageService } from '../../core/services/message.service';
import { SignalStoreService } from '@app/core/services/TokenStore.service';

@Component({
  selector: 'app-iniciar',
  standalone: true,
  imports: [ReactiveFormsModule], // JsonPipe removido de imports si no se usa en debug
  templateUrl: './iniciar.component.html',
  styleUrl: './iniciar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IniciarComponent {
  // Inyeccion de dependencias moderna
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(SignalStoreService);
  private readonly router = inject(Router);
  private readonly msgService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  // Estado reactivo con Signals (para UI feedback)
  isLoading = signal<boolean>(false);

  // Formulario Tipado y No-Nulo (Reduce validaciones de null en HTML)
  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20)]],
  });

  // Getter para reducir verbosidad en el HTML
  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { email, password } = this.loginForm.getRawValue();

    // Mapeo de datos (Desacoplando nombre de variable UI vs API)
    const payload: Login = {
      email,
      constrasena: password // Mapeamos 'password' a la propiedad 'constrasena' que espera tu API
    };

    this.authStore.Login(payload)
      .pipe(
        // Finalize asegura que el loading se apague sea éxito o error
        finalize(() => this.isLoading.set(false)),
        // Previene fugas de memoria si el componente se destruye durante la petición
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          // Manejo seguro de la respuesta
          const token = response?.data?.token;
          const refresh = response?.data?.refreshToken;
          
          if (token) {
            this.authStore.setToken(token, refresh);
            this.msgService.success('Bienvenido al sistema');
            this.router.navigate(['/dashboard/Tablas']);
          }
        },
        error: (err: any) => {
          console.error('Error en login:', err);
          // Opcional: Mostrar error específico del backend si existe
          const errorMsg = err?.error?.message || 'Error al iniciar sesión';
          this.msgService.error(errorMsg); // Asumiendo que tu servicio tiene método error
        },
      });
  }
}