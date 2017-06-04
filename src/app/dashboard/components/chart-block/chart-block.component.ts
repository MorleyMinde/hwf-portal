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

  resize() {
    setTimeout(() => {
      if(this.chart) {
        this.chart.setSize(null,null);
      }
    }, 5)
  }

}
