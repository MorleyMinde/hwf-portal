import { Injectable } from '@angular/core';
import {Http, Headers, Response} from '@angular/http';
import 'rxjs/add/operator/map'
import {Observable} from "rxjs";

@Injectable()
export class HttpClientService {
  public APIURL = "api/";
  constructor(private http: Http) {
    this.http = http;
  }

  createAuthorizationHeader(headers:Headers,options?) {
    if(options){
      for(let key in options){
        headers.append(key, options[key]);
      }
    }
  }

  get(url) {
    let headers = new Headers();
    this.createAuthorizationHeader(headers);
    return this.http.get(this.APIURL + url, {
      headers: headers
    }).map(this.responseHandler()).catch(this.handleError);
  }

  post(url, data,options?) {
    let headers = new Headers();
    this.createAuthorizationHeader(headers,options);
    return this.http.post(this.APIURL + url, data, {
      headers: headers
    }).map(this.responseHandler()).catch(this.handleError);
  }
  put(url, data,options?) {
    let headers = new Headers();
    this.createAuthorizationHeader(headers,options);
    return this.http.put(this.APIURL + url, data, {
      headers: headers
    }).map(this.responseHandler()).catch(this.handleError);
  }
  delete(url,options?) {
    let headers = new Headers();
    this.createAuthorizationHeader(headers,options);
    return this.http.delete(this.APIURL + url, {
      headers: headers
    }).map(this.responseHandler()).catch(this.handleError);
  }
  responseHandler(){
    return (res)=>{
      try{
        let returnJSON = res.json();
        return returnJSON;
      }catch(e){
        location.reload();
        return null;
      }
    }
  }

  handleError (error: Response | any) {
    // In a real world app, we might use a remote logging infrastructure
    // let errMsg: string;
    // if (error instanceof Response) {
    //   const body = error.json() || '';
    //   const err = body.error || JSON.stringify(body);
    //   errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    // } else {
    //   errMsg = error.message ? error.message : error.toString();
    // }
    return Observable.throw(error);
  }
}
