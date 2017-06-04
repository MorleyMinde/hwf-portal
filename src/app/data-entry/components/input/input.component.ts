import { Component, OnInit, Input } from '@angular/core';
//import { SelectComponent } from 'ng2-select/components/select/select';
import {HttpClientService} from "../../../shared/providers/http-client.service";

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css']
})
export class InputComponent implements OnInit {

  @Input() objectRefference:any;
  @Input() valueAttribute:any;
  @Input() valueType:any;
  @Input() description:any;
  @Input() placeholder:any;
  @Input() attributeValue:any;
  @Input() type:any;
  @Input() editing = false;
  loading = false;
  loadingError = false;
  constructor(private http: HttpClientService) {

  }
  attributtNew;
  ngOnInit() {
    if(this.attributeValue)
    {
      if(this.attributeValue.value == ""){
        this.attributtNew = true;
      }else{
        this.attributtNew = false;
      }
      if(this.attributeValue.attribute.optionSet){
        this.attributeValue.attribute.optionSet.options.forEach((option)=>{
          if(this.attributeValue.attribute.name == 'Project'){
            this.items.push(option.name + "(" + option.code + ")");
          }else{
            this.items.push(option.code);
          }


          if(option.code == this.attributeValue.value){
            if(this.attributeValue.attribute.name == 'Project'){
              this.value.id = option.name + "(" + option.code + ")";
              this.value.text = option.name + "(" + option.code + ")";
            }else{
              this.value.id = this.attributeValue.value;
              this.value.text = option.code;
            }
          }
        })
      }

    }
  }
  save(){
    this.loading = true;
    let dataObject = {};
    dataObject[this.valueAttribute] = this.objectRefference[this.valueAttribute];
    this.http.put("organisationUnits/" + this.objectRefference.id + "/" + this.valueAttribute,dataObject ).subscribe((data:any) =>{
      var userData = data;
      this.editing = false;
    },(error) =>{
      this.editing = false;
      this.loading = false;
      this.loadingError = error;
    });
  }
  selectionInputSettings = {
    valueField:"code",
    textField:"name",
    multipleSelection:false
  }
  public items:Array<string> = [];
  private value:any = {};

  public selected(value:any):void {
    //console.log('Selected value is: ', value.id.replace(/\((\w+)\)/i,""));
    if(this.attributeValue.attribute.name == 'Project'){
      this.attributeValue.value = value.id.replace(/\(\w+(\s(\w+))+\)/i,"");
    }else{
      this.attributeValue.value = value.id;
    }
  }

  showPicker:boolean = false;
  top = '0'//px';
  left = '0'//px';
  public dateChanged(event){
    this.attributeValue.value = event.jsdate.toISOString();
    //attributeValue.value = event.jsdate;
    //console.log(event.jsdate);
  }
  public removed(value:any):void {
    console.log('Removed value is: ', value);
  }

  public typed(value:any):void {
    console.log('New search input: ', value);
  }

  public refreshValue(value:any):void {
    console.log('Refresh input: ', value);
    this.value = value;
  }

  valueSelected(event){
    this.attributeValue.value = event;
  }
}
