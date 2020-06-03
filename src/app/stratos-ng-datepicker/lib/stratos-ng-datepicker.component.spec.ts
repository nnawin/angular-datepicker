import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StratosNgDatepickerComponent } from './stratos-ng-datepicker.component';

describe('StratosNgDatepickerComponent', () => {
  let component: StratosNgDatepickerComponent;
  let fixture: ComponentFixture<StratosNgDatepickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StratosNgDatepickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StratosNgDatepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
