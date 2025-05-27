import { inject, Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  toastr = inject(ToastrService);

  constructor() {}
  success(message: string, title: string = 'Éxito') {
    this.toastr.success(message, title, {
      closeButton: true,
      progressBar: true,
    });
  }

  error(message: string, title: string = 'Error') {
    this.toastr.error(message, title, {
      closeButton: true,
      progressBar: true,
    });
  }

  warning(message: string, title: string = 'Advertencia') {
    this.toastr.warning(message, title, {
      closeButton: true,
      progressBar: true,
    });
  }

  info(message: string, title: string = 'Información') {
    this.toastr.info(message, title, {
      closeButton: true,
      progressBar: true,
    });
  }
}
