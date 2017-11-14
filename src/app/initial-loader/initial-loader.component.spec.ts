import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InitialLoaderComponent } from './initial-loader.component';

describe('InitialLoaderComponent', () => {
  let component: InitialLoaderComponent;
  let fixture: ComponentFixture<InitialLoaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InitialLoaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InitialLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
