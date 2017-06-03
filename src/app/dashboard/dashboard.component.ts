import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {DashboardService} from "../providers/dashboard.service";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  showMailButton: boolean = false;
  constructor(
    private route: ActivatedRoute,
    private dashboardService: DashboardService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.dashboardService.find(params['pageId']).subscribe(dashboard => {
        console.log(dashboard);
      })
    })
  }

  updateFilters(filterValue) {
    console.log(filterValue)
  }

}
