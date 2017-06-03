import { Component, OnInit} from '@angular/core';
import {Router } from '@angular/router';
import {HttpClientService} from "../../../providers/http-client.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private http:HttpClientService, private router:Router) { }

  loading;
  loadingError
  ngOnInit() {
    this.loading = true;
    this.loadingError = false;
    this.http.get("me.json?fields=organisationUnits").subscribe((data:any) => {
      this.router.navigate(['data-entry','orgUnit', data.organisationUnits[0].id]);
    })
  }

}
