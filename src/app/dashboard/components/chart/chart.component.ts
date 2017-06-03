import {Component, OnInit, OnChanges, Input} from '@angular/core';
import {Visualization} from "../../model/visualization";
import {ChartService} from "../../providers/chart.service";
import {Observable} from "rxjs";

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
export class ChartComponent implements OnInit, OnChanges {

  @Input() chartData: Observable<any>;
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
  constructor(private chartService: ChartService) { }

  ngOnInit() {
    this.chartData.subscribe(chartData => {
      this.loading = true;
      if(chartData) {
        if(chartData.details.loaded) {
          this.loading = false;
          if(!chartData.details.hasError) {

            this.chartObjects = this.chartService.getChartObjects(chartData);
            console.log(this.chartObjects)
            this.hasError = false;
          } else {
            this.hasError = true;
            this.errorMessage = chartData.details.errorMessage;
          }
        }
      }
    })
  }

  ngOnChanges() {

  }

}
