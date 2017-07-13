import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PolaroidProfileComponent } from './polaroid-profile.component';

describe('PolaroidProfileComponent', () => {
  let component: PolaroidProfileComponent;
  let fixture: ComponentFixture<PolaroidProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PolaroidProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PolaroidProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
