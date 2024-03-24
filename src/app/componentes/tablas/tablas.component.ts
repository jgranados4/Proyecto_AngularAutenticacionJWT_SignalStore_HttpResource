import { Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { ContenidoServicesService } from '../../core/services/contenido-services.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Usuario } from '../../core/models/usuario';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MensajesComponent } from '../mensajes/mensajes.component';
import { MessageService } from '../../core/services/message.service';

@Component({
  selector: 'app-tablas',
  standalone: true,
  imports: [FormsModule, NavbarComponent, MensajesComponent, CommonModule],
  templateUrl: './tablas.component.html',
  styleUrl: './tablas.component.css',
})
export class TablasComponent implements OnInit {
  //*Variables
  isSelected: boolean = false;
  datos: Usuario<any> = { nombre: '', apellido: '', estado: '' };
  myObservables$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  isEditing: string = '';
  messageBoolean: boolean = false;
  private mensajeSubscription: Subscription = new Subscription();
  //
  constructor(
    private renderer: Renderer2,
    private contenido: ContenidoServicesService,
    private msj: MessageService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.contenido.GetContenido(1).subscribe({
      next: (data: any) => {
        const filterData = data.filter(
          (item: Usuario<any>) => item.estado !== 'I'
        );
        this.myObservables$.next(filterData);
        this.isEditing = 'crear';
        setTimeout(() => {
          this.messageBoolean = false;
        }, 1000);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }
  //
  MouseEnter(): void {
    this.isSelected = true;
  }
  MouseLeave(): void {
    this.isSelected = false;
  }
  //Crear
  crear() {
    console.log('Crear', this.datos);
    this.contenido.PostContenido(this.datos).subscribe({
      next: (datos: any) => {
        setTimeout(() => {
          console.log(datos);
          const message = 'creado con exito';
          this.msj.sendMessage(message);
          this.messageBoolean = true;
          this.ngOnInit();
        }, 1000);
      },
      error: (error) => {
        console.log(error);
      },
    });
    //limpiar input
    this.datos = { nombre: '', apellido: '', estado: '' };
  }
  //contenido
  capturarContenido(data: any) {
    this.isEditing = 'editar';
  }
  //editar el contenido
  Editar(id: number, data: any) {
    console.log('Editar', id, data);
    this.contenido.PutContenido(id, data).subscribe({
      next: (data: any) => {
        setTimeout(() => {
          console.log(data);
          const message = 'editado con exito';
          this.msj.sendMessage(message);
          this.messageBoolean = true;
          this.ngOnInit();
        }, 1000);
      },
      error: (error) => {
        console.log(error);
      },
    });
  }
  //cancelar, volver a la pagina principal,limpiar
  Cancelar() {
    this.router.navigate(['/Home']);
  }
}
