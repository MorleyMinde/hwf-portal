import { Component, OnInit } from '@angular/core';
import { ActivatedRoute,Params,Router,NavigationStart } from '@angular/router';
import {HttpClientService} from "../../../providers/http-client.service";

@Component({
  selector: 'app-hints',
  templateUrl: './hints.component.html',
  styleUrls: ['./hints.component.css']
})
export class HintsComponent implements OnInit {

  constructor(private http:HttpClientService, private route:ActivatedRoute, private router:Router) {
    this.route.params.subscribe((params)=> {
      route.parent.params.forEach((params2:Params) => {
        this.id = params2['id'];
      })
    })
  }

  periodStatus;
  id;
  chartData;
  loading = true;

  ngOnInit() {
    this.loading = true;
    this.periodStatus = undefined;
    if(!this.periodStatus){
      let date = new Date();
      date.setMonth(date.getMonth() - 1);
      this.periodStatus = "" + date.getFullYear();
      if (date.getMonth() < 9) {
        this.periodStatus += "0" + (date.getMonth() + 1);
      } else {
        this.periodStatus += "" + (date.getMonth() + 1);
      }
    }

    this.http.get("analytics.json?dimension=dx:MTAVidYwh6V.REPORTING_RATE&dimension=pe:" + this.periodStatus + "&dimension=ou:" + this.id+ "&displayProperty=NAME&skipMeta=true").subscribe((data:any) => {
      let rows = data.rows;
      if(rows.length > 0){
        this.chartData = {
          chart: {
            backgroundColor: '#eee',
            plotBackgroundColor: '#eee',
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
          },
          title: {
            text: 'Percentage of completeness'
          },
          tooltip: {
            pointFormat: '<b>{point.percentage:.1f}%</b>'
          },
          plotOptions: {
            pie: {
              allowPointSelect: true,
              cursor: 'pointer',
              dataLabels: {
                enabled: true,
                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                style: {
                }
              }
            }
          },
          series: [{
            name: 'Completeness',
            colorByPoint: true,
            data:[{name:"Completion Percentage",y:parseFloat(rows[0][3])},{name:"UnCompletion Percentage",y:(100 - parseFloat(rows[0][3]))}]
          }]
        }
        //this.chartData.series[0].data = [{name:"Completion Percentage",y:rows[0][3]},{name:"UnCompletion Percentage",y:"" + (100 - parseFloat(rows[0][3]))}];
        //this.chartData.series[0].data.push({name:"Completion Percentage",y:rows[0][3]});// = [{name:"Completion Percentage",y:rows[0][3]},{name:"UnCompletion Percentage",y:"" + (100 - parseFloat(rows[0][3]))}];
        //this.chartData.series[0].data.push({name:"UnCompletion Percentage",y:"" + (100 - parseFloat(rows[0][3]))});
      }
      // console.log("Rows:",rows);
      this.loading = false;
    }, (error) => {

    });
  }

}
