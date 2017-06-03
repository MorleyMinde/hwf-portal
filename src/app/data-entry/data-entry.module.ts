import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {Ng2PaginationModule} from 'ng2-pagination';
import {SelectModule} from 'ng2-select/ng2-select';

import { DataEntryRoutingModule } from './data-entry-routing.module';
import {DataEntryComponent} from "./data-entry.component";
import {SharedModule} from "../shared/shared.module";
import {SubOrganisationUnitsComponent} from "./components/sub-organisation-units/sub-organisation-units.component";
import {HomeComponent} from "./components/home/home.component";
import {AttributePipe} from "./pipes/attribute.pipe";
import {DataElementFinderPipe} from "./pipes/data-element-finder.pipe";
import {KeysPipe} from "./pipes/keys.pipe";
import {OrderByPipe} from "./pipes/order-by.pipe";
import {SearchPipe} from "./pipes/search.pipe";
import {DatasetComponent} from "./components/dataset/dataset.component";
import {PeriodPickerComponent} from "./components/period-picker/period-picker.component";
import {WaterPointComponent} from "./components/water-point/water-point.component";
import {InputComponent} from "./components/input/input.component";
import {CoordinateComponent} from "./components/coordinate/coordinate.component";
import { FilterOrgUnitAttributesPipe } from './pipes/filter-org-unit-attributes.pipe';
import { HintsComponent } from './components/hints/hints.component';
import {ChangeService} from "./providers/change.service";
import { ErrorPipe } from './pipes/error.pipe';
import { MessageComponent } from './components/message/message.component';
import {UserService} from "./providers/user.service";
import { HideOptionsPipe } from './pipes/hide-options.pipe';
import { SelectComponent } from './components/select/select.component';
import { YearPickerComponent } from './components/year-picker/year-picker.component';
import {PaginationModule, CollapseModule, ModalModule, BsDropdownModule, TooltipModule} from "ngx-bootstrap";
import {MyDatePickerModule} from "mydatepicker";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    CollapseModule,
    ModalModule,
    SelectModule,
    DataEntryRoutingModule,
    Ng2PaginationModule,
    SharedModule,
    PaginationModule.forRoot(),
    MyDatePickerModule,
    BsDropdownModule.forRoot(),
    TooltipModule.forRoot()
  ],
  declarations: [
    WaterPointComponent,
    DatasetComponent,
    PeriodPickerComponent,
    CoordinateComponent,
    DataEntryComponent,
    SubOrganisationUnitsComponent,
    HomeComponent,
    AttributePipe,
    DataElementFinderPipe,
    KeysPipe,
    OrderByPipe,
    SearchPipe,
    InputComponent,
    FilterOrgUnitAttributesPipe,
    HintsComponent,
    ErrorPipe,
    MessageComponent,
    HideOptionsPipe,
    SelectComponent,
    YearPickerComponent
  ],
  providers:[ChangeService,UserService]
})
export class DataEntryModule { }
