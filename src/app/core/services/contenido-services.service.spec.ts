import { TestBed } from '@angular/core/testing';

import { ContenidoServicesService } from './contenido-services.service';

describe('ContenidoServicesService', () => {
  let service: ContenidoServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContenidoServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
