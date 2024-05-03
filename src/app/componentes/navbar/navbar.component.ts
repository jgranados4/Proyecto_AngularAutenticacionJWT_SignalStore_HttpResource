import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsuariosService } from '../../core/services/usuarios.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  usuarios = inject(UsuariosService);
  logout(): void {
    this.usuarios.logout();
  }
  //obtener el nombre del token
  Token(): string | void {
    return this.usuarios.getToken();
  }
}
