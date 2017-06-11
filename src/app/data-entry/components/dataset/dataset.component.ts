import { Component, OnInit,Input } from '@angular/core';
import {HttpClientService} from "../../../shared/providers/http-client.service";
import {DataElementFinderPipe} from "../../pipes/data-element-finder.pipe";
import {UserService} from "../../providers/user.service";
import {Observable} from "rxjs/Observable";

interface DataElement{
  categoryCombo;
}
interface Sections{
  dataElements:Array<DataElement>;
}
@Component({
  selector: 'app-dataset',
  templateUrl: './dataset.component.html',
  styleUrls: ['./dataset.component.css']
})
export class DatasetComponent implements OnInit {

  @Input() dataSet:any;
  @Input() organisationUnit:any;
  @Input() readonly:boolean;
  period;
  dataValues = {};
  edit = false;
  loading = false;
  loadingError:any = false;
  dataElementFinderPipe:DataElementFinderPipe;

  constructor(private http:HttpClientService,private userService:UserService) {
    this.dataElementFinderPipe = new DataElementFinderPipe();
  }

  ngOnInit() {

  }

  initializeDataValues(dataElements) {
    dataElements.forEach((dataElement) => {
      this.dataValues[dataElement.id] = {
        value: "",
        status: {
          loading: false,
          loadingError: false,
          success: false,
          show: true
        }
      }
      dataElement.categoryCombo.categoryOptionCombos.forEach((categoryOptionCombo) =>{
        this.dataValues[dataElement.id + "-" + categoryOptionCombo.id] = {
          value: "",
          status: {
            loading: false,
            loadingError: false,
            success: false,
            show: true
          }
        }
      })
    })
  }
  initializeEventDataValues() {
    this.organisationUnit.programs.forEach((program:any)=>{
      program.programStages.forEach((programStage:any)=>{
        programStage.programStageDataElements.forEach((programStageDataElement)=>{
          this.dataValues[programStageDataElement.dataElement.id] = {
            value: "",
            status: {
              loading: false,
              loadingError: false,
              success: false,
              show: true
            }
          }
        })
      })
    })
  }

  getDataElements() {
    let dataElements = [];
    this.organisationUnit.programs.forEach((program:any)=>{
      program.programStages.forEach((programStage:any)=>{
        programStage.programStageDataElements.forEach((programStageDataElement)=>{
          dataElements.push(programStageDataElement.dataElement)
        })
      })
    })
    return dataElements;
  }

