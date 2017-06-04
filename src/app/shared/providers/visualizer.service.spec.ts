import { TestBed, inject } from '@angular/core/testing';

import { VisualizerService } from './visualizer.service';

describe('VisualizerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VisualizerService]
    });
  });

  it('should ...', inject([VisualizerService], (service: VisualizerService) => {
    expect(service).toBeTruthy();
  }));
});
