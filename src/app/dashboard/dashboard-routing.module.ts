import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {DashboardComponent} from "./dashboard.component";
import {ReportComponent} from "./report/report.component";

const routes: Routes = [
  {path: '', component: DashboardComponent},
  {path: 'report', component: ReportComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
