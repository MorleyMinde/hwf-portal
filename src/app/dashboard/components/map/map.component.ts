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
  subtitle: string = "";
  pinned: boolean = false;

  constructor(private mapVisualizationService: MapVisualizationService,
              private visualizationObjectService: VisualizationObjectService) {
  }

  ngOnInit() {
    if (this.initialMapData) {
      if (!this.initialMapData.details.loaded) {
        this.loadMap(this.initialMapData)
      } else {
        this.mapData = this.initialMapData;
        this.loading = false;
        if (!this.mapData.details.hasError) {
          setTimeout(() => {
            this.mapData = this.getSubtitle(this.mapData);
            this.drawMap(this.mapData);
          }, 10);
          this.hasError = false;
        } else {
          this.hasError = true;
          this.errorMessage = this.mapData.details.errorMessage;
        }
      }
    }
  }

  loadMap(initialMapData, prioritizeFilter?: boolean) {
    this.loading = true;
    if (initialMapData) {
      this.mapData = initialMapData;
      this.visualizationObjectService.getSanitizedVisualizationObject(initialMapData)
        .subscribe(sanitizedMapData => {
          if (sanitizedMapData) {
            this.mapData = sanitizedMapData;
            if (this.mapData.details.loaded) {
              if (!this.mapData.details.hasError) {
                setTimeout(() => {
                  this.mapData = this.getSubtitle(this.mapData);
                  this.drawMap(this.mapData, prioritizeFilter);
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

  drawMap(mapData: Visualization, prioritizeFilter?: boolean) {
    const mapObject = this.mapVisualizationService.drawMap(L, mapData, prioritizeFilter);
    this.prepareMapContainer(mapObject.id, this.mapHeight, this.mapWidth);
    this.map = L.map(mapObject.id, mapObject.options);
    this.centeringLayer = mapObject.centeringLayer;
    this.mapLegend = mapObject.mapLegend;

    L.control.zoom({position: "topright"}).addTo(this.map);
    this.updateOnLayerLoad(mapObject);
  }


  recenterMap(map, layer) {

    let bounds = layer.getBounds();
    if (this._checkIfValidCoordinate(bounds)) {
      map.fitBounds(layer.getBounds());
    } else {
      this.hasError = true;
      this.errorMessage = "Invalid organisation unit boundaries found!";
    }

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

  getSubtitle(mapData) {
    let layers = mapData.layers;
    layers.forEach(layer => {
      if (layer.settings.subtitle) {
        mapData['subtitle'] = layer.settings.subtitle;
      }
    })
    return mapData;
  }

  private _checkIfValidCoordinate(bounds) {

    let boundLength = Object.getOwnPropertyNames(bounds).length;
    if (boundLength > 0) {
      return true;
    }
    else {
      return false;
    }
  }

  prepareMapContainer(mapObjectId, height, width) {
    let parentElement = document.getElementById('map-view-port-' + mapObjectId);
    let mapContainer = document.getElementById(mapObjectId);

    if (mapContainer) {
      mapContainer.parentNode.removeChild(mapContainer);
    }
    let div = document.createElement("div");
    div.setAttribute("id", mapObjectId);
    div.style.width = width;
    div.style.height = height;
    if (parentElement) {
      parentElement.appendChild(div);
    }
  }


  resizeMap(dimension, dimensionType) {
    let container = document.getElementById(this.mapData.id);
    // this.mapHeight = '0px';
    // this.mapWidth = "0%";
    console.log(dimension, dimensionType);
    container.style.width = '0%';
    container.style.width = "0%";
    this.mapWidth = '0%';

    if (dimension && dimensionType) {
      if (dimensionType == "fullscreen") {
        container.style.height = '75vh';
        container.style.width = "100%";
        this.mapWidth = "100%";
      } else {
        container.style.height = '340px';
        container.style.width = "100%";
        this.mapWidth = "100%";
      }

    } else {
      container.style.height = '340px';
      container.style.width = "100%";
      this.mapWidth = "100%";
    }

    setTimeout(() => {
      this.map.invalidateSize({pan: true});
    }, 800);
  }


  toggleLegendContainerView() {
    if (this.pinned) {
      this.legendIsOpen = this.pinned;
    } else {
      this.legendIsOpen = !this.legendIsOpen;
    }

  }

  changeMapTileLayer(event) {
      if (event.active) {
        this.mapData.details.mapConfiguration.basemap = event.name;
      } else {
        this.mapData.details.mapConfiguration.basemap = null;
      }
      this.drawMap(this.mapData);


  }

  stickyMapLegend(event) {
    this.pinned = event;
  }

  closeMapLegend() {
    this.legendIsOpen = false;
    this.pinned = false;
  }

}
