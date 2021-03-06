import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import {AppRoutingModule} from "./app.routing.module";
import { MenuComponent } from './menu/menu.component';
import {FilterPipe} from "./menu/filter.pipe";
import {HttpClientService} from "./providers/http-client.service";
import {CurrentUserService} from "./providers/current-user.service";
import {Constants} from "./providers/constants";
import {DndModule} from "ng2-dnd";

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    FilterPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule,
    DndModule.forRoot()
  ],
  providers: [
    HttpClientService,
    CurrentUserService,
    Constants
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
