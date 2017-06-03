import {LegendSet} from "./legend-set";
export interface MapObject {
  id: string;
  centeringLayer:any;
  mapLegend: any;
  options: {
    center: any;
    zoom: number;
    maxZoom: number;
    minZoom: number;
    zoomControl: boolean;
    scrollWheelZoom: boolean;
    layers: any[];

  }

}


