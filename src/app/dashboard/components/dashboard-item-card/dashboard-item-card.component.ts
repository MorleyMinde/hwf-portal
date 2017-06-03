import {Component, OnInit, Input} from '@angular/core';
import {Observable} from "rxjs";
import {Visualization} from "../../model/visualization";

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
export class DashboardItemCardComponent implements OnInit {

  @Input() visualizationObject: Visualization;
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
  constructor() { }

  ngOnInit() {
    /**
     * get current visualization
     * @type {any}
     */
    this.currentVisualization = this.visualizationObject.details ? this.visualizationObject.details.currentVisualization : null;
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
    // this.updateSettings();
  }

}
