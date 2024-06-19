import { CommonModule } from '@angular/common';
import { Component, effect, model, signal } from '@angular/core';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent {
  active = model<boolean>(false);
  constructor() {
    effect(() => {
      console.log('active', this.active());
    });
  }
}
