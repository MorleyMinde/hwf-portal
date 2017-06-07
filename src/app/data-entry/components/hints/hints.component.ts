import { Component, OnInit } from '@angular/core';
import { ActivatedRoute,Params,Router,NavigationStart } from '@angular/router';
import {HttpClientService} from "../../../shared/providers/http-client.service";
import {OrgUnitService} from "../../../shared/components/org-unit-filter/org-unit.service";

@Component({
  selector: 'app-hints',
  templateUrl: './hints.component.html',
  styleUrls: ['./hints.component.css']
})
export class HintsComponent implements OnInit {

  readonly = true;
  constructor(private orgUnitService:OrgUnitService, private route:ActivatedRoute, private router:Router) {
    this.route.params.subscribe((params)=> {
      route.parent.params.forEach((params2:Params) => {
        this.id = params2['id'];
        if(params2['readonly']){
          this.readonly = true;
        }else{
          this.readonly = false;
        }
      })
      this.init();
    })
  }
  id;
  loading = true;

  ngOnInit() {

  }
  fieldMap ={
    "Regions":"Region",
    "LGAs":"Council",
    "Wards":"Ward",
    "Villages":"Village",
    "Tanzania":"Tanzania",

  }
  urlAddition;
  init(){
    if(this.readonly){
      this.orgUnitService.getOrgunitLevelsInformation().subscribe((levelInfo)=>{
        this.orgUnitService.getOrgunit(this.id).subscribe((organisationUnit)=>{
          levelInfo.organisationUnitLevels.forEach((organsationUnitLevel)=>{
            if(organsationUnitLevel.level == organisationUnit.level && organisationUnit.level != 1){
              this.urlAddition = "?criteria=" + this.fieldMap[organsationUnitLevel.name]+ ":" + organisationUnit.name;
            }
          })
          this.loading = false;
        })
      })
    }
  }

}
