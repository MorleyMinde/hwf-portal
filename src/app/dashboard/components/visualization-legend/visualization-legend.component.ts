import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import * as _ from 'lodash';
import {LegendSet} from "../../model/legend-set";
import {LegendSetService} from "../../providers/legend-set.service";
import {TILE_LAYERS} from "../../constants/tile-layers";

@Component({
  selector: 'app-visualization-legend',
  templateUrl: 'visualization-legend.component.html',
  styleUrls: ['visualization-legend.component.css']
})
export class VisualizationLegendComponent implements OnInit {
  @Input() visualizationObject: any;
  @Output() changeMapTileLayer: EventEmitter<any> = new EventEmitter();
  @Output() closeLegend: EventEmitter<any> = new EventEmitter();
  @Output() changeMapDataLayer: EventEmitter<any> = new EventEmitter();
  @Output() stickyLegend: EventEmitter<any> = new EventEmitter();
  visualizationLegends: LegendSet[] = [];
  visualizationTileLayersLegends: any[];
  openTileLegend: boolean = false;
  sticky: boolean = false;
  isRemovable: boolean = false;


  constructor(private legend: LegendSetService) {

  }

  ngOnInit() {
    let boundaryLegends = [];
    let eventLegends = [];
    let thematicLegends = [];
    if (this.visualizationObject.type == "MAP" || this.visualizationObject.type == "REPORT_TABLE" || this.visualizationObject.type == "CHART" || this.visualizationObject.type == "EVENT_REPORT" || this.visualizationObject.type == "EVENT_CHART") {
      const mapLayers = this.visualizationObject.layers;

      this.visualizationTileLayersLegends = this.legend.prepareTileLayers(TILE_LAYERS);
      mapLayers.forEach((mapLayer, mapLayerIndex) => {
          const mapVisualizationSettings = mapLayer.settings;
          const mapVisualizationAnalytics = mapLayer.analytics;
          if (mapLayer.settings.layer == 'boundary') {

          }

          if (mapLayer.settings.layer == 'event') {
            eventLegends.push(this._prepareLayerLegend(mapVisualizationSettings, mapVisualizationAnalytics, this.legend.prepareEventLayerLegendClasses(mapVisualizationSettings, mapVisualizationAnalytics)))
          }

          if (mapLayer.settings.layer.indexOf('thematic') > -1) {


            thematicLegends.push(this._prepareLayerLegend(mapVisualizationSettings, mapVisualizationAnalytics, this.legend.prepareThematicLayerLegendClasses(mapVisualizationSettings, mapVisualizationAnalytics)));

          }
        }
      )

      this.visualizationLegends = [...boundaryLegends, ...thematicLegends, ...eventLegends];
    }

    this.visualizationLegends.forEach((legend, legendIndex) => {
      legendIndex == 0 ? legend.opened = true : legend.opened = false;
    })


  }

  private _prepareLayerLegend(mapVisualizationSettings, mapVisualizationAnalytics, legendClasses) {
    let layerLegend: LegendSet = {
      id: mapVisualizationSettings.id,
      name: mapVisualizationSettings.layer == 'event' ? this.legend.getEventName(mapVisualizationAnalytics)[0] : mapVisualizationSettings.name,
      description: mapVisualizationSettings.subtitle,
      pinned: false,
      hidden: false,
      opened: false,
      useIcons: false,
      isEvent: mapVisualizationSettings.layer == 'event' ? true : false,
      opacity: mapVisualizationSettings.opacity,
      classes: legendClasses,
      change: []
    }

    return layerLegend;
  }

  changeTileLayer(tileLegend) {
    let checked = 0;
    this.visualizationTileLayersLegends.forEach(tileLegendLoop => {

      if (tileLegendLoop.active && tileLegend.name == tileLegendLoop.name) {
        tileLegendLoop.active = false;
        this.changeMapTileLayer.emit(tileLegendLoop);
        checked++;
      } else if (!tileLegendLoop.active && tileLegend.name == tileLegendLoop.name && checked < 1) {
        tileLegendLoop.active = true;
        this.changeMapTileLayer.emit(tileLegendLoop);
      }
      else {
        tileLegendLoop.active = false;
      }


    })


  }

  toggleLegendView(legendToggled, index) {

    this.visualizationLegends.forEach((legend, legendIndex) => {
      index == legendIndex ? legend.opened = !legend.opened : legend.opened = false;
    })
  }

  toggleRemoveButton() {
    this.isRemovable = !this.isRemovable;
  }

  removeLegendContainer() {
    this.closeLegend.emit(null);
  }

  toggleTileLegendView() {
    this.openTileLegend = !this.openTileLegend;
  }

  stickLegendContainer() {
    this.sticky = !this.sticky;
    this.stickyLegend.emit(this.sticky)
  }

  toggleLayerView(layer,layerType){
    _.find(this.visualizationLegends,['id',layer.id]).hidden = !_.find(this.visualizationLegends,['id',layer.id]).hidden;
  }

  shortenTitle(longTitle) {
    if (longTitle.length > 25) {
      return longTitle.substr(0, 25) + "..";
    } else if (longTitle.length == 0) {
      return "Layer Legend";
    }
    else if (longTitle.length <= 25) {
      return longTitle;
    }
    return longTitle;
  }

}
