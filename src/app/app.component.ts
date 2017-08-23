import { Component } from '@angular/core';
import {CurrentUserService} from "./providers/current-user.service";
import {Http} from "@angular/http"
import {HttpClientService} from "./shared/providers/http-client.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Water Point Data Manager';

  dashboards =[]
  constructor(private currentUserService: CurrentUserService,private http:Http) {
    currentUserService.load();
    http.get("/hwf/api/dashboards.json?fields=id,name").subscribe((dashboards)=>{
      this.dashboards = dashboards.json().dashboards;
    })

  }
}
