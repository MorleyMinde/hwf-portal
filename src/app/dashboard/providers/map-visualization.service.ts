import {Injectable} from '@angular/core';
import {Visualization} from "../model/visualization";
import {MapObject} from "../model/map-object";
import {TileLayers} from "../constants/tile-layers";
import * as _ from 'lodash';
import {Color} from "./color";
import {ColorInterpolationService} from "./color-interpolation.service";


module colorModule {
  export class Color {
    constructor(public red: number, public green: number, public blue: number) {
    }

    private coll: Array<any> = [this.red, this.green, this.blue];
    private valid = this.colorIsVerid(this.coll);
    private text = this.colorText(this.coll, 'hex');
    private bg = this.colorText(this.coll, 'hex');


    colorIsVerid(colorSectionList) {
      let isValid = 'n';
      if ((!isNaN(colorSectionList[0])) && (!isNaN(colorSectionList[1])) && (!isNaN(colorSectionList[2]))) {
        isValid = 'y'
      }
      return isValid;
    }

    colorText(colorSectionList: Array<any>, colorFormat: String) {
      let base: number = 0;
      let denominator: number = 1;
      let result: String = '';

      if (colorFormat == 'hex') {
        base = 16;
      }

      colorSectionList.forEach((colorSection, colorSectionIndex) => {
        let colorSectionSegment = Math.round(colorSection / denominator);
        let colorSegmentString = colorSectionSegment.toString(base);

        if (colorFormat == 'hex' && colorSegmentString.length < 2) {
          colorSegmentString = '0' + colorSegmentString;
        }
        result = result + colorSegmentString;
      })

      if (colorFormat == 'hex') {
        result = '#' + result.toUpperCase();
      }
      return result;
    }

  }
}


@Injectable()
export class MapVisualizationService {


  private colorHigh: String;
  private colorLow: String;
  private colorType: String = "Hex";
  private ends: Array<any> = [Color, Color];
  private step: Array<any> = [];
  public centeringLayer: null;

  constructor(private tileLayers: TileLayers,
              private colorInterpolation: ColorInterpolationService) {
  }

  drawMap(L, visualizationObject: Visualization): MapObject {
    let mapObject: MapObject = this._getInitialMapObject(visualizationObject);
    const layers = this._getMapLayers(L, visualizationObject.layers, visualizationObject.details.mapConfiguration.basemap);
    mapObject.options.layers = layers[0];
    mapObject.centeringLayer = layers[1];
    mapObject.mapLegend = "am there";

    return mapObject;
  }

  private _getInitialMapObject(visualizationObject: Visualization): MapObject {
    return {
      id: visualizationObject.id,
      mapLegend: null,
      centeringLayer: null,
      options: {
        center: [visualizationObject.details.mapConfiguration.latitude, visualizationObject.details.mapConfiguration.longitude],
        zoom: visualizationObject.details.mapConfiguration.zoom,
        maxZoom: 18,
        minZoom: 2,
        zoomControl: true,
        scrollWheelZoom: false,
        layers: []
      }
    };
  }

  private _getMapLayers(L, visualizationLayers, basemap): any {
    let mapLayers: any[] = [];
    let centeringLayer: any = null;
    /**
     * Get tile layer from basemap configuration
     */
    mapLayers.push(this._prepareTileLayer(L, this.tileLayers.getTileLayer(basemap)));

    /**
     * Get other layers as received from visualization Object
     */
    let layersObjectList = [];
    visualizationLayers.forEach((layer, layerIndex) => {
      if (layer.settings.hasOwnProperty('layer')) {

        if (layer.settings.layer == 'boundary' || layer.settings.layer.indexOf('thematic') != -1 || layer.settings.layer == 'facility') {
          let centerLayer = this._prepareGeoJSON(L, layer.settings, layer.analytics);
          mapLayers.push(centerLayer);

          /**
           * Also add centering
           * @type {L.GeoJSON}
           */
          centeringLayer = centerLayer;

        } else if (layer.settings.layer == 'event') {
          if (layer.settings.eventClustering) {
            let centerLayer = this._prepareMarkerClusters(L, layer.settings, layer.analytics);
            mapLayers.push(centerLayer);
          } else {
            let centerLayer = this._prepareMarkersLayerGroup();
            mapLayers.push(centerLayer);
          }

        } else if (layer.settings.layer == 'external') {
          mapLayers.push(this._prepareTileLayer(L, this._prepareExternalTileLayer(layer.settings.config)));
        } else if (layer.settings.layer == 'earthEngine') {
          mapLayers.push(this._prepareEarthEngineLayer());
        }

      }
    });

    return [mapLayers, centeringLayer];
  }

