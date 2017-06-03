import { Injectable } from '@angular/core';
import {HttpClientService} from "./http-client.service";
import {Observable, Subject} from "rxjs";
import 'rxjs/add/operator/find';
import * as _ from 'lodash';

@Injectable()
export class DashboardService {

  url: string;
  dashboards$: Subject<any> = new Subject<any>();
  dashboards: Observable<any>;
  private _dashboards: any[];
  constructor(private http: HttpClientService) {
    this.url = '../../../api/dashboards';
    this._dashboards = [];
  }

  loadAll() {
    this.http.get(this.url +  '.json?paging=false&fields=id,name,dashboardItems[*,users[id,displayName]]')
      .subscribe((dashboardResponse: any) => {
        this._dashboards = dashboardResponse.dashboards;
      })
  }

  find(id): Observable<any> {
    console.log(this._dashboards);
    return Observable.create(observer => {
      const dashboard = _.find(this._dashboards, ['id', id]);

      if(dashboard) {
        observer.next(dashboard);
        observer.complete();
      }
    });
  }

}
