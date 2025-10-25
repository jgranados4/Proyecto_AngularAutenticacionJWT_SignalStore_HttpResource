import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService } from '../../core/services/message.service';
import { JsonPipe } from '@angular/common';
import { Router } from '@angular/router';
import { UsuariosStoreService } from '@app/core/services/usuariosStore.service';
import { passwordValidator } from '@app/shared/utility/passwordValidator';

@Component({
  selector: 'app-registrate',
  imports: [NavbarComponent, ReactiveFormsModule, JsonPipe],
  templateUrl: './registrate.component.html',
  styleUrl: './registrate.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrateComponent {
  //*inject
  usuario = inject(UsuariosStoreService);
  msj = inject(MessageService);
  router = inject(Router);
  fb = inject(FormBuilder);
  //*Formulario Reactivo
  formbuil = this.fb.group({
    nombre: ['', [Validators.required]],
    Contrasena: ['', [Validators.required, passwordValidator()]],
    email: ['', [Validators.required, Validators.email]],
    rol: ['', Validators.required],
  });
  private contrasenaControl = this.formbuil.get('Contrasena');
  //*Signal
  contrasenaValue = signal<string>('');
  constructor() {
    this.contrasenaControl?.valueChanges.subscribe((value) => {
      this.contrasenaValue.set(value || '');
    });
  }
  //*Computed
  passwordStrength = computed(() => {
    const value = this.contrasenaValue();
    const errors = this.contrasenaControl?.errors;

    if (!value) return { level: 'none', percentage: 0, label: '' };

    // Si no hay errores = contraseña fuerte
    if (!errors || Object.keys(errors).length === 0) {
      return {
        level: 'strong',
        percentage: 100,
        label: 'Fuerte',
        color: 'is-success',
      };
    }

    // Contar cuántas validaciones pasan
    const checks = {
      hasLowercase: /(?=.*[a-z])/.test(value),
      hasUppercase: /(?=.*[A-Z])/.test(value),
      hasDigit: /(?=.*\d)/.test(value),
      hasSpecial: /(?=.*[\W_])/.test(value),
      hasMinLength: value.length >= 8,
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    // Clasificar fortaleza
    if (passedChecks <= 2) {
      return {
        level: 'weak',
        percentage: 33,
        label: 'Débil',
        color: 'is-danger',
      };
    } else if (passedChecks <= 4) {
      return {
        level: 'medium',
        percentage: 66,
        label: 'Media',
        color: 'is-warning',
      };
    } else {
      return {
        level: 'strong',
        percentage: 100,
        label: 'Fuerte',
        color: 'is-success',
      };
    }
  });
  //*Registrar
  registrar() {
    const usuarioRegistrado = `Usuario: ${this.formbuil.value.nombre}\nCorreo: ${this.formbuil.value.email}\nTipo: ${this.formbuil.value.rol}`;
    this.usuario.crear(this.formbuil.value).subscribe({
      next: (data) => {
        const message = 'Registro Exitoso';
        this.msj.success(usuarioRegistrado, message);
        this.router.navigateByUrl('/login');
      },
      error: (error) => {
        console.log(error.error.errors?.Contrasena);
        const backendErrors = error.error.errors;
        if (backendErrors?.Contrasena || backendErrors?.contrasena) {
          // Manejar errores de contraseña del backend
          const mensajes = backendErrors.Contrasena || backendErrors.contrasena;
          this.contrasenaControl?.setErrors({
            backend: Array.isArray(mensajes) ? mensajes : [mensajes],
          });
          this.contrasenaControl?.markAsTouched();
        } else {
          this.msj.error('Error al registrar el usuario');
        }
      },
    });
  }
  //* Obtener errores de validación frontend
  getPasswordFrontendErrors(): string[] {
    const errors = this.contrasenaControl?.errors;
    if (!errors) return [];

    const messages: string[] = [];

    if (errors['required']) messages.push('La contraseña es requerida');
    if (errors['lowercase']) messages.push(errors['lowercase']);
    if (errors['uppercase']) messages.push(errors['uppercase']);
    if (errors['digit']) messages.push(errors['digit']);
    if (errors['special']) messages.push(errors['special']);
    if (errors['minlength']) messages.push(errors['minlength']);
    if (errors['maxlength']) messages.push(errors['maxlength']);

    return messages;
  }

  //* Obtener errores del backend
  getPasswordBackendErrors(): string[] {
    const control = this.contrasenaControl;
    if (control?.hasError('backend')) {
      const errors = control.getError('backend');
      return Array.isArray(errors) ? errors : [];
    }
    return [];
  }

  //* Verificar si mostrar errores
  shouldShowPasswordErrors(): boolean {
    const control = this.formbuil.get('Contrasena');
    return !!control && control.touched && control.invalid;
  }
}
