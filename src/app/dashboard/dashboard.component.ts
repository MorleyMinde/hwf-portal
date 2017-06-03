import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {DashboardService} from "../providers/dashboard.service";
import {Visualization} from "./model/visualization";
import * as _ from 'lodash';
import {Observable, Subject} from "rxjs";
import {VisualizationObjectService} from "./providers/visualization-object.service";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  showMailButton: boolean = false;
  visualizationObjects: any[] = [];
  globalFilters: Observable<any>;
  globalFilters$: Subject<any> = new Subject<any>();
  loading: boolean = true;
  constructor(
    private route: ActivatedRoute,
    private dashboardService: DashboardService,
    private visualizationObjectService: VisualizationObjectService
  ) {
    this.globalFilters$.next(null);
    this.globalFilters = this.globalFilters$.asObservable();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      let visualizationObjects = [];
      this.dashboardService.find(params['pageId']).subscribe(dashboard => {
        if(dashboard.dashboardItems) {
          dashboard.dashboardItems.forEach(dashboardItem => {
            if(!dashboardItem.hasOwnProperty('visualizationObject')) {

              /**
               * Load initial visualization
               */
              visualizationObjects.push(this.getInitialVisualization(dashboardItem, params['pageId']));
            }
          });

          this.visualizationObjects = visualizationObjects;
          this.loading = false;
        }
      })
    });
  }

  updateFilters(filterData) {
    this.globalFilters$.next(filterData);
  }

  getInitialVisualization(cardData, dashboardId, currentUser?): Visualization {

    return {
      id: cardData.hasOwnProperty('id') ? cardData.id : null,
      name: null,
      type: cardData.hasOwnProperty('type') ? cardData.type : null,
      created: cardData.hasOwnProperty('created') ? cardData.created : null,
      lastUpdated: cardData.hasOwnProperty('lastUpdated') ? cardData.lastUpdated: null,
      shape: cardData.hasOwnProperty('shape') ? cardData.shape : 'NORMAL',
      dashboardId: dashboardId,
      details: {
        loaded: false,
        hasError: false,
        errorMessage: '',
        appKey: cardData.hasOwnProperty('appKey') ? cardData.appKey : null,
        cardHeight: "400px",
        itemHeight: "380px",
        fullScreen: false,
        currentVisualization: this.getsanitizedCurrentVisualizationType(cardData.hasOwnProperty('type') ? cardData.type : null),
        favorite: this.getFavoriteDetails(cardData),
        externalDimensions: {},
        filters: [],
        layout: {},
        analyticsStrategy: 'normal',
        userOrganisationUnit: ''
      },
      layers: this.getLayerDetailsForNonVisualizableObject(cardData),
      operatingLayers: []
    }
  }

  getsanitizedCurrentVisualizationType(visualizationType: string): string {
    let sanitizedVisualization: string = null;

    if(visualizationType == 'CHART' || visualizationType == 'EVENT_CHART') {
      sanitizedVisualization = 'CHART';
    } else if(visualizationType == 'TABLE' || visualizationType == 'EVENT_REPORT' || visualizationType == 'REPORT_TABLE') {
      sanitizedVisualization = 'TABLE';
    } else if(visualizationType == 'MAP') {
      sanitizedVisualization = 'MAP';
    } else {
      sanitizedVisualization = visualizationType;
    }
    return sanitizedVisualization
  }

  getUserOrganisationUnit(currentUser) {

    if(!currentUser.dataViewOrganisationUnits) {
      return null;
    }

    const orderedOrgUnits = _.orderBy(currentUser.dataViewOrganisationUnits, ['level'], ['asc']);
    return orderedOrgUnits.length > 0 ? orderedOrgUnits[0].name : null;
  }

  getFavoriteDetails(cardData) {
    return cardData.type != null && cardData.hasOwnProperty(_.camelCase(cardData.type)) ? {
      id: _.isPlainObject(cardData[_.camelCase(cardData.type)]) ? cardData[_.camelCase(cardData.type)].id : undefined,
      type: _.camelCase(cardData.type)
    } : {};
  }

  getLayerDetailsForNonVisualizableObject(cardData) {
    let layer: any = [];
    if(cardData.type == 'USERS' || cardData.type == 'REPORTS' || cardData.type == 'RESOURCES' || cardData.type == 'APP') {
      layer.push({settings: cardData, analytics: {}});
    }
    return layer
  }

}
