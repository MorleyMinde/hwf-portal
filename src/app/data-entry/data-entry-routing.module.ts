import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {DataEntryComponent} from "./data-entry.component";
import {HomeComponent} from "./components/home/home.component";
import {SubOrganisationUnitsComponent} from "./components/sub-organisation-units/sub-organisation-units.component";
import {WaterPointComponent} from "./components/water-point/water-point.component";
import {HintsComponent} from "./components/hints/hints.component";

let children = [
  {path: '', component: HomeComponent},
  {
    path: 'orgUnit/:id',
    component: SubOrganisationUnitsComponent,
    children:[
      {path: '', component: HintsComponent},
      {path: 'waterPoint/:waterPointId', component: WaterPointComponent}
    ]
  },{
    path: 'orgUnit/:id/level/:level',
    component: SubOrganisationUnitsComponent,
    children:[
      {path: '', component: HintsComponent},
      {path: 'waterPoint/:waterPointId', component: WaterPointComponent}
    ]
  },
  {path: ':readonly', component: HomeComponent},
  {
    path: ':readonly/orgUnit/:id',
    component: SubOrganisationUnitsComponent,
    children:[
      {path: '', component: HintsComponent},
      {path: 'waterPoint/:waterPointId', component: HintsComponent}
    ]
  },{
    path: ':readonly/orgUnit/:id/level/:level',
    component: SubOrganisationUnitsComponent,
    children:[
      {path: '', component: HintsComponent},
      {path: 'waterPoint/:waterPointId', component: HintsComponent}
    ]
  },
  {
    path: ':readonly/orgUnit/:id/period/:pe',
    component: SubOrganisationUnitsComponent,
    children:[
      {path: '', component: HintsComponent},
      {path: 'waterPoint/:waterPointId', component: HintsComponent}
    ]
  },{
    path: ':readonly/orgUnit/:id/level/:level/period/:pe',
    component: SubOrganisationUnitsComponent,
    children:[
      {path: '', component: HintsComponent},
      {path: 'waterPoint/:waterPointId', component: HintsComponent}
    ]
  }
]
const routes: Routes = [
  {
    path: '', component: DataEntryComponent,
    children:children
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class DataEntryRoutingModule { }
