import {Component, OnInit, Input} from '@angular/core';
declare var Highcharts: any;

@Component({
  selector: 'app-chart-block',
  templateUrl: './chart-block.component.html',
  styleUrls: ['./chart-block.component.css']
})
export class ChartBlockComponent implements OnInit {

  @Input() chartObject: any;
  @Input() renderId: string;
  @Input() chartHeight: string;
  chartWidth:string = "100%";
  chart: any;
  constructor() { }

  ngOnInit() {
    if(this.renderId) {
      setTimeout(() => {
        this.drawChart(this.chartObject);
      }, 30)
    }
  }

  drawChart(chartObject: any) {
    this.chart = Highcharts.chart(chartObject);
  }

  // resize(height) {
  //   this.chartHeight = height;
  //   setTimeout(() => {
  //     if(this.chart) {
  //       this.chart.reflow()
  //     }
  //   }, 5)
  // }
  //
  resize(height,dimension, dimensionType){
    console.log(dimension, dimensionType);
    this.chartHeight = '0%';
    this.chartWidth = "0%";

    if (dimension && dimensionType) {
      if (dimensionType == "fullscreen") {
        this.chartHeight = '75vh';
        this.chartWidth = "100%";
      } else {
        this.chartHeight = '340px';
        this.chartWidth = "100%";


      }

    } else {
      this.chartHeight = '340px';
      this.chartWidth = "100%";
  }

    setTimeout(() => {
          if(this.chart) {
            this.chart.reflow();
          }
        }, 800)
  }

}
