import {Injectable} from "@angular/core";
export const TILE_LAYERS = {
  osmLight: {
    name: 'openStreetMap',
    label: 'OSM Light',
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    maxZoom: 18,
    attribution: '&copy;<a href="https://carto.com/attribution">cartoDB</a>'
  },

  googleSheetsBaseMap: {
    name: 'googleSheetsBaseMap',
    label: 'Esri WorldStreetMap',
    maxZoom: 18,
    url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri'
  },

  googleHybrid: {
    name: 'googleHybrid',
    label: 'Earth Imagery',
    maxZoom: 18,
    url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri'
  }
};

@Injectable()
export class TileLayers {
  getTileLayer(tileLayerId) {
    const tileLayer = TILE_LAYERS[tileLayerId];
    return tileLayer ? tileLayer : TILE_LAYERS['osmLight'];
  }
}
