import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {LoaderComponent} from "./components/loader/loader.component";
import { OrgUnitFilterComponent } from './components/org-unit-filter/org-unit-filter.component';
import {OrgUnitService} from "./components/org-unit-filter/org-unit.service";
import {PeriodFilterComponent} from "./components/period-filter/period-filter.component";
import {TreeModule} from "angular-tree-component/dist/angular-tree-component";
import {FormsModule} from "@angular/forms";
import {FilterLevelPipe} from "./pipes/filter-level.pipe";
import {FuseSearchPipe} from "./pipes/fuse-search.pipe";
import {ReadableNamePipe} from "./pipes/readable-name.pipe";
import {DndModule} from "ng2-dnd";
import {ErrorNotifierComponent} from "./components/error-notifier/error-notifier.component";

@NgModule({
  imports: [
    CommonModule,
    TreeModule,
    FormsModule,
    DndModule.forRoot()
  ],
  declarations: [
    LoaderComponent,
    OrgUnitFilterComponent,
    PeriodFilterComponent,
    FilterLevelPipe,
    FuseSearchPipe,
    ReadableNamePipe,
    ErrorNotifierComponent
  ],
  providers: [
    OrgUnitService
  ],
  exports: [
    LoaderComponent,
    OrgUnitFilterComponent,
    PeriodFilterComponent,
    FilterLevelPipe,
    FuseSearchPipe,
    ReadableNamePipe,
    ErrorNotifierComponent
  ]
})
export class SharedModule { }
