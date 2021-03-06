import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {DashboardRoutingModule} from './dashboard-routing.module';
import {DashboardComponent} from './dashboard.component';
import {SharedModule} from "../shared/shared.module";
import {DashboardItemCardComponent} from './components/dashboard-item-card/dashboard-item-card.component';
import {MapComponent} from './components/map/map.component';
import {ChartComponent} from './components/chart/chart.component';
import {TableComponent} from './components/table/table.component';
import {VisualizerService} from "./providers/visualizer.service";
import {VisualizationObjectService} from "./providers/visualization-object.service";
import {AnalyticsService} from "./providers/analytics.service";
import {FavoriteService} from "./providers/favorite.service";
import {MapService} from "./providers/map.service";
import {ChartService} from "./providers/chart.service";
import {TableService} from "./providers/table.service";
import {Color} from "./providers/color";
import {ColorInterpolationService} from "./providers/color-interpolation.service";
import {VisualizationStore} from "./providers/visualization-store";
import {Constants} from "./providers/constants";
import {MapVisualizationService} from "./providers/map-visualization.service";
import {TileLayers} from "./constants/tile-layers";
import {LegendSetService} from "./providers/legend-set.service";
import {VisualizationLegendComponent} from "./components/visualization-legend/visualization-legend.component";
import { ChartBlockComponent } from './components/chart-block/chart-block.component';
import {DashboardService} from "./providers/dashboard.service";
import {Utilities} from "./providers/utilities";
import {ReportComponent} from "./report/report.component";

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    DashboardRoutingModule
  ],
  providers: [
    VisualizerService,
    VisualizationObjectService,
    VisualizationStore,
    MapVisualizationService,
    AnalyticsService,
    FavoriteService,
    MapService,
    ChartService,
    TableService,
    ColorInterpolationService,
    Constants,
    TileLayers,
    LegendSetService,
    DashboardService,
    Utilities
  ],
  declarations: [ReportComponent,DashboardComponent, DashboardItemCardComponent, MapComponent, ChartComponent, TableComponent, ChartBlockComponent, VisualizationLegendComponent]
})
export class DashboardModule { }
