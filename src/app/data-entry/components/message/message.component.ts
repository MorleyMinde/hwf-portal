import { Component, OnInit, Input } from '@angular/core';
import {Response} from '@angular/http';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css']
})
export class MessageComponent implements OnInit {

  @Input() messageObject;
  @Input() type;
  constructor() { }

  errorSet
  ngOnInit() {
    if(this.messageObject instanceof Response){
      this.messageObject = this.messageObject.json();
    }
    console.log(this.messageObject);
    if(this.messageObject.status == 0){
      this.errorSet =  {heading:'Oh Snap!',message:'Failed to load. Please check the your internet connection.'};
    }else if(this.messageObject.status == 403){
      this.errorSet =  {heading:'Oh Snap!',message:'Failed to load. You do not have access. Please contact administrator to gain this privilege'};
    }else if(this.messageObject.status == 409 || this.messageObject.httpStatusCode == 409){
      let dhisMessage = this.messageObject;
      console.log("Error:",dhisMessage);
      if(dhisMessage.message.indexOf("User is not allowed to view org unit") > -1){
        this.errorSet =  {heading:'Oh Snap!',message:'You do not have access to this water point. Please contact administrator to be assigned to this water point.'};
      }else if(dhisMessage.message.indexOf("No row with the given identifier exists") > -1){
        this.errorSet =  {heading:'Oh Snap!',message:'There is a database error. Please contact administrator to be assigned to this water point.'};
      }else{
        if(dhisMessage.response){
          if(dhisMessage.response.conflicts){
            let message = "";
            dhisMessage.response.conflicts.forEach((conflict)=>{
              message += conflict.value.split("_").join(" ");
            })
            this.errorSet =  {heading:'Oh Snap!',message:message};
          }else if(dhisMessage.response.errorReports){
            let message = "";
            dhisMessage.response.errorReports.forEach((errorReport,index)=>{
              if(index > 0){
                message += ", "
              }
              message += errorReport.message;
            })
            this.errorSet =  {heading:'Oh Snap!',message:message};
          }
        }else{
          this.errorSet =  {heading:'Oh Snap!',message:'There is a system conflict. Please contact administrator to be assigned to this water point.'};
        }
      }
    }else if(this.messageObject.status == 500 || this.messageObject.httpStatusCode == 500){
      let dhisMessage = this.messageObject;
      if(dhisMessage.message.indexOf("No row with the given identifier exists")){
        this.errorSet =  {heading:'Oh Snap!',message:'There is a database error. Please contact administrator to be assigned to this water point.'};
      }else{
        if(this.messageObject.httpStatusCode){
          this.errorSet =  {heading:'Oh Snap!',message:this.messageObject.message};
        }else{
          this.errorSet =  {heading:'Oh Snap!',message:'There is a system error. Please contact administrator to be assigned to this water point.'};
        }
      }
    }else{
      this.errorSet = this.messageObject;
    }
  }

}