  private _prepareTileLayer(L, tileLayer): any {
    if (!tileLayer) {
      return null;
    }

    return L.tileLayer(tileLayer.url, {
      maxZoom: tileLayer.maxZoom,
      attribution: tileLayer.attribution
    });
  }

  private _prepareExternalTileLayer(layerConfig) {
    let tileLayer: any = null;

    if (layerConfig) {
      const layerConfiguration = eval('(' + layerConfig.config + ')');

      if (layerConfiguration.hasOwnProperty('url')) {
        tileLayer.url = layerConfiguration.url;
        tileLayer.name = layerConfiguration.name;
        tileLayer.label = layerConfiguration.name;
        tileLayer.attribution = layerConfiguration.attribution;
      }
    }

    return tileLayer;
  }

  private _prepareGeoJSON(L, visualizationLayerSettings, visualizationAnalytics) {
    const options: any = {};
    const mapLegend = this._prepareMapLegend(visualizationLayerSettings, visualizationAnalytics);
    options.style = (feature) => {
      return this._prepareFeatureStyle(feature, visualizationLayerSettings, mapLegend);
    }
    const layer = this._getGEOJSONLayer(L,visualizationLayerSettings, visualizationAnalytics, options);
    // this._prepareDataCatchedValues(visualizationLayerSettings, visualizationAnalytics);
    return layer;
  }

  private _getGEOJSONLayer(L,visualizationLayerSettings, visualizationAnalytics, options) {

    options.onEachFeature = (feature) => {
      if (feature.properties.dataElement) {
      }
    }
    let layer: any = L.geoJSON(this._getGeoJSONObject(visualizationLayerSettings.geoFeature, visualizationAnalytics), options);

    layer.on(
      {
        click: (feature, layer) => {

        },
        mouseover: (event) => {
          const hoveredFeature: any = event.layer.feature;
          const featureName = hoveredFeature.properties.name;
          let dataValue: any = "";
          console.log(visualizationLayerSettings.id);
          dataValue = this._getFeatureDataFromAnalytics(hoveredFeature, visualizationLayerSettings);

          let toolTipContent: string =
            "<div style='color:#333!important;font-size: 10px'>" +
            "<table>" +
            "<tr><td style='color:#333!important;font-weight:bold;'>" + featureName + "</td><td style='color:#333!important;' > " + dataValue + "</td>" +
            "</tr>" +
            "</table>" +
            "</div>";


          layer.bindTooltip(toolTipContent, {
            direction: 'auto',
            permanent: false,
            sticky: true,
            interactive: true,
            opacity: 1
          });

          let popUp = layer.getPopup();
          if (popUp && popUp.isOpen()) {

          } else {
            layer.bindPopup(toolTipContent);
          }


          layer.setStyle((feature: GeoJSON.Feature<GeoJSON.GeometryObject>) => {
            let properties: any = feature.properties;

            let featureStyle: any =
              {
                "stroke": true,
                "weight": 1
              }
            let hov: any = hoveredFeature.properties;
            if (hov.id == properties.id) {
              featureStyle.weight = 3;
            }


            return featureStyle;
          });


        },
        mouseout: (event) => {
          const hoveredFeature: any = event.layer.feature;
          layer.setStyle((feature: GeoJSON.Feature<GeoJSON.GeometryObject>) => {
            let properties: any = feature.properties;

            let featureStyle: any =
              {
                "stroke": true,
                "weight": 1
              }
            let hov: any = hoveredFeature.properties;
            if (hov.id == properties.id) {
              featureStyle.weight = 1;
            }
            return featureStyle;
          });
        }
      }
    );

    return layer;
  }

