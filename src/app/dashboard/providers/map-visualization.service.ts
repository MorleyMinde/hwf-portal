import {Injectable} from '@angular/core';
import {Visualization} from "../model/visualization";
import {MapObject} from "../model/map-object";
import {TileLayers} from "../constants/tile-layers";
import * as _ from 'lodash';
import {Color} from "./color";
import {ColorInterpolationService} from "./color-interpolation.service";
import {Feature, GeometryObject} from "geojson";
import {LegendSetService} from "./legend-set.service";

@Injectable()
export class MapVisualizationService {


  private colorHigh: String;
  private colorLow: String;
  private colorType: String = "Hex";
  private ends: Array<any> = [Color, Color];
  private step: Array<any> = [];
  public centeringLayer: null;
  private mapObjects: any[] = [];
  private operatingLayers: any[] = [];

  private visualizationObject: any = null;

  constructor(private tileLayers: TileLayers,
              private colorInterpolation: ColorInterpolationService,
              private legendSet: LegendSetService) {
  }

  drawMap(L, visualizationObject: Visualization, prioritizeFilter?: boolean): MapObject {
    this.visualizationObject = visualizationObject;
    let mapObject: MapObject = this._getInitialMapObject(visualizationObject);
    const layers = this._getMapLayers(L, visualizationObject.layers, visualizationObject.details.mapConfiguration.basemap, mapObject.id, prioritizeFilter);
    mapObject.options.layers = layers[0];
    mapObject.operatingLayers = layers[1];
    mapObject.centeringLayer = layers[2];

    return mapObject;
  }

