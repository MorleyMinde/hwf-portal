import {Component, OnInit, Input, OnChanges, Output, EventEmitter, ViewChild} from '@angular/core';
import {Observable} from "rxjs";
import {Visualization} from "../../model/visualization";
import * as _ from 'lodash';
import {VisualizationObjectService} from "../../providers/visualization-object.service";
import {ChartComponent} from "../chart/chart.component";
import {TableComponent} from "../table/table.component";
import {MapComponent} from "../map/map.component";

export const VISUALIZATION_WITH_NO_OPTIONS = ['USERS', 'REPORTS', 'RESOURCES', 'APP'];

export const DASHBOARD_SHAPES = [
  {
    shape: 'NORMAL',
    shapeClasses: ['col-md-4', 'col-sm-6', 'col-xs-12', 'dashboard-card']
  },
  {
    shape: 'DOUBLE_WIDTH',
    shapeClasses: ['col-md-8', 'col-sm-6', 'col-xs-12', 'dashboard-card']
  },
  {
    shape: 'FULL_WIDTH',
    shapeClasses: ['col-md-12', 'col-sm-12', 'col-xs-12', 'dashboard-card']
  },
];

@Component({
  selector: 'app-dashboard-item-card',
  templateUrl: './dashboard-item-card.component.html',
  styleUrls: ['./dashboard-item-card.component.css']
})
export class DashboardItemCardComponent implements OnInit, OnChanges {

  @Input() visualizationObject: Visualization;
  @Input() globalFilters: Observable<any>;
  @Output() onFilterDeactivate: EventEmitter<any> = new EventEmitter<any>();
  visualizationObject$: Observable<any>;
  domEvent: any;
  dashboardShapes: any[] = DASHBOARD_SHAPES;
  visualizationWithNoOptions: any[] = VISUALIZATION_WITH_NO_OPTIONS;
  showFullScreen: boolean = false;
  currentVisualization: string;
  cardConfiguration: any = {
    hideCardBorders: false,
    showCardHeader: true,
    showCardFooter: true,
    showDeleteButton: false,
    defaultHeight: "400px",
    defaultItemHeight: "380px",
    fullScreenItemHeight: "75vh",
    fullScreenHeight: "80vh",
    fullScreen: false,
    showOptions: true,
    optionsVisibility: 'hidden',
    blockWidth: '100%',
    showMailButton: true
  };
  @ViewChild(ChartComponent) chartComponent: ChartComponent;
  @ViewChild(TableComponent) tableComponent: TableComponent;
  @ViewChild(MapComponent) mapComponent: MapComponent;
  constructor(private visualizationObjectService: VisualizationObjectService) { }

  ngOnInit() {
    /**
     * get current visualization
     * @type {any}
     */
    this.currentVisualization = this.visualizationObject.details ? this.visualizationObject.details.currentVisualization : null;

    this.visualizationObject$ = Observable.of(this.visualizationObject);

    this.globalFilters.subscribe(filters => {
      if(filters != null) {
        this.updateFilters(filters);
        this.onFilterDeactivate.emit(null);
      }
    })

  }

  ngOnChanges() {

  }



  getDashboardShapeClasses(currentShape, shapes: any[] = []): any[] {
    let shapeClasses: any[] = ['col-md-4', 'col-sm-6', 'col-xs-12', 'dashboard-card'];
    if (shapes != undefined && shapes.length > 1) {
      for (let shapeValue of shapes) {
        if (shapeValue.hasOwnProperty('shape') && shapeValue.shape == currentShape) {
          if (shapeValue.hasOwnProperty('shapeClasses')) {
            shapeClasses = shapeValue.shapeClasses;
          }
        }
      }
    }

    return shapeClasses;
  }

  /**
   * Hide options for
   * @param visualizationType
   * @param visualizationWithNoOptions
   * @returns {boolean}
   */
  hideOptions(visualizationType, visualizationWithNoOptions: any[] = []): boolean {
    let hide = false;
    if (visualizationWithNoOptions != undefined && visualizationWithNoOptions.length > 0) {
      visualizationWithNoOptions.forEach(visualizationValue => {
        if (visualizationType == visualizationValue) {
          hide = true;
        }
      });
    }
    return hide;
  }

  /**
   * Function for resizing dashboard card from normal,double width to full width
   * @param currentShape
   * @param shapes
   */
  resizeDashboard(currentShape: string, shapes: any[] = []): void {
    let newShape: string = 'NORMAL';
    if (shapes != undefined && shapes.length > 1) {
      shapes.forEach((shapeValue, shapeIndex) => {
        if (shapeValue.hasOwnProperty('shape') && shapeValue.shape == currentShape) {
          if (shapeIndex + 1 < shapes.length) {
            newShape = shapes[shapeIndex + 1].shape
          }
        }
      });
    }
  }

  /**
   * Function to open or close full screen view of the dashbaord card
   */
  toggleFullScreen(): void {
    /**
     * Change card height when toggling full screen to enable items to stretch accordingly
     */
    if (this.showFullScreen) {
      this.visualizationObject.details.cardHeight = this.cardConfiguration.defaultHeight;
      this.visualizationObject.details.itemHeight = this.cardConfiguration.defaultItemHeight;
    } else {
      this.visualizationObject.details.cardHeight = this.cardConfiguration.fullScreenHeight;
      this.visualizationObject.details.itemHeight = this.cardConfiguration.fullScreenItemHeight;
    }

    this.showFullScreen = !this.showFullScreen;

    this.resizeChildren()

  }

  updateVisualization(selectedVisualization) {
    const visualizationObject: Visualization = _.clone(this.visualizationObject);
    visualizationObject.details.currentVisualization = selectedVisualization;

    if (selectedVisualization == 'MAP' && visualizationObject.type != 'MAP') {
      visualizationObject.details.analyticsStrategy = 'split';

    } else if (selectedVisualization != 'MAP' && visualizationObject.type == 'MAP') {
      visualizationObject.details.analyticsStrategy = 'merge';
    }

    this.currentVisualization = selectedVisualization;
  }

  resizeChildren() {
    if(this.currentVisualization == 'MAP') {
      if(this.mapComponent) {
        this.mapComponent.resizeMap();
      }

    } else if(this.currentVisualization == 'CHART') {
      if(this.chartComponent) {
        this.chartComponent.resizeChart()
      }
    }
  }

  updateFilters(filterValues): void {
    if(this.currentVisualization == 'TABLE') {
      if(this.tableComponent) {
        this.tableComponent.loadTable(this.visualizationObjectService.updateVisualizationObjectsWithFilters(this.visualizationObject, filterValues))
      }
    } else if(this.currentVisualization == 'MAP') {
      if(this.mapComponent) {
        this.mapComponent.loadMap(this.visualizationObjectService.updateVisualizationObjectsWithFilters(this.visualizationObject, filterValues))
      }

    } else if(this.currentVisualization == 'CHART') {
      if(this.chartComponent) {
        this.chartComponent.loadChart(this.chartComponent.loadChart(this.visualizationObjectService.updateVisualizationObjectsWithFilters(this.visualizationObject, filterValues)))
      }
    }
  }

}