  private _prepareDataCatchedValues(visualizationLayerSettings, visualizationAnalytics) {
    let mapObject: any = {};

    let orgunitIndex = _.findIndex(visualizationAnalytics.headers, ['name', 'ou']);
    let valueIndex = _.findIndex(visualizationAnalytics.headers, ['name', 'value']);
    let periodIndex = _.findIndex(visualizationAnalytics.headers, ['name', 'pe']);
    let dataIndex = _.findIndex(visualizationAnalytics.headers, ['name', 'dx']);

    let organisationUnits: any[] = [];
    if (visualizationAnalytics.rows) {
      visualizationAnalytics.rows.forEach(row => {
        let unit: any = {};
        unit.id = row[orgunitIndex];
        unit.name = visualizationAnalytics.metaData.names[row[orgunitIndex]];
        unit.period = visualizationAnalytics.metaData.names[row[periodIndex]];
        unit.dataElement = visualizationAnalytics.metaData.names[row[dataIndex]];
        unit.value = row[valueIndex];
        organisationUnits.push(unit);
      })
      localStorage.setItem(visualizationLayerSettings.id, JSON.stringify(organisationUnits));
    }
  }

  private _getFeatureDataFromAnalytics(feature, visualizationLayerSettings) {

    return "";
  }

  private _getGeoJSONObject(geoFeatures: any[], analyticObject: any): any {
    let geoJSONObject: any = [];
    if (geoFeatures) {
      geoFeatures.forEach((geoFeature) => {
        let sampleGeometry: any = {
          type: 'Feature',
          le: geoFeature.le,
          geometry: {type: "", coordinates: JSON.parse(geoFeature.co)},
          properties: {id: geoFeature.id, name: geoFeature.na}
        };


        /**
         * Also get data if analytics is not empty
         */
        if (analyticObject.hasOwnProperty('headers')) {
          const dataElement = this._getDataForGeoFeature(geoFeature.id, analyticObject);

          if (dataElement) {
            sampleGeometry.properties.dataElement = dataElement;
          }
        }

        //TODO FIND BEST WAY TO DETERMINE FEATURE TYPE
        if (geoFeature.le >= 4) {
          sampleGeometry.geometry.type = 'Point';
        } else if (geoFeature.le >= 1) {
          sampleGeometry.geometry.type = 'MultiPolygon';
        }

        geoJSONObject.push(sampleGeometry);
      });
      return geoJSONObject;
    }
  }

  private _getDataForGeoFeature(geoFeatureId: string, analyticObject: any): any {
    let data: any = {};
    const geoFeatureIndex = analyticObject.headers.indexOf(_.find(analyticObject.headers, ['name', 'ou']));
    const dataIndex = analyticObject.headers.indexOf(_.find(analyticObject.headers, ['name', 'value']));
    const metadataIndex = analyticObject.headers.indexOf(_.find(analyticObject.headers, ['name', 'dx']));

    analyticObject.rows.forEach(row => {
      if (geoFeatureId == row[geoFeatureIndex]) {
        data.id = row[metadataIndex];
        data.name = analyticObject.metaData.names[row[metadataIndex]];
        data.value = row[dataIndex]
      }
    });

    return data != {} ? data : undefined;
  }

  private _prepareFeatureStyle(feature, visualizationLayerSettings, legendSet) {
    let opacity = visualizationLayerSettings.opacity;
    let featureStyle: any = {
      "color": "#000000",
      "fillColor": "#ffffff",
      "fillOpacity": 0,
      "weight": 1,
      "opacity": 0.8,
      "stroke": true
    }

    if (feature.properties.dataElement) {
      featureStyle = this._updateFillColor(featureStyle, opacity, feature.properties.dataElement.value, legendSet);
    }

    return featureStyle;
  }

