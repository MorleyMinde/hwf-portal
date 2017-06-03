import {Injectable} from '@angular/core';
import {ColorInterpolationService} from "./color-interpolation.service";
import * as _ from 'lodash';
@Injectable()
export class LegendSetService {

  constructor(private colorInterpolation: ColorInterpolationService) {
  }

  // osmLight: {
  //   name: 'openStreetMap',
  //   label: 'OSM Light',
  //   url: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
  //   maxZoom: 18,
  //   attribution: '&copy;<a href="https://carto.com/attribution">cartoDB</a>',
  //   image:'/assets/img/map-tiles/esri_osm_light.png'
  // }

  public prepareTileLayers(tileLayers) {
    let baseMapLayers: any = [];

    let layerNames = Object.getOwnPropertyNames(tileLayers);

    layerNames.forEach(layer => {
      let tileLayer: any = {
        name: tileLayers[layer].name,
        label: tileLayers[layer].label,
        aliasName: tileLayers[layer].aliasName,
        url: tileLayers[layer].url,
        image: tileLayers[layer].image,
        maxZoom: tileLayers[layer].maxZoom
      }
      baseMapLayers.push(tileLayer);
    })

    return baseMapLayers;
  }

  public prepareEventLayerLegendClasses(visualizationLayerSettings, visualizationAnalytics) {
    let legend: any[] = [];
    const eventPointColor = this._strimMoreHashFromColor(visualizationLayerSettings.eventPointColor);
    const eventPointRadius = visualizationLayerSettings.eventPointRadius;


    legend.push({
      name: this.getEventName(visualizationAnalytics)[1],
      label: this.getEventName(visualizationAnalytics)[1],
      description: "",
      relativeFrequency: "",
      min: 0,
      max: 0,
      color: eventPointColor,
      count: visualizationAnalytics.height,
      radius: eventPointRadius,
      boundary: false
    });
    return legend;
  }

  public prepareThematicLayerLegendClasses(visualizationLayerSettings, visualizationAnalytics) {
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

  public getEventName(visualizationAnalytics) {
    let metaDataObject = visualizationAnalytics.metaData;

    // TODO : Find a best way to remove this hardcoding
    let eventId: string = "";
    for (let propt in metaDataObject) {
      if (['names', 'pe', 'ou'].indexOf(propt) == -1) {
        eventId = propt;
      }

    }

    return [metaDataObject.names[eventId], metaDataObject[eventId]];
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

  private _strimMoreHashFromColor(color) {
    let colorArray = color.split("#");
    return "#" + colorArray[colorArray.length - 1];
  }

}
