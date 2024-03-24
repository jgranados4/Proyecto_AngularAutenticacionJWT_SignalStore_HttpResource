import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  //Mensaje
  private messageSubject: BehaviorSubject<string> = new BehaviorSubject<string>(
    ''
  );

  constructor() {}

  sendMessage(message: string): void {
    this.messageSubject.next(message);
  }

  getMessage(): Observable<string> {
    return this.messageSubject.asObservable();
  }
}
