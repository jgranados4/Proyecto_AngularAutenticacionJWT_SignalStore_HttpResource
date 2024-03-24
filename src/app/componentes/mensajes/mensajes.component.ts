import { Component, OnInit } from '@angular/core';
import { MessageService } from '../../core/services/message.service';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [],
  templateUrl: './mensajes.component.html',
  styleUrl: './mensajes.component.css',
})
export class MensajesComponent implements OnInit {
  messageExito: string = '';
  constructor(private mensajes: MessageService) {}
  ngOnInit(): void {
    this.mensajes.getMessage().subscribe((message) => {
      this.messageExito = message;
    });
  }
}
