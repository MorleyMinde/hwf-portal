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

  constructor() {

  }

  ngOnInit() {

  }
  init(){

  }

}
