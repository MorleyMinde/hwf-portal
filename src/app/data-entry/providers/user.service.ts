import { Injectable } from '@angular/core';
import {Http, Headers} from '@angular/http';
import {HttpClientService} from "../../providers/http-client.service";
import {Observable} from "rxjs/Observable";

@Injectable()
export class UserService {

  userSubscriber;
  constructor(private http: HttpClientService) {
    this.userSubscriber = http.get("me.json?fields=userCredentials[userRoles[authorities,programs[id,name]]],organisationUnits");
  }

  getUser(){
    return this.userSubscriber;
  }
  user;
  getAuthorities(){
    return new Observable((observer)=>{
      if(this.user){
        observer.next(this.populateAuthorities())
      }else{
        this.userSubscriber.subscribe((userData:any)=>{
          this.user = userData;

          observer.next(this.populateAuthorities())
        })
      }
    })
  }
  getPrograms(){
    return new Observable((observer)=>{
      if(this.user){
        observer.next(this.populateProgramNames())
      }else{
        this.userSubscriber.subscribe((userData:any)=>{
          this.user = userData;

          observer.next(this.populateProgramNames())
        })
      }
    })
  }
  getRootOrganisationUnits(){
    return new Observable((observer)=>{
      if(this.user){
        observer.next(this.user.organisationUnits)
      }else{
        this.userSubscriber.subscribe((userData:any)=>{
          this.user = userData;

          observer.next(this.user.organisationUnits)
        })
      }
    })
  }
  populateAuthorities(){
    let authorities = [];
    this.user.userCredentials.userRoles.forEach((userRole:any)=>{
      authorities = authorities.concat(userRole.authorities)
    })
    return authorities;
  }
  populateProgramNames(){
    let programs = [];
    console.log(this.user.userCredentials.userRoles);
    this.user.userCredentials.userRoles.forEach((userRole:any)=>{
      userRole.programs.forEach((program:any)=>{
        programs.push(program.name);
      })
    })
    return programs;
  }
}
