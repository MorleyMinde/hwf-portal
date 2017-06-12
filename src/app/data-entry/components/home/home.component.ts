import { Component, OnInit} from '@angular/core';
import {Router,ActivatedRoute} from '@angular/router';
import {HttpClientService} from "../../../shared/providers/http-client.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private http:HttpClientService, private router:Router, private route:ActivatedRoute) { }

  loading;
  loadingError
  ngOnInit() {
    this.loading = true;
    this.loadingError = false;
    this.http.get("me.json?fields=organisationUnits").subscribe((data:any) => {
      console.log("DAta:",data);
      if(data.organisationUnits.length > 0){
        this.router.navigate(['orgUnit', data.organisationUnits[0].id], {relativeTo: this.route});
      }else{
        this.loading = false;
      }
    })
  }

}
