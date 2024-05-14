import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaGridComponent } from './tabla-grid.component';

describe('TablaGridComponent', () => {
  let component: TablaGridComponent;
  let fixture: ComponentFixture<TablaGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaGridComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TablaGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
