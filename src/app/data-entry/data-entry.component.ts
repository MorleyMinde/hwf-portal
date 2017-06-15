import { Component,ViewChild,OnInit,AfterViewInit} from '@angular/core';
import {HttpClientService} from "../shared/providers/http-client.service";
import { ActivatedRoute,Params,Router,NavigationStart } from '@angular/router';
import {UserService} from "./providers/user.service";

declare var $:any;

@Component({
  selector: 'app-data-entry',
  templateUrl: './data-entry.component.html',
  styleUrls: ['./data-entry.component.css']
})
export class DataEntryComponent implements OnInit {
  title = 'Water Point Data Manager';

  selectedOrganisationUnit = undefined;
  selectedWaterPoint = undefined;
  loading;
  loadingError;
  //db;

  constructor(private route:ActivatedRoute, private router:Router,private userService:UserService) {
    //this.db = new AngularIndexedDB('myDb', 1);
  }

  monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  previousDate:Date;

  authorities;
  init() {
    this.previousDate = new Date();
    this.previousDate = new Date(this.previousDate.getFullYear(),this.previousDate.getMonth() - 1,1);
    this.userService.getAuthorities().subscribe((authorities)=>{
      this.authorities = authorities;
    })
  }

  ngOnInit() {
    this.init();
  }

  onOrganisationUnitInitialized(event) {
    if (this.router.url.indexOf("/orgUnit/") == -1) {
      this.openOrganisationUnit(event);
    }
  }

  onOrganisationUnitSelect(event) {
    this.openOrganisationUnit(event);
  }

  openOrganisationUnit(event) {
    console.log(event);
    let orgUnits = event.value.split(";")
    let orgUnitId = orgUnits[0];
    if (orgUnits.length > 1) {
      orgUnitId = orgUnits[orgUnits.length - 1];
    }
    var beginning = "";
    if(this.router.url.indexOf("/data-entry-readonly") > -1){
      beginning = "readonly/";
    }
    if (orgUnits.length == 1) {
      console.log("Here:",this.router.url);
      this.router.navigate([beginning + 'orgUnit', orgUnits[0]], {relativeTo: this.route});
    }else{
      this.router.navigate([beginning + 'orgUnit', orgUnits[1],"level",orgUnits[0].replace("LEVEL-","")], {relativeTo: this.route});
    }
  }

  onPeriodUpdate(period){
    console.log("Yey:",period);
    let url  = this.router.url;
    if(url.indexOf('/period/') > -1){
      url = url.substr(0,url.indexOf('/period/'));
    }
    this.router.navigate([url,'period',period.value]);
  }
  showOrganisationUnitDetails(event) {
    this.selectedOrganisationUnit = event.node.data;
  }

  showWaterPoint(event) {
    this.selectedWaterPoint = event;
  }

  ngAfterViewInit() {

  }
}

