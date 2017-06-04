import {Component, OnInit, Input} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {Observable, Subject} from "rxjs";
import * as _ from 'lodash';
import {DashboardService} from "../providers/dashboard.service";
import {Utilities} from "../providers/utilities";
import {Visualization} from "../model/visualization";

@Component({
  selector: 'app-report',
  templateUrl: 'report.component.html',
  styleUrls: ['report.component.css']
})
export class ReportComponent implements OnInit {
  showMailButton: boolean = false;
  @Input() visualizationObjects: any[] = [];
  @Input() globalFilters: Observable<any>;
  @Input() loading: boolean = true;
  have_authorities:boolean = true;
  show_warning_message = false;
  show_other_warning_message = false;
  show_sending_message = false;
  show_other_sending_message = false;
  user_email:string = "";
  user_id:string = "";
  dateGenerated: any;
  showGenerationDate: boolean = false;
  constructor(
    private route: ActivatedRoute,
    private utilities: Utilities
  ) {
    let date = new Date();
    this.dateGenerated = date;
    date.setDate(0);

    this.utilities.getUserInformation().subscribe(
      userInfo => {
        this.user_id = userInfo.id;
        if(userInfo.hasOwnProperty('email')){
          if(userInfo.email.replace(/ /g,'') != ""){
            this.user_email = userInfo.email;
          }
        }
        userInfo.userCredentials.userRoles.forEach( (role) => {
          role.authorities.forEach( (ath) => {
            if( ath == "ALL"){
              this.have_authorities = true;
            }
          });
        })
      }
    )
  }
 //reports
  ngOnInit() {
    this.route.params.subscribe(params => {

    });


  }

  //controling the button to send the email to all users
  enableSendEmail(){
    this.utilities.getDataStore('emails','enable').subscribe((data) => {
      this.utilities.updateDataStore('emails','enable',{enabled:true}).subscribe((item) => {
        this.show_warning_message = false;
        this.show_sending_message = true;
        setTimeout(() => {
          this.show_sending_message = false;
        }, 6000);
      })
    }, (error) => {
      this.utilities.createDataStore('emails','enable',{enabled:true}).subscribe((item) => {
        this.show_warning_message = false;
        this.show_sending_message = true;
        setTimeout(() => {
          this.show_sending_message = false;
        }, 6000);
      })
    })
  }

  // controlling the button to send email to specific user
  enableSendUserEmail(){
    this.utilities.getDataStore('users',this.user_id).subscribe((data) => {
      this.utilities.updateDataStore('users',this.user_id,{}).subscribe((item) => {
        this.show_other_warning_message = false;
        this.show_other_sending_message = true;
        setTimeout(() => {
          this.show_other_sending_message = false;
        }, 6000);
      })
    }, (error) => {
      this.utilities.createDataStore('users',this.user_id,{}).subscribe((item) => {
        this.show_other_warning_message = false;
        this.show_other_sending_message = true;
        setTimeout(() => {
          this.show_other_sending_message = false;
        }, 6000);
      })
    })
  }

}
