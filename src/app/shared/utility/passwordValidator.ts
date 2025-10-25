import { AbstractControl, ValidationErrors } from "@angular/forms";

// ✅ VALIDADOR PERSONALIZADO DE CONTRASEÑA
export function passwordValidator() {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Lo maneja 'required'
    }

    const errors: ValidationErrors = {};

    // Validaciones específicas
    if (!/(?=.*[a-z])/.test(value)) {
      errors['lowercase'] = 'Debe contener al menos una minúscula';
    }

    if (!/(?=.*[A-Z])/.test(value)) {
      errors['uppercase'] = 'Debe contener al menos una mayúscula';
    }

    if (!/(?=.*\d)/.test(value)) {
      errors['digit'] = 'Debe contener al menos un número';
    }

    if (!/(?=.*[\W_])/.test(value)) {
      errors['special'] = 'Debe contener al menos un carácter especial';
    }

    if (value.length < 8) {
      errors['minlength'] = 'Debe tener al menos 8 caracteres';
    }

    if (value.length > 100) {
      errors['maxlength'] = 'No debe exceder 100 caracteres';
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}
