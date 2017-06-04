import { Component } from '@angular/core';
import {CurrentUserService} from "./providers/current-user.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Water Point Data Manager';

  constructor(
    private currentUserService: CurrentUserService
  ) {
    currentUserService.load();
  }
}
