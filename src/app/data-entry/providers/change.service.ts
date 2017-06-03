import { Injectable } from '@angular/core';

@Injectable()
export class ChangeService {

  constructor() { }

  private listener;
  setListener(listener){
    this.listener = listener
  }
  envokeNewWaterPoint(orgUnit){
    this.listener.addOrganisationUnit(orgUnit);
  }
}