  private _prepareMapLegend(visualizationLayerSettings, visualizationAnalytics) {
    let legendSettings = visualizationLayerSettings;
    let dataArray = [];

    let legendsFromLegendSet = null;

    let obtainedDataLegend = null;

    if (!legendSettings.colorScale && !legendSettings.legendSet) {
      legendSettings['colorScale'] = this.colorInterpolation.getColorScaleFromHigLow(visualizationLayerSettings);
    }

    if (!legendSettings.colorScale && legendSettings.legendSet) {
      legendsFromLegendSet = this._getColorScaleFromLegendSet(legendSettings.legendSet);
      legendSettings['colorScale'] = legendsFromLegendSet.colorScale;
    }


    if (legendSettings.colorScale && legendSettings.legendSet) {
      legendsFromLegendSet = this._getColorScaleFromLegendSet(legendSettings.legendSet);
      legendSettings['colorScale'] = legendsFromLegendSet.colorScale;
    }

    if (visualizationAnalytics.hasOwnProperty('headers')) {
      visualizationAnalytics.rows.forEach((row) => {
        dataArray.push(+row[_.findIndex(visualizationAnalytics.headers, {'name': 'value'})]);
      })
      const sortedData = _(dataArray).sortBy().value();


      if (legendSettings.method == 1) {
        obtainedDataLegend = this._prepareLegendSet(visualizationLayerSettings, legendsFromLegendSet, visualizationAnalytics);
      }

      if (legendSettings.method == 2) {
        if (legendSettings.legendSet) {
          obtainedDataLegend = this._prepareLegendSet(visualizationLayerSettings, legendsFromLegendSet, visualizationAnalytics);
        } else {
          obtainedDataLegend = this._generateLegendClassLimits(visualizationLayerSettings, visualizationAnalytics);
        }

      }

      if (legendSettings.method == 3) {

        if (legendSettings.legendSet) {
          obtainedDataLegend = this._prepareLegendSet(visualizationLayerSettings, legendsFromLegendSet, visualizationAnalytics);
        } else {
          obtainedDataLegend = this._generateLegendClassLimits(visualizationLayerSettings, visualizationAnalytics);
        }
      }

    }

    return obtainedDataLegend;
  }

  private _generateLegendClassLimits(visualizationLayerSettings, visualizationAnalytics) {
    let legendSetColorArray: any = null;
    if (visualizationLayerSettings.colorScale) {
      legendSetColorArray = visualizationLayerSettings.colorScale.split(",");
    } else {
      legendSetColorArray = this.colorInterpolation.getColorScaleFromHigLow(visualizationLayerSettings);
    }


    const dataArray: any[] = [], legend: any = [];
    let classLimits = [], classRanges = [], doneWorkAround = false;

    if (visualizationAnalytics.hasOwnProperty('headers')) {
      visualizationAnalytics.rows.forEach((row) => {
        dataArray.push(+row[_.findIndex(visualizationAnalytics.headers, {'name': 'value'})]);
      })
      const sortedData = _(dataArray).sortBy().value();


      let interval = +((visualizationLayerSettings.radiusHigh - visualizationLayerSettings.radiusLow) / visualizationLayerSettings.classes).toFixed(0);
      let radiusArray = [];
      for (let classNumber = 0; classNumber < visualizationLayerSettings.classes; classNumber++) {
        if (classNumber == 0) {
          radiusArray.push(visualizationLayerSettings.radiusLow);
        } else {
          radiusArray.push(radiusArray[classNumber - 1] + interval);
        }
      }

      //Workaround for classess more than values
      if (sortedData.length < visualizationLayerSettings.classes) {
        if (sortedData.length == 0 && doneWorkAround == false) {
          sortedData.push(0);
          doneWorkAround = true;
        }
        if (sortedData.length == 1 && doneWorkAround == false) {
          sortedData.push(sortedData[0] + 1);
          doneWorkAround = true;
        }
      }

      for (let classIncr = 0; classIncr <= visualizationLayerSettings.classes; classIncr++) {
        if (visualizationLayerSettings.method == 3) { // equal counts
          let index = classIncr / visualizationLayerSettings.classes * (sortedData.length - 1);
          if (Math.floor(index) == index) {
            classLimits.push(sortedData[index]);
          } else {
            let approxIndex = Math.floor(index)
            classLimits.push(sortedData[approxIndex] + (sortedData[approxIndex + 1] - sortedData[approxIndex]) * (index - approxIndex));
          }
        } else {
          classLimits.push(Math.min.apply(Math, sortedData) + ( (Math.max.apply(Math, sortedData) - Math.min.apply(Math, sortedData)) / visualizationLayerSettings.classes ) * classIncr);
        }
      }


      if (doneWorkAround) dataArray.pop();
      //Offset Workaround
      //Populate data count into classes
      classLimits.forEach(function (classLimit, classIndex) {
        if (classIndex < classLimits.length - 1) {
          let min = classLimits[classIndex], max = classLimits[classIndex + 1];
          legend.push({
            name: "",
            label: "",
            description: "",
            relativeFrequency: "",
            min: +min.toFixed(1),
            max: +max.toFixed(1),
            color: legendSetColorArray[classIndex],
            count: 0,
            radius: radiusArray[classIndex],
            boundary: false
          });
        }
      });

    }

    this._getLegendCounts(dataArray, legend);

    return legend;
  }

