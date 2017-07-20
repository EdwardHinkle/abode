import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OnThisDayComponent } from './on-this-day.component';

describe('OnThisDayComponent', () => {
  let component: OnThisDayComponent;
  let fixture: ComponentFixture<OnThisDayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnThisDayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnThisDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
