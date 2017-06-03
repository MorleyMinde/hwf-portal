import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartBlockComponent } from './chart-block.component';

describe('ChartBlockComponent', () => {
  let component: ChartBlockComponent;
  let fixture: ComponentFixture<ChartBlockComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChartBlockComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
