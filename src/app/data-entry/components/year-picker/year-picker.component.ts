import { Component, OnInit, Input,Output,EventEmitter } from '@angular/core';

@Component({
  selector: 'year-picker',
  templateUrl: './year-picker.component.html',
  styleUrls: ['./year-picker.component.css']
})
export class YearPickerComponent implements OnInit {

  @Input() initialValue:any;
  years: any[] =[];
  private yy : number;

  @Output() yearSelected = new EventEmitter();

  ngOnInit() {
    this.getYear();

  }

  getYear(){
    var today = new Date();
    this.yy = today.getFullYear();
    for(var i = (this.yy-100); i <= this.yy; i++){
      this.years.push({text:"" + i,value:"" + i});
    }
  }

  selected(year){
    console.log("Year");
    this.yearSelected.emit(year);
  }
}
