import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {DataEntryComponent} from "./data-entry.component";
import {HomeComponent} from "./components/home/home.component";
import {SubOrganisationUnitsComponent} from "./components/sub-organisation-units/sub-organisation-units.component";
import {WaterPointComponent} from "./components/water-point/water-point.component";
import {HintsComponent} from "./components/hints/hints.component";

const routes: Routes = [
  {
    path: '', component: DataEntryComponent,
    children:[
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
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class DataEntryRoutingModule { }
