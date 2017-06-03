import {Component, OnInit, Input} from '@angular/core';
import {Visualization} from "../../model/visualization";
import * as _ from 'lodash';
import 'leaflet';
import 'leaflet.markercluster';
import {MapVisualizationService} from "../../providers/map-visualization.service";
import {VisualizationObjectService} from "../../providers/visualization-object.service";
declare var L;


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  @Input() initialMapData: Visualization;
  mapData: Visualization;
  loading: boolean = true;
  hasError: boolean = false;
  errorMessage: string;
  legendIsOpen: boolean = false;
  mapHeight: any = '350px';
  mapWidth: any = '100%';
  map: any = {};
  centeringLayer: any;
  mapLegend: any;
  legendMarginRight = '25px';
  legendMarginLeft = '200px';
  constructor(
    private mapVisualizationService: MapVisualizationService,
    private visualizationObjectService: VisualizationObjectService
  ) { }

  ngOnInit() {
    this.loadMap(this.initialMapData)
  }

  loadMap(initialMapData) {
    this.loading = true;
    if(initialMapData) {
      this.mapData = initialMapData;
      this.visualizationObjectService.getSanitizedVisualizationObject(initialMapData)
        .subscribe(sanitizedMapData => {
          if (sanitizedMapData) {
            this.mapData = sanitizedMapData;
            if (this.mapData.details.loaded) {
              if (!this.mapData.details.hasError) {
                setTimeout(() => {
                  this.drawMap(this.mapData);
                }, 10);
                this.hasError = false;
              } else {
                this.hasError = true;
                this.loading = false;
                this.errorMessage = this.mapData.details.errorMessage;
              }
            }
          }
        })
    }
  }

  drawMap(mapData: Visualization) {
    const mapObject = this.mapVisualizationService.drawMap(L, mapData);
    this.prepareMapContainer(mapObject.id, this.mapHeight, this.mapWidth);
    this.map = L.map(mapObject.id, mapObject.options);
    this.centeringLayer = mapObject.centeringLayer;
    this.mapLegend = mapObject.mapLegend;
    L.control.zoom({position: "topright"}).addTo(this.map);
    this.updateOnLayerLoad(mapObject);
  }


  recenterMap(map, layer) {
    map.fitBounds(layer.getBounds());
  }

  updateOnLayerLoad(mapObject) {
    if (this.map.hasLayer(this.centeringLayer)) {
      this.loading = false;
      setTimeout(() => {
        this.map.invalidateSize({pan: true});
        this.recenterMap(this.map, mapObject.centeringLayer);
      }, 10);

    }
  }

  prepareMapContainer(mapObjectId, height, width) {
    let parentElement = document.getElementsByClassName('map-view-port-' + mapObjectId)[0];
    let mapContainer = document.getElementById(mapObjectId);

    if (mapContainer) {
      mapContainer.parentNode.removeChild(mapContainer);
    }
    let div = document.createElement("div");
    div.setAttribute("id", mapObjectId);
    div.style.width = width;
    div.style.height = height;
    parentElement.appendChild(div);
  }


  toggleLegendContainerView() {
    this.legendIsOpen = !this.legendIsOpen;
  }

}