  private _prepareLegendSet(visualizationLayerSettings, legendsFromLegendSet, visualizationAnalytics) {
    let legend: any = null;
    let dataArray: any[] = [];
    let interval = +((visualizationLayerSettings.radiusHigh - visualizationLayerSettings.radiusLow) / legendsFromLegendSet.sets.length).toFixed(0);
    let radiusArray = [];
    for (let classNumber = 0; classNumber < legendsFromLegendSet.sets.length; classNumber++) {
      if (classNumber == 0) {
        radiusArray.push(visualizationLayerSettings.radiusLow);
      } else {
        radiusArray.push(radiusArray[classNumber - 1] + interval);
      }
    }

    if (visualizationAnalytics.hasOwnProperty('headers')) {
      visualizationAnalytics.rows.forEach((row) => {
        dataArray.push(+row[_.findIndex(visualizationAnalytics.headers, {'name': 'value'})]);
      })
    }

    legendsFromLegendSet.sets.forEach((set, setIndex) => {
      legend.scriptLegend.push({
        min: set.min,
        max: set.max,
        count: 0,
        color: set.color,
        name: set.name,
        radius: radiusArray[setIndex]
      });
    })


    this._getLegendCounts(dataArray, legend);
    return legend;
  }

  private _getColorScaleFromLegendSet(legendSet) {
    let legends = legendSet.legends;
    let sortedLegends = [];

    let legendsValue = [];
    let sortedLegendsValue = [];


    legends.forEach((legend, legendIndex) => {
      legendsValue.push(legend.startValue);
      sortedLegendsValue.push(legend.startValue);
    });

    sortedLegendsValue.sort((n1, n2) => n1 - n2);
    let colorScale = "";
    sortedLegendsValue.forEach((sortedLegendVale, legendValueIndex) => {
      let extraction = legends[legendsValue.indexOf(sortedLegendVale)];
      extraction = JSON.stringify(extraction);
      extraction = extraction.replace('startValue', 'min');
      extraction = extraction.replace('endValue', 'max');
      extraction = eval('(' + extraction + ')');
      sortedLegends.push(extraction);
      colorScale += extraction.color + ','
    })

    return {colorScale: colorScale, sets: sortedLegends}

  }

  private _getLegendCounts(dataArray, legend) {

    dataArray.forEach(data => {
      legend.forEach((legendItem, legendIndex) => {
        if (legendItem.min <= data && data < legendItem.max) {
          legendItem.count += 1;
        }

        if (legendIndex == legend.length - 1 && legendItem.min < data && data == legendItem.max) {
          legendItem.count += 1;
        }
      })
    })
    return legend;
  }

  private _prepareMarkerClusters(L, visualizationLayerSettings: any, visualizationAnalytics: any): any {
    let markers = new L.MarkerClusterGroup({
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) => {
        let childMarkers = cluster.getAllChildMarkers();

        return this._iconCreateFunction(L, cluster, visualizationLayerSettings)
      }
    });
    if (visualizationAnalytics.hasOwnProperty('headers')) {
      const latitudeIndex = visualizationAnalytics.headers.indexOf(_.find(visualizationAnalytics.headers, ['name', 'latitude']));
      const longitudeIndex = visualizationAnalytics.headers.indexOf(_.find(visualizationAnalytics.headers, ['name', 'longitude']));
      const nameIndex = visualizationAnalytics.headers.indexOf(_.find(visualizationAnalytics.headers, ['name', 'ouname']));
      const codeIndex = visualizationAnalytics.headers.indexOf(_.find(visualizationAnalytics.headers, ['name', 'oucode']));

      if (visualizationAnalytics.rows.length > 0) {

        visualizationAnalytics.rows.forEach(row => {
          const title = "<b>Water Point: </b>" + row[nameIndex] + "<br/>" + "<b>Coordinate:</b>" + row[longitudeIndex] + "," + row[latitudeIndex] + "<br/>" + "<b>Code:</b>" + row[codeIndex];
          ;
          const latitude = row[latitudeIndex];
          const longitude = row[longitudeIndex];
          if (latitude && longitude) {
            markers.addLayer(L.marker([latitude, longitude], {
              icon: L.icon({
                iconUrl: 'assets/img/marker-icon.png',
                iconSize: [21, 31],
                iconAnchor: [10, 31],
                popupAnchor: [0, -31]
              })
            }).bindPopup(title).on({
              mouseover: (event) => {
              }
            }));
          }
        });
      }
    }

