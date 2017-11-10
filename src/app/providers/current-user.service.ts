import { Injectable } from '@angular/core';
import {Observable, Subject} from "rxjs";
import {Http, Response} from "@angular/http";
import {HttpClientService} from "./http-client.service";

@Injectable()
export class CurrentUserService {

  private _currentUser: any;
  constructor(private http: HttpClientService) {
    this._currentUser = {}
  }

  getUserInformation(): Observable <any> {
    return Observable.create(observer => {
      if(this._currentUser.hasOwnProperty('id')) {
        observer.next(this._currentUser);
        observer.complete();
      } else {
        this.load().subscribe(currentUser => {
          observer.next(currentUser);
          observer.complete();
        }, error => observer.error(error));
      }
    })
  }

  load() {
    return Observable.create(observer => {
      this.http.get('api/me.json?fields=*,dataViewOrganisationUnits[id,name,level],organisationUnits[id,name,level]')
        .subscribe(currentUser => {
          this._currentUser = currentUser;
          observer.next(currentUser);
          observer.complete();
        }, error => {
          observer.error(error)
        })
    })
  }

}
