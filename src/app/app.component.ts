import { Component, TemplateRef } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BsModalRef } from 'ngx-bootstrap/modal/modal-options.class';
import {CurrentUserService} from "./providers/current-user.service";
import {Http} from "@angular/http"
import {Router} from '@angular/router';
import {HttpClientService} from "./shared/providers/http-client.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  todaysDate = new Date();
  title = 'Water Point Data Manager';

  public modalRef: BsModalRef;
  dashboards =[]
  constructor(private currentUserService: CurrentUserService,private http:Http,private modalService: BsModalService,private router: Router) {
    currentUserService.load();
    http.get("api/dashboards.json?fields=id,name").subscribe((dashboards)=>{
      console.log();
      this.dashboards = dashboards.json().dashboards;
      this.router.navigate(['/dashboard', this.dashboards[0].id ]);
    })

  }
  public openModal(template: TemplateRef<any>) {
    this.message = {
      subject:"",
      text:"",
      email:"",
      number:"",
      loading:false,
      sent:false
    }
    this.modalRef = this.modalService.show(template);
  }

  message = {
    subject:"",
    text:"",
    email:"",
    number:"",
    loading:false,
    sent:false
  }
  sendMessage(){
    this.message.loading = true;
    this.http.post("api/messageConversations",
      {
        "subject":this.message.subject,
        "text":this.message.text + " Contacts Details: Email " + this.message.email+ "  and Phone number " + this.message.number,
        "userGroups":[{"id":"Jr8GEqi1V6A"}]
      }).subscribe((results)=>{
      console.log(results.json());
      this.message.loading = false;
      this.message.sent = true;
    })
  }
}
