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
  visualizationObjects: Visualization[] = [];
  constructor(
    private route: ActivatedRoute,
    private dashboardService: DashboardService,
    private visualizationObjectService: VisualizationObjectService
  ) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.visualizationObjects = [];
      this.dashboardService.find(params['pageId']).subscribe(dashboard => {
        const dashboardItems = dashboard.dashboardItems;
        if(dashboardItems) {
          dashboardItems.forEach(dashboardItem => {
            if(!dashboardItem.hasOwnProperty('visualizationObject')) {
              const visualizationObject: Visualization = this.getInitialVisualization(dashboardItem, params['pageId']);

              /**
               * Load initial visualization
               */
              this.visualizationObjects.push(visualizationObject)

              /**
               * Load sanitized visualization object
               */

              this.loadSanitizedObject(visualizationObject);
            }
          })
        }
        console.log(this.visualizationObjects)
      })
    });


  }

  updateFilters(filterValue) {
    console.log(filterValue)
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

  loadSanitizedObject(visualizationObject: Visualization): void {
    this.visualizationObjectService.getSanitizedVisualizationObject(visualizationObject).subscribe(sanitizedVisualizationObject => {
      const visualizationObjectIndex = _.findIndex(this.visualizationObjects, ['id', sanitizedVisualizationObject])

      if(visualizationObjectIndex != -1) {
        this.visualizationObjects[visualizationObjectIndex] = sanitizedVisualizationObject;
      }
    }, visualizationObjectWithError => {
      const visualizationObjectIndex = _.findIndex(this.visualizationObjects, ['id', visualizationObjectWithError]);

      if(visualizationObjectIndex != -1) {
        this.visualizationObjects[visualizationObjectIndex] = visualizationObjectWithError;
      }
    });
  }

}
