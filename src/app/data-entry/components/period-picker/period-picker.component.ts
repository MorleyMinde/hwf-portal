import { Component, OnInit, Input,Output,EventEmitter } from '@angular/core';

@Component({
  selector: 'app-period-picker',
  templateUrl: './period-picker.component.html',
  styleUrls: ['./period-picker.component.css']
})
export class PeriodPickerComponent implements OnInit {

  @Input() dataSet:any;
  @Output() periodSelected = new EventEmitter();
  periods = [];

  constructor() {
  }
  periodType;
  openFuturePeriods;
  ngOnInit() {
    if(this.dataSet){
      this.periodType = this.dataSet.periodType;
      this.openFuturePeriods = this.dataSet.openFuturePeriods;
    }else{
      this.periodType = "Monthly";
      this.openFuturePeriods = 0;
    }
    this.populateList();
    this.model = this.list[0].value
    this.periodSelected.emit(this.list[0].value);
  }
  currentDate = new Date();

  populateList() {
    if (this.periodType == "Monthly") {
      this.populateMonthList();
    }else if(this.periodType == "Yearly"){
      this.populateYearList()
    }
  }

  next() {
    if (this.periodType == "Monthly") {
      this.currentDate = new Date(this.currentDate.getFullYear() + 1, this.currentDate.getMonth(), this.currentDate.getDate());
      this.populateList();
    }else if(this.periodType == "Yearly"){
      this.currentDate = new Date(this.currentDate.getFullYear() + 10, this.currentDate.getMonth(), this.currentDate.getDate());
      this.populateYearList()
    }

  }

  previous() {
    if (this.periodType == "Monthly") {
      this.currentDate = new Date(this.currentDate.getFullYear() - 1, this.currentDate.getMonth(), this.currentDate.getDate());
      this.populateList();
    }else if(this.periodType == "Yearly"){
      this.currentDate = new Date(this.currentDate.getFullYear() - 10, this.currentDate.getMonth(), this.currentDate.getDate());
      this.populateYearList()
    }
    this.allowNext = true;
  }

  allowNext = true;
  allowPrevious = true;
  list = [];

  populateMonthList() {
    //this.allowNext = true;
    var monthNames = [ "January", "February", "March", "April", "May", "June" ,"July", "August", "September", "October", "November", "December"];
    this.list = [];
    var year = this.currentDate.getFullYear();
    monthNames.forEach((monthName, index) =>{
      var monthVal = index + 1;

      if (monthVal > 12) {
        monthVal = monthVal % 12;
      }
      let monthText = "";
      if (monthVal < 10) {
        monthText = "0" + monthVal;
      }else{
        monthText = "" + monthVal;
      }
      let today = new Date();
      if(today.getFullYear() > year)// || )
      {
        this.list.unshift({
          name: monthName + " " + year,
          value: year + "" + monthText
        })
      }else if((today.getFullYear() == year && monthVal <(today.getMonth() + 1 + this.openFuturePeriods)))
      {
        this.list.unshift({
          name: monthName + " " + year,
          value: year + "" + monthText
        })
      }
      else{
        this.allowNext = false;
      }
    });
    if (this.list.length == 0) {
      console.log(this.currentDate);
      this.currentDate = new Date(this.currentDate.getFullYear() - 1, this.currentDate.getMonth(), this.currentDate.getDate());
      console.log(this.currentDate);
      this.populateList();
      this.allowNext = false;
    }else{
      this.list = this.list.splice(0,3);
    }
  }
  populateYearList() {
    this.list = [];
    var year = this.currentDate.getFullYear() - 1 + this.openFuturePeriods;
    for(let i = 0;i < 10;i++){
      this.list.unshift({
        name: year - i,
        value: year - i
      })
    }
    this.allowNext = false;
  }
  model = "";
  onChange(newValue){
    this.periodSelected.emit(newValue)
  }
}
