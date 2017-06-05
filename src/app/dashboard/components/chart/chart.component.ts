import {Component, OnInit, OnChanges, Input, ViewChild} from '@angular/core';
import {Visualization} from "../../model/visualization";
import {ChartService} from "../../providers/chart.service";
import {VisualizationObjectService} from "../../providers/visualization-object.service";
import {ChartBlockComponent} from "../chart-block/chart-block.component";

export const CHART_TYPES = [
  {
    type: 'column',
    description: 'Column chart',
    icon: 'assets/img/bar.png'
  },
  {
    type: 'line',
    description: 'Line chart',
    icon: 'assets/img/line.png'
  },
  {
    type: 'combined',
    description: 'Combined chart',
    icon: 'assets/img/combined.png'
  },
  {
    type: 'bar',
    description: 'Bar chart',
    icon: 'assets/img/column.png'
  },
  {
    type: 'area',
    description: 'Area chart',
    icon: 'assets/img/area.png'
  },
  {
    type: 'pie',
    description: 'Pie chart',
    icon: 'assets/img/pie.png'
  },
  {
    type: 'stacked_column',
    description: 'stacked column chart',
    icon: 'assets/img/column-stacked.png'
  },
  // {
  //   type: 'gauge',
  //   description: 'Gauge chart',
  //   icon: 'assets/img/gauge.jpg'
  // },
  {
    type: 'radar',
    description: 'Radar chart',
    icon: 'assets/img/radar.png'
  },
];

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit {

  @Input() initialChartData: Visualization;
  chartData: Visualization;
  chartHeight: string;
  @Input() customFilters: any;
  @Input() parentEvent: any;
  loading: boolean = true;
  hasError: boolean = false;
  errorMessage: string;
  chartConfiguration: any = {
    optionsVisibility: 'hidden',
    showOptions: true,
    blockWidth: "100%"
  };
  chartTypes: any[] = CHART_TYPES;

  chartObjects: any;
  @ViewChild(ChartBlockComponent) chartBlock: ChartBlockComponent;
  constructor(
    private chartService: ChartService,
    private visualizationObjectService: VisualizationObjectService
  ) { }

  ngOnInit() {
    if(this.initialChartData) {
      if(!this.initialChartData.details.loaded) {
        this.loadChart(this.initialChartData)
      } else {
        this.chartData = this.initialChartData;
        this.loading = false;
        if(!this.chartData.details.hasError) {

          this.chartObjects = this.chartService.getChartObjects(this.chartData);
          this.hasError = false;
        } else {
          this.hasError = true;
          this.errorMessage = this.chartData.details.errorMessage;
        }
      }
    }
  }

  loadChart(initialChartData) {
    this.loading = true;
    if(initialChartData) {
      this.chartData = initialChartData;
      this.chartHeight = initialChartData.details.itemHeight;
      this.visualizationObjectService.getSanitizedVisualizationObject(initialChartData)
        .subscribe(sanitizedChartData => {
          //todo quick fix lebel and legends
          if(sanitizedChartData) {
            this.chartData = sanitizedChartData;
            if(this.chartData) {
              if(this.chartData.details.loaded) {
                this.loading = false;
                if(!this.chartData.details.hasError) {
                  this.chartObjects = this.chartService.getChartObjects(this.chartData);
                  this.hasError = false;
                } else {
                  this.hasError = true;
                  this.errorMessage = this.chartData.details.errorMessage;
                }
              }
            }
          }
        })
    }
  }

  updateChartType(type, chartObject){
    this.loading = true;
    /**
     * Update chart object
     * @type {any[]}
     */
    this.chartObjects = this.chartService.getChartObjects(this.chartData, type);
    this.loading = false;

  }

  showChartOptions() {
    if(this.chartConfiguration.showOptions) {
      this.chartConfiguration.optionsVisibility = 'visible';
      this.chartConfiguration.blockWidth = "100% - 40px";
    }

  }

  hideChartOptions() {
    if(this.chartConfiguration.showOptions) {
      this.chartConfiguration.optionsVisibility = 'hidden';
      this.chartConfiguration.blockWidth = "100%";
    }
  }

  resizeChart(visualizationObject,dimension, dimensionType) {
    // console.log(this.chartData.id);
    // let docWidth = document.getElementById(this.chartData.id).offsetWidth;
    // console.log(docWidth)
    this.chartData = visualizationObject;
    if(this.chartBlock) {
      this.chartBlock.resize(visualizationObject.details.itemHeight,dimension, dimensionType)
    }
  }

  toggleChartOptions(mouseEvent) {
    if(mouseEvent == 'mouseenter') {
      this.showChartOptions();
    } else if (mouseEvent == 'mouseleave') {
      this.hideChartOptions();
    }
  }


}
