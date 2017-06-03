import { Injectable } from '@angular/core';
import {Observable, Subject} from "rxjs";
import {Http, Response} from "@angular/http";
import {HttpClientService} from "./http-client.service";

@Injectable()
export class CurrentUserService {

  currentUser$: Subject<any> = new Subject<any>();
  currentUser: Observable<any>;
  private _currentUser: any;
  constructor(private http: HttpClientService) {
    this._currentUser = {}
    this.currentUser$.next(this._currentUser);
    this.currentUser = this.currentUser$.asObservable();
  }

  getUserInformation(): Observable <any> {
    return this.currentUser;
  }

  load() {
    this.http.get('../../../api/me.json?fields=*,dataViewOrganisationUnits[id,name,level],organisationUnits[id,name,level]')
      .subscribe(currentUser => {
        this._currentUser = currentUser;
        this.currentUser$.next(currentUser);
      })
  }

}
