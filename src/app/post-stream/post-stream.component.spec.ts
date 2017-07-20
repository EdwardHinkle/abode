import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PostStreamComponent } from './post-stream.component';

describe('PostStreamComponent', () => {
  let component: PostStreamComponent;
  let fixture: ComponentFixture<PostStreamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PostStreamComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PostStreamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
