import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-iniciar',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './iniciar.component.html',
  styleUrl: './iniciar.component.css',
})
export class IniciarComponent {}