    return markers;
  }


  private _iconCreateFunction(L: any, cluster: any, layerSettings: any) {
    const children = cluster.getAllChildMarkers();
    const iconSize = this._calculateClusterSize(cluster.getChildCount());

    layerSettings.eventPointColor = "#" + layerSettings.eventPointColor;
    return L.divIcon({
      html: this._createClusterIcon(iconSize, cluster, layerSettings),
      className: 'marker-cluster ' + layerSettings.id,
      iconSize: new L.Point(iconSize[0], iconSize[1])
    });
  }

  private _createClusterIcon(iconSize, cluster, layerSettings) {
    const marginTop = this._calculateMarginTop(iconSize);
    let height = iconSize[0];
    let width = iconSize[1];
    let htmlContent = '<div style="' +
      'color:#ffffff;text-align:center;' +
      'box-shadow: 0 1px 4px rgba(0, 0, 0, 0.65);' +
      'opacity:'+layerSettings.opacity +';'+
      'background-color:' + this._eventColor(layerSettings.eventPointColor) + ';' +
      'height:'+height+'px;width:'+width+'px;' +
      'font-style:'+layerSettings.labelFontStyle +';'+
      'font-size:'+layerSettings.labelFontSize +';'+
      'border-radius:'+iconSize[0]+'px;">' +
      '<span style="line-height:'+width+'px;">'+this._writeInKNumberSystem(parseInt(cluster.getChildCount()))+'</span>' +
      '</div>';
    return htmlContent;
  }

  private _eventColor(color){
    let colorArray = color.split("#");
    return "#"+colorArray[colorArray.length-1];
  }

  private _writeInKNumberSystem(childCount: any): any {
    return childCount >= 1000 ? childCount = (childCount / 1000).toFixed(1) + "k" : childCount;
  }

  private _calculateClusterSize(childCount: number): any {
    return childCount < 10 ? [16, 16] : (childCount >= 10 && childCount <= 40) ? [20, 20] : (childCount > 40 && childCount < 100) ? [30, 30] : [40, 40];
  }

  private _calculateMarginTop(iconSize: any) {
    const size = iconSize[0];
    return size == 30 ? 5 : size == 20 ? 2 : 10;
  }

  private _getMarkerIcon(L, pointRadius, pointColor) {
    const pointSize = this._getSquareDimension(parseInt(pointRadius));

    if (!pointColor) {
      pointColor = '#3E3E3D';
    } else {
      pointColor = "#" + pointColor;
    }

    return L.divIcon({
      className: 'map-marker',
      iconSize: null,
      iconAnchor: [10, 27], // size of the icon anchor ,this is custom size
      html: '<div class="icon" style="width:' + pointSize + 'px;height:' + pointSize + 'px;background-color:' + pointColor + ';border-radius: ' + pointSize + 'px;border: 2px solid #E3E3E3;"></div>'
    });
  }

  private _getSquareDimension(radius: number): number {
    if (!radius) {
      return 0;
    }
    return +(((0.5 * (+(radius)) * 3.14159) * 1.8).toFixed(0));
  }

  private _prepareMarkersLayerGroup() {

  }

  private _prepareEarthEngineLayer() {

  }

  private _updateFillColor(featureStyle, opacity, value, legendSet) {
    legendSet.forEach((legend, legendIndex) => {

      if (legend.min <= value && value < legend.max) {
        featureStyle.fillColor = legend.color;
        featureStyle.fillOpacity = opacity;
      }

      if (legendSet.length - 1 == legendIndex && value > legend.min && value == legend.max) {
        featureStyle.fillColor = legend.color;
        featureStyle.fillOpacity = opacity;
      }

    });
    return featureStyle;
  }

}