  completed = false;
  authorities
  init() {
    this.loading = true;
    if (this.dataSet.dataElements) {
      this.initializeDataValues(this.dataSet.dataElements);
    } else if (this.dataSet.sections) {
      this.dataSet.sections.forEach(section => {
        this.initializeDataValues(section.dataElements);
      })
    }
    this.userService.getAuthorities().subscribe((authorities:any)=>{
      this.authorities = authorities;
      this.initializeEventDataValues();
      if(this.organisationUnit.programs.length > 0){
        this.http.get("events.json?program=" + this.organisationUnit.programs[0].id + "&startDate=" + this.eventDate + "&endDate=" + this.eventDate + "&orgUnit=" + this.organisationUnit.id).subscribe((data:any) => {
          //let dataJSON = data;
          let results = data;
          if(results.events.length > 0){
            results.events[0].dataValues.forEach((dataValue)=>{
              this.dataValues[dataValue.dataElement].value = dataValue.value;
            })
            this.event = results.events[0];
            this.loadCompleteness();
          }else{
            this.loading = false;
          }
          this.checkDepependecy();
        }, (error) => {
          this.loading = false;
          this.loadingError = error;
        });
      }else{
        this.loading = false;
        this.loadingError = {heading:'Oh Snap!',message:'Program not assigned. Please contact administrator to assign program to this water point.'};
      }
    })
  }
  loadCompleteness(){
    this.completed = false;
    this.http.get("../../api/26/completeDataSetRegistrations.json?dataSet=" + this.dataSet.id + "&period=" + this.period + "&orgUnit=" + this.organisationUnit.id).subscribe((data:any) => {
      if(data.completeDataSetRegistrations){
        this.completed = data.completeDataSetRegistrations.length > 0
      }
      this.loading = false;
    }, (error) => {
      this.loading = false;
      this.loadingError = error;
    });
  }
  event
  prePopulate(typeOfPrePopulation, dataElement,categoryOptionCombo,times) {
    let period = "";
    if(this.dataSet.periodType == "Monthly"){
      let year = parseInt(this.period.substr(0,4));
      let month = parseInt(this.period.substr(4)) - times;
      let monthVal = "";
      if(month < 1){
        month = (month + 12);
        if(month < 10){
          monthVal = "0" + month;
        }else{
          monthVal += month;
        }
        period = (year - 1) + monthVal
      }else{
        if(month < 10){
          monthVal = "0" + month;
        }else{
          monthVal += month;
        }
        period = year + monthVal
      }
    }
    this.http.get("dataValues.json?de=" + dataElement.id + "&pe=" + period + "&ou=" + this.organisationUnit.id).subscribe((data:any) => {
      this.dataValues[dataElement.id + "-" + categoryOptionCombo.id].value = data[0];
      this.calculateSum();
    },(error) =>{
      if(times < 3){
        this.prePopulate(typeOfPrePopulation, dataElement,categoryOptionCombo,times + 1);
      }
    })
  }
  eventDate
  periodSelected(period) {
    this.event = null;
    this.period = period;
    this.eventDate = this.period.substr(0,4)+"-"+ this.period.substr(4) + "-01";
    this.init();
  }
  valueChange(value, dataElementID) {
     this.checkDepependecy();

    this.dataValues[dataElementID].status.loading = true;
    this.dataValues[dataElementID].status.loadingError = null;
    if(this.event){
      let payload = {"dataValues":[{"dataElement":dataElementID,"value":this.dataValues[dataElementID].value,"providedElsewhere":false}]}
      this.http.put("events/" + this.event.event+ "/" + dataElementID,payload).subscribe((data:any) => {
        this.runCompleteness(dataElementID).subscribe(()=>{
        });
      }, (error) => {
        this.dataValues[dataElementID].status.loading = false;
        this.dataValues[dataElementID].status.loadingError = error.json();
      });
    }else{
      let dataValues = [];
      this.organisationUnit.programs.forEach((program:any)=>{
        if(program.id == "lg2nRxyEtiH"){
          program.programStages.forEach((programStage:any)=>{
            programStage.programStageDataElements.forEach((programStageDataElement)=>{
              programStageDataElement.dataElement.attributeValues.forEach((attributeValue)=>{
                if(attributeValue.attribute.name == "Organisation Unit Field"){
                  if(attributeValue.value){
                    if(attributeValue.value == "field"){
                      dataValues.push({"dataElement":programStageDataElement.dataElement.id,"value":this.organisationUnit[programStageDataElement.dataElement.name.toLowerCase()],"providedElsewhere":false});
                    }else if(attributeValue.value.indexOf("field.") > -1){
                      dataValues.push({"dataElement":programStageDataElement.dataElement.id,"value":this.organisationUnit[attributeValue.value.replace("field.","")],"providedElsewhere":false});
                    }else{
                      this.organisationUnit.attributeValues.forEach((attributeValue2)=>{
                        if(attributeValue2.attribute.id == attributeValue.value){
                          dataValues.push({"dataElement":programStageDataElement.dataElement.id,"value":attributeValue2.value,"providedElsewhere":false});
                        }
                      })
                    }
                  }
                }
              })
            })
          })
        }
      });
      dataValues.push({"dataElement":dataElementID,"value":this.dataValues[dataElementID].value,"providedElsewhere":false})

      var coordinates = eval("(" +this.organisationUnit.coordinates+")");
      this.userService.getUser().subscribe((user)=>{
        this.http.get("sqlViews/rMxfC7YTmrd/data.json?var=orgunitid:" + this.organisationUnit.id +
          "&var=eventdate:" + this.period.substr(0,4) + "-" + this.period.substr(4) + "-01" +
          "&var=userid:" + user.id+ "&var=latitude:" + ("" + coordinates[0]).replace(".",'dot') + "&var=longitude:" + ("" + coordinates[1]).replace(".",'dot')).subscribe((data:any) => {
          this.http.get("events/" + data.rows[0][0] +".json").subscribe((data:any) => {
            this.event = data;
            this.runCompleteness(dataElementID).subscribe(()=>{
              dataValues.forEach((dataValue)=>{
                this.valueChange(dataValue.value,dataValue.dataElement);
              })
            });
          }, (error) => {
            this.dataValues[dataElementID].status.loading = false;
            this.dataValues[dataElementID].status.loadingError = error.json();
          });
        }, (error) => {
          this.dataValues[dataElementID].status.loading = false;
          this.dataValues[dataElementID].status.loadingError = error.json();
        });
      })
    }
  }