  private _getInitialMapObject(visualizationObject: Visualization): MapObject {
    return {
      id: visualizationObject.id,
      mapLegend: null,
      centeringLayer: null,
      operatingLayers: null,
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

  private _getMapLayers(L, visualizationLayers, basemap, mapObjectId, prioritizeFilter): any {
    let mapLayers: any[] = [];
    let mapLayersWithNames: any[] = [];
    let centeringLayer: any = null;
    /**
     * Get tile layer from basemap configuration
     */
    let baseMap = this._prepareTileLayer(L, this.tileLayers.getTileLayer(basemap));
    if (baseMap != null) {
      mapLayers.push(baseMap);
      let layerObject = {};
      layerObject[basemap] = baseMap;
      mapLayersWithNames.push(layerObject);
    }


    /**
     * Get other layers as received from visualization Object
     */
    let layersObjectList = [];
    visualizationLayers.forEach((layer, layerIndex) => {
      if (layer.settings.hasOwnProperty('layer')) {
        if (layer.settings.layer == 'boundary' || layer.settings.layer.indexOf('thematic') != -1 || layer.settings.layer == 'facility') {
          let centerLayer = this._prepareGeoJSON(L, layer.settings, layer.analytics);
          mapLayers.push(centerLayer);
          let layerObject = {};
          layerObject[layer.settings.name] = centerLayer;
          mapLayersWithNames.push(layerObject);
          /**
           * Also add centering
           * @type {L.GeoJSON}
           */
          centeringLayer = centerLayer;

        } else if (layer.settings.layer == 'event') {
          if (layer.settings.eventClustering) {
            const markerClusters: any = !prioritizeFilter ? _.find(this.mapObjects, ['id', mapObjectId]) : undefined;
            let centerLayer: any = null;
            if (markerClusters && !prioritizeFilter) {
              centerLayer = markerClusters.layer;
            } else {
              centerLayer = this._prepareMarkerClusters(L, layer.settings, layer.analytics);
              this.mapObjects.push({id: mapObjectId, layer: centerLayer});
            }

            mapLayers.push(centerLayer);

            let layerObject = {};
            layerObject[layer.settings.name] = centerLayer;
            mapLayersWithNames.push(layerObject);
          } else {
            let centerLayer = this._prepareMarkersLayerGroup();
            mapLayers.push(centerLayer);

            let layerObject = {};
            layerObject[layer.settings.name] = centerLayer;
            mapLayersWithNames.push(layerObject);
          }
        } else if (layer.settings.layer == 'external') {
          let external = this._prepareTileLayer(L, this._prepareExternalTileLayer(layer.settings.config));
          mapLayers.push(external);

          let layerObject = {};
          layerObject[layer.settings.name] = external;
          mapLayersWithNames.push(layerObject);
        } else if (layer.settings.layer == 'earthEngine') {
          let earthEngine = this._prepareEarthEngineLayer();
          mapLayers.push(earthEngine);

          let layerObject = {};
          layerObject[layer.settings.name] = earthEngine;
          mapLayersWithNames.push(layerObject);
        }

      }
    });

    return [mapLayers, mapLayersWithNames, centeringLayer];
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
    let options: any = {};
    let mapLegend = this._prepareMapLegend(visualizationLayerSettings, visualizationAnalytics);
    let LayerEvents = null;

    if (visualizationLayerSettings.layer == "boundary") {
      mapLegend = this.legendSet.boundaryLayerClasses(visualizationLayerSettings);
      options = this._prepareBoundaryLayerOptions(L, options, visualizationLayerSettings, mapLegend);
    }

    if (visualizationLayerSettings.layer.indexOf("thematic") > -1) {
      options = this._prepareThematicLayerOptions(L, options, visualizationLayerSettings,visualizationAnalytics, mapLegend);
    }

    const layer = this._getGEOJSONLayer(L, visualizationLayerSettings, visualizationAnalytics, options);

    if (visualizationLayerSettings.layer == "boundary") {
      LayerEvents = this._bindBoundaryLayerEvents(L, layer, this.visualizationObject);
    }

    if (visualizationLayerSettings.layer.indexOf("thematic") > -1) {
      LayerEvents = this._bindThematicLayerEvents(L, layer,visualizationAnalytics);
    }

    if (LayerEvents) {
      layer.on({
          click: LayerEvents.click,
          mouseover: LayerEvents.mouseover,
          mouseout: LayerEvents.mouseout
        }
      )
    }

    return layer;
  }

  private _getGEOJSONLayer(L, visualizationLayerSettings, visualizationAnalytics, options) {

    let layer: any = L.geoJSON(this._getGeoJSONObject(visualizationLayerSettings.geoFeature, visualizationAnalytics), options);

    return layer;
  }

  private _bindBoundaryLayerEvents(L, layer, visualizationObject) {

    let dataArrayByOrgUnitUid = this._prepareDataByArrayByOrgUnitUid(visualizationObject.layers);
    return {
      click: (event) => {
      }, mouseover: (event) => {
        let hoveredFeature: any = event.layer.feature;
        let data = _.find(dataArrayByOrgUnitUid, ['orgId', hoveredFeature.properties.id]);
        let toolTipContent: string = "<div style='color:#333!important;font-size: 10px'>" +
          "<table>";

        if (data) {
          toolTipContent += "<tr><td style='color:#333!important;font-weight:bold;'> " + hoveredFeature.properties.name + " </td><td style='color:#333!important;' > ( " + data.value + " ) </td></tr>";
        } else {
          toolTipContent += "<tr><td style='color:#333!important;font-weight:bold;' > " + hoveredFeature.properties.name + " </td></tr>";

        }

        toolTipContent += "</table></div>";

        layer.bindTooltip(toolTipContent, {
          direction: 'auto',
          permanent: false,
          sticky: true,
          interactive: true,
          opacity: 1
        });

        let popUp = layer.getPopup();
        if (popUp && popUp.isOpen()) {
          layer.closePopup();
        }
        layer.setStyle((feature: GeoJSON.Feature<GeoJSON.GeometryObject>) => {
          let properties: any = feature.properties;
          let featureStyle: any =
            {
              "stroke": true,
              "weight": 1
            }
          if (hoveredFeature.properties.id == properties.id) {
            featureStyle.weight = 3;
          }


          return featureStyle;
        });
      }, mouseout: (event) => {

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
  }

  private _bindThematicLayerEvents(L, layer,visualizationAnalytics) {
    let totalValues:number = 0;
    let valueIndex = _.findIndex(visualizationAnalytics.headers,["name","value"]);
    visualizationAnalytics.rows.forEach(row=>{
      totalValues+=+(row[valueIndex]);
    });

    return {
      click: (event) => {

      }, mouseover: (event) => {
        let hoveredFeature: any = event.layer.feature;
        let properties = hoveredFeature.properties;
        let toolTipContent: string = "<div style='color:#333!important;font-size: 10px'>" +
          "<table>";

        if (properties.dataElement) {
          toolTipContent += "<tr><td style='color:#333!important;font-weight:bold;'> " + properties.name + " </td><td style='color:#333!important;' > ( " + properties.dataElement.value + " ) "+((properties.dataElement.value/totalValues)*100).toFixed(0)+"% </td></tr>";
        } else {
          toolTipContent += "<tr><td style='color:#333!important;font-weight:bold;' > " + properties.name + " </td></tr>";

        }

        toolTipContent += "</table></div>";

        layer.bindTooltip(toolTipContent, {
          direction: 'auto',
          permanent: false,
          sticky: true,
          interactive: true,
          opacity: 1
        });

        let popUp = layer.getPopup();
        if (popUp && popUp.isOpen()) {
          layer.closePopup();
        }
        layer.setStyle((feature: GeoJSON.Feature<GeoJSON.GeometryObject>) => {
          let properties: any = feature.properties;
          let featureStyle: any =
            {
              "stroke": true,
              "weight": 1
            }
          if (hoveredFeature.properties.id == properties.id) {
            featureStyle.weight = 3;
          }


          return featureStyle;
        })
      }, mouseout: (event) => {

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
  }

  private _prepareDataByArrayByOrgUnitUid(layers) {
    //TODO: this function has to be checked again for further improvement
    let thematicLayers = [];
    let thematicValues = [];
    layers.forEach(layer => {
      if (layer.settings.layer.indexOf("thematic") >= 0) {
        thematicLayers.push(layer.analytics);
      }
    })

    thematicLayers.forEach(layerValues => {
      let valueIndex = _.findIndex(layerValues.headers, ['name', 'value']);
      let orgIndex = _.findIndex(layerValues.headers, ['name', 'ou']);
      let dxIndex = _.findIndex(layerValues.headers, ['name', 'dx']);
      layerValues.rows.forEach(row => {
        thematicValues.push({
          data: layerValues.metaData.names[row[dxIndex]],
          orgId: row[orgIndex],
          value: row[valueIndex]
        });
      })
    });
    return thematicValues;
  }

  private _prepareThematicLayerOptions(L, options, visualizationLayerSettings,visualizationAnalytics, mapLegend) {
    let totalValues:number = 0;
    let valueIndex = _.findIndex(visualizationAnalytics.headers,["name","value"]);
    visualizationAnalytics.rows.forEach(row=>{
      totalValues+=+(row[valueIndex]);
    });
    options.style = (feature) => {
      return this._prepareFeatureStyle(feature, visualizationLayerSettings, mapLegend);
    }

    options.onEachFeature = (feature: any, layer: any) => {
      setTimeout(() => {
        let featureName = feature.properties.name;
        let dataValue = 0;
        let dataName = "";

        let toolTipContent: string =
          "<div style='color:#333!important;font-size: 10px'>" +
          "<table>";
        toolTipContent += "<tr><td style='color:#333!important;font-weight:bold;'><b>Organisation Unit: </b></td><td style='color:#333!important;' > " + featureName + "</td>";
        if (feature.properties.dataElement) {

          toolTipContent += "<tr><td style='color:#333!important;font-weight:bold;'>Data: </td><td style='color:#333!important;' > " + feature.properties.dataElement.name + "</td>" +
            "<tr><td style='color:#333!important;font-weight:bold;'>Value: </td><td style='color:#333!important;' > " + feature.properties.dataElement.value + "  ("+((feature.properties.dataElement.value/totalValues)*100).toFixed(0)+"%)</td>";
          toolTipContent += "<tr><td style='color:#333!important;font-weight:bold;' ></td></tr>";
        }
        toolTipContent += "</tr>" +
          "</table>" +
          "</div>";

        layer.bindPopup(toolTipContent);
      }, 10);
    }

    options.pointToLayer = (feature, latlng) => {
      var geojsonMarkerOptions = {
        radius: visualizationLayerSettings.radiusLow,
        fillColor: "#ff7800",
        color: "#000",
        weight: 0.5,
        opacity: visualizationLayerSettings.opacity,
        fillOpacity: visualizationLayerSettings.opacity
      };

      let circleMarker = L.circleMarker(latlng, geojsonMarkerOptions);
      return circleMarker
    }


    return options;

  }

  private _loadMoreInformation(feature) {
  }

  private _prepareBoundaryLayerOptions(L, options, visualizationLayerSettings, mapLegend) {
    options.style = (feature) => {
      return this._prepareBoundaryFeatureStyle(feature, visualizationLayerSettings, mapLegend);
    }

    options.onEachFeature = (feature: any, layer: any) => {

    }

    options.pointToLayer = (feature, latlng) => {
      var geojsonMarkerOptions = {
        radius: visualizationLayerSettings.radiusLow,
        weight: 0.5,
        opacity: visualizationLayerSettings.opacity,
        fillOpacity: visualizationLayerSettings.opacity
      };

      let circleMarker = L.circleMarker(latlng, geojsonMarkerOptions);
      return circleMarker
    }

    return options;

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

        //TODO:: FIND BEST WAY TO DETERMINE FEATURE TYPE
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

  private _prepareBoundaryFeatureStyle(feature, visualizationLayerSettings, legendSet) {
    let opacity = visualizationLayerSettings.opacity;
    let featureStyle: any = {
      "color": _.find(legendSet, ['name', feature.le]).color,
      "fillColor": "#ffffff",
      "fillOpacity": 0,
      "weight": 1,
      "opacity": opacity,
      "stroke": true
    }


    return featureStyle;
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

            let icon = L.divIcon({
              iconSize: null,
              html: '<i class="fa fa-map-marker fa-2x" style="color:#276696"></i>'
            });
            markers.addLayer(L.marker([latitude, longitude], {
              icon: icon
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
      'opacity:' + layerSettings.opacity + ';' +
      'background-color:' + this._eventColor(layerSettings.eventPointColor) + ';' +
      'height:' + height + 'px;width:' + width + 'px;' +
      'font-style:' + layerSettings.labelFontStyle + ';' +
      'font-size:' + layerSettings.labelFontSize + ';' +
      'border-radius:' + iconSize[0] + 'px;">' +
      '<span style="line-height:' + width + 'px;">' + this._writeInKNumberSystem(parseInt(cluster.getChildCount())) + '</span>' +
      '</div>';
    return htmlContent;
  }

  private _eventColor(color) {
    let colorArray = color.split("#");
    return "#" + colorArray[colorArray.length - 1];
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
