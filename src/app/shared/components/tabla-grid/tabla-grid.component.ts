import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { ContenidoServicesService } from '../../../core/services/contenido-services.service';
import { Usuario } from '../../../core/models/usuario';
import { delay } from 'rxjs';
import { MessageService } from '../../../core/services/message.service';
import { MensajesComponent } from '../../../componentes/mensajes/mensajes.component';

@Component({
  selector: 'app-tabla-grid',
  standalone: true,
  imports: [AgGridAngular, CommonModule, MensajesComponent],
  templateUrl: './tabla-grid.component.html',
  styleUrl: './tabla-grid.component.css',
})
export class TablaGridComponent implements OnInit {
  rowDatassignal: WritableSignal<any[]> = signal([]);
  messageBoolean: boolean = false;
  //inyection
  msj = inject(MessageService);
  contenidos = inject(ContenidoServicesService);

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef[] = [
    { field: 'id' },
    {
      field: 'nombre',
      filter: true,
      floatingFilter: true,
      editable: true,
      onCellValueChanged: (events) => {
        console.log('cambio', events.data.nombre);
        this.contenidos
          .PutContenido(events.data.id, events.data)
          .pipe(delay(1000))
          .subscribe({
            next: (data: any) => {
              const message = 'editado con exito';
              this.msj.sendMessage(message);
              this.messageBoolean = true;
              this.ngOnInit();
            },
            error: (error) => {
              console.log(error);
            },
          });
      },
    },
    { field: 'apellido' },
    { field: 'estado' },
    {
      field: 'Acciones',
      cellRenderer: () => {
        return `<button class="button is-danger">Eliminar</button>`;
      },
      onCellClicked: (event) => {
        console.log('dsfd', event.data.id);
        this.Eliminar(event.data.id);
      },
    },
  ];

  constructor() {}
  ngOnInit(): void {
    this.contenidos.GetContenido(1).subscribe({
      next: (data: any) => {
        this.rowDatassignal.update(() => data);
      },
    });
  }
  Eliminar(id: number): void {
    this.contenidos
      .DeleteContenido(id)
      .pipe(delay(1000))
      .subscribe({
        next: (data: any) => {
          console.log(data);
          const message = 'eliminado con exito';
          this.msj.sendMessage(message);
          this.messageBoolean = true;
          this.ngOnInit();
        },
        error: (error) => {
          console.log(error);
        },
      });
  }
}