  runCompleteness(dataElementID){
    return new Observable((observable) =>{
      if(this.completed){
        this.dataValues[dataElementID].status.loading = false;
        this.dataValues[dataElementID].status.success = true;
        this.dataValues[dataElementID].status.loadingError = null;
        observable.next();
        observable.complete();
      }else{
        this.http.post("../../api/26/completeDataSetRegistrations",{"completeDataSetRegistrations":[{period:this.period,organisationUnit:this.organisationUnit.id,dataSet:this.dataSet.id}]}).subscribe((data:any) => {
          this.dataValues[dataElementID].status.loading = false;
          this.dataValues[dataElementID].status.success = true;
          this.completed = true;
          observable.next();
          observable.complete();
        }, (error) => {
          this.dataValues[dataElementID ].status.loading = false;
          this.dataValues[dataElementID].status.loadingError = error.json();
        });
      }
    })
  }
  getStyle(dataElement){
    return {
      'yellow': this.dataValues[dataElement.id ].status.loading,
      'green': this.dataValues[dataElement.id].status.success && !this.dataValues[dataElement.id ].status.loading,
      'red': !this.dataValues[dataElement.id].status.loading && this.dataValues[dataElement.id].status.loadingError
    };
  }
  checkDepependecy() {
    let dataElements = this.getDataElements();
    dataElements.forEach((dataElement)=>{
      this.dataValues[dataElement.id].status.show = true;
    })
    this.organisationUnit.programs.forEach((program:any)=>{
      if(program.id == "lg2nRxyEtiH"){
        program.programRules.forEach((programRule:any)=>{
          let condition = programRule.condition;
          program.programRuleVariables.forEach((programRuleVariable)=>{
            if(condition.indexOf("#{" +programRuleVariable.name+"}") > -1){
              condition = condition.split("#{" +programRuleVariable.name+"}").join(this.dataValues[programRuleVariable.dataElement.id].value);
            }
          })
          try{
            condition = eval("(" + condition + ")");
            if(condition){
              programRule.programRuleActions.forEach((programRuleAction:any)=>{
                dataElements.forEach((dataElement)=>{
                  if(dataElement.id == programRuleAction.dataElement.id && programRuleAction.programRuleActionType == "HIDEFIELD"){
                    if(programRuleAction.content){
                      console.log("programRuleAction:",programRuleAction);
                      this.dataValues[dataElement.id].hidenOptions = programRuleAction.content.replace("Options[","").replace("]","").split(",");
                    }else{
                      this.dataValues[dataElement.id].status.show = false;
                    }
                  }
                })
              })
            }
          }catch(e){
            console.log("Error:",e);
          }
        })
      }
    })
  }
  calculateSum(){
    let dataElements = this.dataElementFinderPipe.transform(this.dataSet);

    dataElements.forEach((dataElement) =>{
      let sum = 0;
      //noinspection TypeScriptUnresolvedVariable
      dataElement.categoryCombo.categoryOptionCombos.forEach((categoryOptionCombo) =>{
        if(this.dataValues[dataElement.id + '-' +categoryOptionCombo.id].value){
          sum += parseInt(this.dataValues[dataElement.id + '-' +categoryOptionCombo.id].value);
        }
      })
      this.dataValues[dataElement.id].value = sum;
    })
  }
}
