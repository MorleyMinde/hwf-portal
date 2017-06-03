import {Injectable} from "@angular/core";
export const TILE_LAYERS = {
  osmLight: {
    name: 'osmLight',
    label: 'OSM Light',
    url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    maxZoom: 18,
    attribution: '&copy;<a href="https://carto.com/attribution">cartoDB</a>',
    image:'/assets/img/map-tiles/esri_osm_light.png'
  },

  googleStreetsBaseMap: {
    name: 'googleStreetsBaseMap',
    label: 'Esri WorldStreetMap',
    maxZoom: 18,
    url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    image:'/assets/img/map-tiles/esri_street_map.png'
  },

  googleHybrid: {
    name: 'googleHybrid',
    label: 'Earth Imagery',
    maxZoom: 18,
    url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
    image:'/assets/img/map-tiles/esri_world_imagery.png'
  }
};

@Injectable()
export class TileLayers {
  getTileLayer(tileLayerId) {
    const tileLayer = TILE_LAYERS[tileLayerId];
    return tileLayer ? tileLayer : TILE_LAYERS['osmLight'];
  }
}
