import { Injectable } from '@angular/core';
import {HttpClientService} from "./http-client.service";
import {Observable, Subject} from "rxjs";
import 'rxjs/add/operator/find';
import * as _ from 'lodash';
import {Http} from "@angular/http";

@Injectable()
export class DashboardService {

  url: string;
  private _dashboards: any[];
  private dashboards: Observable<any>;
  private dashboards$: Subject<any> = new Subject<any>();
  constructor(private http: Http) {
    this.url = '../../../api/dashboards';
    this._dashboards = [];
    this.dashboards$.next([]);
    this.dashboards = this.dashboards$.asObservable();
  }

  loadAll() {
    this.http.get(this.url +  '.json?paging=false&fields=id,name,dashboardItems[*,users[id,displayName]]')
      .map(res => res.json())
      .catch(error => Observable.throw(new Error(error)))
      .subscribe((dashboardResponse: any) => {
        this._dashboards = dashboardResponse.dashboards;
        this.dashboards$.next(this._dashboards)
      })
  }

  all(): Observable<any> {
    return this.dashboards$.asObservable();
  }
  find(id): Observable<any> {
    return Observable.create(observer => {
      if(this._dashboards.length > 0) {
        observer.next(_.find(this._dashboards, ['id', id]));
        observer.complete();
      }

    });
  }

}
