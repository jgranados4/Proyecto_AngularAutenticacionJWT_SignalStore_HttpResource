import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { JsonPipe } from '@angular/common'; // Útil para debugging si se necesita

import { MessageService } from '../../core/services/message.service';
import { UsuariosStoreService } from '@app/core/services/usuariosStore.service';
import { passwordValidator } from '@app/shared/utility/passwordValidator';

@Component({
  selector: 'app-registrate',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './registrate.component.html',
  styleUrl: './registrate.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioStore = inject(UsuariosStoreService);
  private readonly msgService = inject(MessageService);
  private readonly router = inject(Router);

  isLoading = signal(false);

  // Formulario Tipado Estricto
  registerForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    // Internamente usamos 'password' (convención estándar), mapeamos al enviar.
    password: ['', [Validators.required, passwordValidator()]], 
    email: ['', [Validators.required, Validators.email]],
    rol: ['cliente', Validators.required], // Valor por defecto 'cliente'
  });

  // Signal derivada del valor del password (automático, sin subscribe manual)
  passwordValue = toSignal(this.registerForm.controls.password.valueChanges, { initialValue: '' });

  // Getter corto para el HTML
  get f() { return this.registerForm.controls; }

  // Lógica de fortaleza computada
  passwordStrength = computed(() => {
    const val = this.passwordValue();
    const errors = this.f.password.errors;

    if (!val) return null;
    if (!errors) return { color: 'is-success', val: 100, label: 'Fuerte' };

    // Cálculo compacto de reglas cumplidas
    const rules = [
      /(?=.*[a-z])/, /(?=.*[A-Z])/, /(?=.*\d)/, /(?=.*[\W_])/, /.{8,}/
    ];
    const passed = rules.filter(r => r.test(val)).length;

    if (passed <= 2) return { color: 'is-danger', val: 33, label: 'Débil' };
    if (passed <= 4) return { color: 'is-warning', val: 66, label: 'Media' };
    return { color: 'is-success', val: 100, label: 'Fuerte' };
  });

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    // Mapeo para el Backend: password -> Contrasena
    const { nombre, email, rol, password } = this.registerForm.getRawValue();
    const payload = { nombre, email, rol, Contrasena: password };

    this.usuarioStore.crear(payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.msgService.success(`Usuario ${nombre} registrado exitosamente`);
          this.router.navigateByUrl('/login');
        },
        error: (err) => {
          const backendErrors = err.error?.errors;
          // Manejo seguro de errores de backend
          if (backendErrors?.Contrasena || backendErrors?.contrasena) {
             const msg = backendErrors.Contrasena || backendErrors.contrasena;
             this.f.password.setErrors({ backend: Array.isArray(msg) ? msg[0] : msg });
          } else {
            this.msgService.error('Error al registrar usuario');
          }
        }
      });
  }
}