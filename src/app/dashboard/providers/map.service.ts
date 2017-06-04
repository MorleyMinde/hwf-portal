import {Injectable} from '@angular/core';
import {Color} from "./color";
import {VisualizationStore} from "./visualization-store";
import {AnalyticsService} from "./analytics.service";
import {VisualizerService} from "./visualizer.service";
import {Http, Response} from "@angular/http";
import {Visualization} from "../model/visualization";
import {Observable} from "rxjs";
import {MapConfiguration} from "../model/map-configuration";
import * as _ from 'lodash';
import {Constants} from "./constants";
import {HttpClientService} from "../../providers/http-client.service";

interface Legend {
  htmlLegend: Object;
  scriptLegend: Array<Object>;
}

interface LegendItem {
  layerId: string;
  name: string;
  description: string;
  pinned: boolean;
  useIcons: boolean;
  opacity: number;
  layer: string;
  classes: Array<Object>;
  change: Array<Object>;
}

interface Class {
  name: string;
  label: string;
  description: string;
  relativeFrequency: string,
  collapse: string;
  min: number;
  max: number;
  level: number;
  color: string;
  icon: "",
  radius: number;
  count: number;
  boundary: boolean;
}

interface Change {
  name: string,
  description: string,
  changeFact: string,
  icon: string,
  threshold: number,
}
@Injectable()
export class MapService {


  private colorHigh: String;
  private colorLow: String;
  private colorType: String = "Hex";
  private ends: Array<any> = [Color, Color];
  private step: Array<any> = [];
  private geoFeatures: any[] = [];
  public mapLegend: any = {scriptLegenumbernd: [], htmlLegend: ""};


  constructor(private visualizationStore: VisualizationStore,
              private analyticsService: AnalyticsService,
              private visualizationService: VisualizerService,
              private http: HttpClientService,
              private constant: Constants) {
  }

  public getColorScaleFromHigLow(colorHigh: String, colorLow: String, classes: number) {
    this._setColorBounds(colorHigh, colorLow);
    let parseLow = this._colorParse(colorLow, 'hex');
    let parseHigh = this._colorParse(colorHigh, 'hex');
    this.ends[0] = new Color(parseLow[0], parseLow[1], parseLow[2]);
    this.ends[1] = new Color(parseHigh[0], parseHigh[1], parseHigh[2]);
    this._stepCalc(classes);
    let colors = this._mixPalete(classes);

    let colorScale = "";

    colors.forEach((color, colorIndex) => {
      colorScale += color.bg
      if (colorIndex == color.length - 1) {
      } else {
        colorScale += ",";
      }

    })
    return colorScale;
  }

  public getColorScaleFromLegendSet(legendSet) {
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

  public getMapFacilityLegend(settings) {
    let legend: LegendItem = {
      layerId: "",
      name: "",
      description: "",
      pinned: false,
      useIcons: false,
      opacity: 0,
      layer: "",
      classes: [],
      change: []
    }

    let groupSet = settings.groupSet;
    let features = settings.geoFeature;
    legend.layerId = settings.id;
    legend.name = groupSet.name;
    legend.opacity = settings.opacity ? settings.opacity * 100 : 80;

    let totalFeatures: number = features.length;

    groupSet.organisationUnitGroups.forEach(group => {

      let classLegend: Class = {
        name: group.name,
        label: "",
        description: "",
        relativeFrequency: "",
        min: 0,
        max: 0,
        level: 0,
        color: "",
        collapse: "",
        icon: group.symbol,
        radius: 0,
        count: 0,
        boundary: false
      }

      features.forEach(feature => {

        let propertyNames = Object.getOwnPropertyNames(feature.dimensions);
        propertyNames.forEach(dimensionId => {
          if (feature.dimensions[dimensionId] == group.name) {
            classLegend.count += 1;
          }
        });
      })

      classLegend.relativeFrequency = (classLegend.count / totalFeatures).toFixed(0) + "%";
      legend.classes.push(classLegend);

    })

    return {
      htmlLegend: "", scriptLegend: legend,
      colorScale: [],
      getFeatureRadius: (featureValue) => {
        return null
      },
      getFeatureColor: (featureValue) => {

      }
    }

  }

  public getMapBoundaryLegend(settings) {
    let colors = ['black', "blue", "red", "red"];
    let levelArray = ['Level 1', "Level 2", "Level 3", "Level 4", "Level 5"];
    let levels = [];
    let levelCount = 0;
    let levelContainer = [];
    let legend: LegendItem = {
      layerId: "",
      name: "",
      description: "",
      pinned: false,
      useIcons: false,
      opacity: 0,
      layer: "",
      classes: [],
      change: []
    }

    let features = settings.geoFeature;
    legend.layerId = settings.id;
    legend.name = "Boundaries";
    legend.opacity = settings.opacity ? settings.opacity * 100 : 80;

    let totalFeatures: number = features.length;

    features.forEach(feature => {
      if (levelContainer.indexOf(feature.le) < 0) {
        levelContainer.push(feature.le);
      }
    })
    let sortedLevels = _.sortBy(levelContainer);
    sortedLevels.forEach((level) => {
      levels.push(levelArray[level - 1]);
    })


    levels.forEach((level, levelIndex) => {

      let classLegend: Class = {
        name: level,
        label: "",
        description: "",
        relativeFrequency: "",
        min: 0,
        max: 0,
        level: 0,
        color: colors[levelIndex],
        collapse: "",
        icon: "",
        radius: 0,
        count: 0,
        boundary: true
      }

      features.forEach(feature => {
        if (level.indexOf(feature.le) > -1) {
          classLegend.count += 1;
        }
      })

      classLegend.relativeFrequency = (classLegend.count / totalFeatures * 100).toFixed(0) + "%";


      legend.classes.push(classLegend);
    });

    return {
      htmlLegend: "", scriptLegend: legend,
      colorScale: [],
      getFeatureRadius: (featureValue) => {
        return null
      },
      getFeatureColor: (featureValue) => {

      }
    }

  }

  public getMapLegends(features, sortedData, settings) {
    let legendSettings = settings;

    let legendsFromLegendSet = null;

    let obtainedDataLegend = null;

    if (!legendSettings.colorScale && !legendSettings.legendSet) {
      legendSettings['colorScale'] = this.getColorScaleFromHigLow(legendSettings.colorHigh, legendSettings.colorLow, legendSettings.classes);
    }

    if (!legendSettings.colorScale && legendSettings.legendSet) {
      legendsFromLegendSet = this.getColorScaleFromLegendSet(legendSettings.legendSet);
      legendSettings['colorScale'] = legendsFromLegendSet.colorScale;
    }


    if (legendSettings.colorScale && legendSettings.legendSet) {
      legendsFromLegendSet = this.getColorScaleFromLegendSet(legendSettings.legendSet);
      legendSettings['colorScale'] = legendsFromLegendSet.colorScale;
    }

    if (legendSettings.method == 1) {
      obtainedDataLegend = this._legendSetLegend(sortedData, legendsFromLegendSet, settings);
    }

    if (legendSettings.method == 2) {
      if (settings.legendSet) {
        obtainedDataLegend = this._legendSetLegend(sortedData, legendsFromLegendSet, settings);
      } else {
        obtainedDataLegend = this._generateClassLimits(sortedData, legendSettings, "equalInterval");
      }

    }

    if (legendSettings.method == 3) {

      if (settings.legendSet) {
        obtainedDataLegend = this._legendSetLegend(sortedData, legendsFromLegendSet, settings);
      } else {
        obtainedDataLegend = this._generateClassLimits(sortedData, legendSettings, "equalCounts");
      }
    }

    let legend: LegendItem = this.getDataLegend(obtainedDataLegend, settings);
    return {
      htmlLegend: null, scriptLegend: legend,
      colorScale: legendSettings['colorScale'],
      getFeatureRadius: (featureValue) => {
        return this.getMapRadiusLegend(features, settings, sortedData, featureValue)
      },
      getFeatureColor: (featureValue) => {

      }
    }

  }

  public getDataLegend(obtainedDataLegend, settings): LegendItem {
    let legend =
      {
        layerId: settings.id,
        name: settings.name,
        description: settings.period,
        collapse: "",
        pinned: false,
        useIcons: true,
        opacity: settings.opacity,
        layer: settings.layer,
        classes: [],
        change: []
      }

    let legendClasses: Array<Class> = [];

    obtainedDataLegend.scriptLegend.forEach((legendItem, legendItemIndex) => {
      let legendClass: Class = {
        name: "",
        label: "",
        description: "",
        relativeFrequency: "",
        collapse: "",
        min: 0,
        max: 0,
        level: 0,
        color: "",
        icon: "",
        radius: 0,
        count: 0,
        boundary: false
      };

      legendClass.name = legendItem.min + " - " + legendItem.max;
      legendClass.label = legendItem.name;
      legendClass.color = legendItem.color;
      legendClass.min = +(legendItem.min);
      legendClass.max = +(legendItem.max);
      legendClass.radius = legendItem.radius;
      legendClass.icon = legendItem.icon;
      legendClasses.push(legendClass);
    })

    legend.classes = legendClasses;

    return legend;
  }

  public getMapRadiusLegend(features, settings, dataArray, value) {

    let eventClustering = settings.eventClustering;
    let legendSet = settings.legendSet;
    let radiusHigh = settings.radiusHigh;
    let radiusLow = settings.radiusLow;
    let classess = settings.classes;
    let method = settings.method;
    let legendType = '';
    let legendObject: Legend = null;
    let legendsFromLegendSet = null;
    let colorScaleArray = [];
    let legend = [];

    let radius = 0;

    //
    let interval = +((radiusHigh - radiusLow) / classess).toFixed(1);
    let radiusArray = [];
    for (let classNumber = 0; classNumber < classess; classNumber++) {
      if (classNumber == 0) {
        radiusArray.push(radiusLow);
      } else {
        radiusArray.push(radiusArray[classNumber - 1] + interval);
      }

    }


    var classLimits = [], classRanges = [], doneWorkAround = false;

    //Workaround for classess more than values
    if (dataArray.length < classess) {
      if (dataArray.length == 0 && doneWorkAround == false) {
        dataArray.push(0);
        doneWorkAround = true;
      }
      if (dataArray.length == 1 && doneWorkAround == false) {
        dataArray.push(dataArray[0] + 1);
        doneWorkAround = true;
      }
    }

    for (let classIncr = 0; classIncr <= classess; classIncr++) {
      if (method == "equalCounts") {
        let index = classIncr / classess * (dataArray.length - 1);
        if (Math.floor(index) == index) {
          classLimits.push(dataArray[index]);
        } else {
          let approxIndex = Math.floor(index)
          classLimits.push(dataArray[approxIndex] + (dataArray[approxIndex + 1] - dataArray[approxIndex]) * (index - approxIndex));
        }
      } else {
        classLimits.push(Math.min.apply(Math, dataArray) + ( (Math.max.apply(Math, dataArray) - Math.min.apply(Math, dataArray)) / classess ) * classIncr);
      }
    }

    if (doneWorkAround) dataArray.pop();//Offset Workaround
    //Populate data count into classess
    classLimits.forEach(function (classLimit, classIndex) {
      if (classIndex < classLimits.length - 1) {
        var min = classLimits[classIndex], max = classLimits[classIndex + 1];
        legend.push({min: min.toFixed(1), max: max.toFixed(1), radius: radiusArray[classIndex]});
      }
    });


    let theRadius = 0;
    legend.forEach(function (classRadiusLimit, classRadiusIndex) {
      if (classRadiusLimit.min <= value && value < classRadiusLimit.max) {
        theRadius = classRadiusLimit.radius;
      }

      if (classRadiusIndex == legend.length - 1 && classRadiusLimit.min < value && value == classRadiusLimit.max) {
        theRadius = classRadiusLimit.radius;
      }

    });
    return theRadius;

  }

  public getEventLegend(features, rows, settings,) {
    let legendSet = settings.legendSet;
    let radiusHigh = settings.radiusHigh;
    let radiusLow = settings.radiusLow;
    let classess = settings.classes;
    let method = settings.method;
  }

  public decideColor(dataElementScore: any, counter: any, legends: any, colorScale) {
    let colorScaleArray = Array.isArray(colorScale) ? colorScale : colorScale.split(',');
    let respectiveScoreColor: String = "rgba(255,255,255,0)";
    legends.forEach((legendItem: any, legendItemIndex) => {
      if (typeof dataElementScore == 'number') {
        if (legendItem.min <= dataElementScore && dataElementScore < legendItem.max) {
          respectiveScoreColor = colorScaleArray[legendItemIndex];
          legendItem.color = respectiveScoreColor;
          legendItem.count += 1;
        }

        if (legendItemIndex == legends.length - 1 && legendItem.min < dataElementScore && dataElementScore == legendItem.max) {
          respectiveScoreColor = colorScaleArray[legendItemIndex];
          legendItem.color = respectiveScoreColor;
          legendItem.count += 1;
        }
      }

    })
    return {respectiveScoreColor: respectiveScoreColor, updatedLegend: legends};
  }

  public sortDataArray(data) {
    let sortedData: Array<number> = [];

    data.forEach(dataValue => {
      if (dataValue.properties.dataElement.value !== "") {
        sortedData.push(dataValue.properties.dataElement.value);
      }
    })

    sortedData = sortedData.sort((n1, n2) => n1 - n2);


    return sortedData;
  }

  private _legendSetLegend(dataArray, legendsFromLegendSet, settings) {
    let legend: Legend = {htmlLegend: {}, scriptLegend: []};


    if (legendsFromLegendSet != null) {

      let interval = +((settings.radiusHigh - settings.radiusLow) / legendsFromLegendSet.sets.length).toFixed(0);
      let radiusArray = [];
      for (let classNumber = 0; classNumber < legendsFromLegendSet.sets.length; classNumber++) {
        if (classNumber == 0) {
          radiusArray.push(settings.radiusLow);
        } else {
          radiusArray.push(radiusArray[classNumber - 1] + interval);
        }
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
    } else {

    }
    legend = this._getLegendCounts(dataArray, legend);
    legend.htmlLegend = null;
    return legend;
  }


  private _generateClassLimits(dataArray: Array<any>, settings, method = "equalInterval") {

    let legend: Legend = {htmlLegend: {}, scriptLegend: []};
    var classLimits = [], classRanges = [], doneWorkAround = false;


    let interval = +((settings.radiusHigh - settings.radiusLow) / settings.classes).toFixed(0);
    let radiusArray = [];
    for (let classNumber = 0; classNumber < settings.classes; classNumber++) {
      if (classNumber == 0) {
        radiusArray.push(settings.radiusLow);
      } else {
        radiusArray.push(radiusArray[classNumber - 1] + interval);
      }
    }


    //Workaround for classess more than values
    if (dataArray.length < settings.classes) {
      if (dataArray.length == 0 && doneWorkAround == false) {
        dataArray.push(0);
        doneWorkAround = true;
      }
      if (dataArray.length == 1 && doneWorkAround == false) {
        dataArray.push(dataArray[0] + 1);
        doneWorkAround = true;
      }
    }

    for (let classIncr = 0; classIncr <= settings.classes; classIncr++) {
      if (method == "equalCounts") {
        let index = classIncr / settings.classes * (dataArray.length - 1);
        if (Math.floor(index) == index) {
          classLimits.push(dataArray[index]);
        } else {
          let approxIndex = Math.floor(index)
          classLimits.push(dataArray[approxIndex] + (dataArray[approxIndex + 1] - dataArray[approxIndex]) * (index - approxIndex));
        }
      } else {
        classLimits.push(Math.min.apply(Math, dataArray) + ( (Math.max.apply(Math, dataArray) - Math.min.apply(Math, dataArray)) / settings.classes ) * classIncr);
      }
    }

    if (doneWorkAround) dataArray.pop();//Offset Workaround
    //Populate data count into classes
    classLimits.forEach(function (classLimit, classIndex) {
      if (classIndex < classLimits.length - 1) {
        let min = classLimits[classIndex], max = classLimits[classIndex + 1];
        legend.scriptLegend.push({
          min: min.toFixed(1),
          max: max.toFixed(1),
          color: "",
          count: 0,
          radius: radiusArray[classIndex]
        });
      }
    });
    legend = this._getLegendCounts(dataArray, legend);
    return legend
  }


  private _getLegendCounts(dataArray, legend) {
    dataArray.forEach(data => {
      legend.scriptLegend.forEach((legendItem, legendIndex) => {
        if (legendItem.min <= data && data < legendItem.max) {
          legendItem.count += 1;
        }

        if (legendIndex == legend.scriptLegend.length - 1 && legendItem.min < data && data == legendItem.max) {
          legendItem.count += 1;
        }
      })
    })
    return legend;
  }

  private _mixPalete(steps: number) {
    let count = steps + 2;
    let palette: Array<any> = [];

    palette[0] = new Color(this.ends[0].red, this.ends[0].green, this.ends[0].blue);
    palette[count] = new Color(this.ends[1].red, this.ends[1].green, this.ends[1].blue);
    for (let paretteNumber = 1; paretteNumber < count; paretteNumber++) {
      let red = (this.ends[0].red + (this.step[0] * paretteNumber));
      let green = (this.ends[0].green + (this.step[1] * paretteNumber));
      let blue = (this.ends[0].blue + (this.step[2] * paretteNumber));
      palette[paretteNumber] = new Color(red, green, blue);
    }
    return palette;
  }

  private _colorParse(color, colorType) {
    let m = 1;
    let base = 16;
    let num: Array<any> = [];
    color = color.toUpperCase();
    let colorRaw = color.replace('RGB', '').replace(/[\#\(]*/i, '');
    if (colorType == 'hex') {
      if (colorRaw.length == 3) {
        let colorSectionA = colorRaw.substr(0, 1);
        let colorSectionB = colorRaw.substr(1, 1);
        let colorSectionC = colorRaw.substr(2, 1);
        colorRaw = colorSectionA + colorSectionA + colorSectionB + colorSectionB + colorSectionC + colorSectionC;
      }
      num = new Array(colorRaw.substr(0, 2), colorRaw.substr(2, 2), colorRaw.substr(4, 2));
      base = 16;
    } else {
      num = colorRaw.split(',');
      base = 10;
    }

    if (colorType == 'rgbp') {
      m = 2.55
    }
    let ret = new Array(parseInt(num[0], base) * m, parseInt(num[1], base) * m, parseInt(num[2], base) * m);
    return (ret);
  }

  private _stepCalc(steps) {
    this.step[0] = (this.ends[1].red - this.ends[0].red ) / steps;
    this.step[1] = (this.ends[1].green - this.ends[0].green ) / steps;
    this.step[2] = (this.ends[1].blue - this.ends[0].blue) / steps;
  }

  private _setColorBounds(colorHigh: String, colorLow: String) {
    this.colorHigh = colorHigh;
    this.colorLow = colorLow;
  }

  private _getGeoFeatures(geoFeatureUrl: string, canSave: boolean = true): Observable<any> {
    return Observable.create(observer => {
      if (geoFeatureUrl == null) {
        observer.next(null);
        observer.complete();
      } else {
        const geoFeature: any = canSave ? _.find(this.geoFeatures, ['url', geoFeatureUrl]) : undefined;
        if (geoFeature) {
          observer.next(geoFeature.content);
          observer.complete();
        } else {
          this.http.get(this._getGeoFeatureUrl(geoFeatureUrl))
            .subscribe(geoFeatureResponse => {
              const availableGeoFeature: any = _.find(this.geoFeatures, ['url', geoFeatureUrl]);
              if (!availableGeoFeature) {
                this.geoFeatures.push({url: geoFeatureUrl, content: geoFeatureResponse})
              }
              observer.next(geoFeatureResponse);
              observer.complete();
            }, error => {
              observer.error(error)
            })
        }
      }
    })
  }

  getGeoFeatures(visualizationObject: Visualization): Observable<any> {
    return Observable.create(observer => {
      let geoFeatureArray: any[] = [];
      let count: number = 0;
      const saveGeoFeature: boolean = visualizationObject.details.filters.length > 0 ? false : true;
      visualizationObject.layers.forEach(layer => {
        const geoFeatureParams = this._getGeoFeatureParameters(layer.settings, visualizationObject.details.filters);
        this._getGeoFeatures(geoFeatureParams, saveGeoFeature).subscribe(geoFeature => {
          if (geoFeature != null) {
            layer.settings.geoFeature = geoFeature;
          }
          count++;
          if (count == visualizationObject.layers.length) {
            observer.next(visualizationObject);
            observer.complete();
          }

        }, error => {
          observer.error(error)
        })
      });

      Observable.forkJoin(geoFeatureArray).subscribe((geoFeatures: any) => {
        let index: number = 0;
        visualizationObject.layers.forEach(layer => {
          const geoFeature: any[] = geoFeatures[0];
          if (geoFeature.length > 0) {
            layer.settings.geoFeature = geoFeature;
            index++;
          } else {
            index++;
          }
        });
        observer.next(visualizationObject);
        observer.complete();
      }, error => observer.error(error))
    })
  }

  getPredefinedLegend(visualizationObject: Visualization): Observable<any> {
    return Observable.create(observer => {
      let expectedPredefinedLegendCount: number = visualizationObject.layers.length;
      let predefinedLegendResponse: number = 0;
      visualizationObject.layers.forEach(layer => {
        let predefinedLegends = this._getPredefinedLegendUrl(layer.settings);
        if (predefinedLegends != null) {
          this._getPredefinedLegend(predefinedLegends).subscribe(predefinedLegend => {
            layer.settings.legendSet = predefinedLegend;
            predefinedLegendResponse++;
            if (predefinedLegendResponse == expectedPredefinedLegendCount) {
              observer.next(visualizationObject);
              observer.complete();
            }
          }, error => observer.error(error))
        } else {
          predefinedLegendResponse++;
          if (predefinedLegendResponse == expectedPredefinedLegendCount) {
            observer.next(visualizationObject);
            observer.complete();
          }
        }
      })
    })
  }

  getGroupSet(visualizationObject: Visualization): Observable<any> {
    return Observable.create(observer => {
      let expectedGroupSetCount: number = visualizationObject.layers.length;
      let groupSetResponse: number = 0;
      visualizationObject.layers.forEach(layer => {
        let groupSetId = layer.settings.hasOwnProperty('organisationUnitGroupSet') ? layer.settings.organisationUnitGroupSet.hasOwnProperty('id') ? layer.settings.organisationUnitGroupSet.id : null : null;
        if (groupSetId != null) {
          let groupSetUrl = this.constant.api + "organisationUnitGroupSets/" + groupSetId + ".json?fields=id,name,organisationUnitGroups[id,name,displayName,symbol]";
          this.http.get(groupSetUrl)
            .subscribe((organisationUnitGroup: any) => {
              layer.settings.groupSet = organisationUnitGroup;
              groupSetResponse++;
              if (groupSetResponse == expectedGroupSetCount) {
                observer.next(visualizationObject);
                observer.complete();
              }
            }, error => observer.error(error))
        } else {
          groupSetResponse++;
          if (groupSetResponse == expectedGroupSetCount) {
            observer.next(visualizationObject);
            observer.complete();
          }
        }


      })
    })
  }

  private _getPredefinedLegend(url): Observable<any> {
    return this.http.get(url);
  }

  public getOrganisationUnitGroupSet(url): Observable<any> {
    return this.http.get(url);
  }

  private _getGeoFeatureUrl(geoFeatureParams: string) {
    let url: string = this.constant.api + 'geoFeatures.json?';
    url += geoFeatureParams;
    url += "&displayProperty=NAME&includeGroupSets=true";
    return url;
  }

  private _getPredefinedLegendUrl(mapView): string {
    let url: string = null;
    if (mapView.legendSet) {

      let legendId: String = mapView.legendSet.id;
      url = this.constant.api + 'legendSets/' + legendId + '.json?fields=id,name,legends[id,name,startValue,endValue,color]';

    }

    return url;
  }

  private _getGeoFeatureParameters(mapView, filters): string {
    let dimensionItems: any;
    let params: string = 'ou=ou:';
    let customFilter = _.find(filters, ['name', 'ou']);
    if (!mapView.hasOwnProperty('layer') || (mapView.layer == 'boundary' || mapView.layer.indexOf('thematic') != -1 || mapView.layer == 'facility')) {
      if (customFilter) {
        params += customFilter.value + ";";
      } else {
        let columnItems = this._findDimensionItems(mapView.columns, 'ou');
        let rowItems = this._findDimensionItems(mapView.rows, 'ou');
        let filterItems = this._findDimensionItems(mapView.filters, 'ou');
        if (columnItems != null) {
          dimensionItems = columnItems;
        } else if (rowItems != null) {
          dimensionItems = rowItems;
        } else if (filterItems != null) {
          dimensionItems = filterItems;
        }

        if (dimensionItems.length > 0) {
          dimensionItems.forEach(item => {
            params += item.dimensionItem + ";";

          })
        }
      }
    }

    return params != 'ou=ou:' ? params : null;
  }

  getGeoFeatureParams(visualizationSettings, filters) {
    let dimensionItems: any;
    let params: string = 'ou=ou:';

    if (filters.length > 0) {
      params += _.find(filters, ['name', 'ou']).value;
    } else {
      let columnItems = _.find(visualizationSettings.columns, ['dimension', 'ou']);
      let rowItems = _.find(visualizationSettings.rows, ['dimension', 'ou']);
      let filterItems = _.find(visualizationSettings.filters, ['dimension', 'ou']);


      if (columnItems != undefined) {
        dimensionItems = columnItems;
      } else if (rowItems != undefined) {
        dimensionItems = rowItems;
      } else if (filterItems != undefined) {
        dimensionItems = filterItems;
      }

      if (dimensionItems.length > 0) {
        dimensionItems.forEach(item => {
          params += item.dimensionItem + ";";

        })
      }
    }

    return params != 'ou=ou:' ? params : null;
  }

  private _findDimensionItems(dimensionHolder, dimension): any {
    let items: any = null;
    if (dimensionHolder.length > 0) {
      for (let holder of dimensionHolder) {
        if (holder.dimension == dimension) {
          items = holder.items;
          break;
        }
      }
    }
    return items;
  }

  public _getMapConfiguration(favoriteObject): MapConfiguration {
    return {
      id: favoriteObject.hasOwnProperty('id') ? favoriteObject.id : null,
      name: favoriteObject.hasOwnProperty('name') ? favoriteObject.name : null,
      basemap: favoriteObject.hasOwnProperty('basemap') ? favoriteObject.basemap : 'osmlight',
      zoom: favoriteObject.hasOwnProperty('zoom') ? favoriteObject.zoom : 0,
      latitude: favoriteObject.hasOwnProperty('latitude') ? favoriteObject.latitude : 0,
      longitude: favoriteObject.hasOwnProperty('longitude') ? favoriteObject.longitude : 0
    }
  }

  private _convertToMapType(favoriteObject): Observable<any> {
    let mapLayers: any[] = [];
    return Observable.create(observer => {
      let orgUnitArray = this._getDimensionArray(favoriteObject, 'ou');
      let periodArray = this._getDimensionArray(favoriteObject, 'pe');
      let dataArray = this._getDimensionArray(favoriteObject, 'dx');

      if (dataArray.hasOwnProperty('items') && dataArray.items.length > 0) {
        dataArray.items.forEach(dataItem => {
          if (periodArray.hasOwnProperty('items') && dataArray.items.length > 0) {
            periodArray.items.forEach(periodItem => {
              let mapLayer: any = {};

              /**
               * Create data part of the new layer
               * @type {{dimension: string; items: T}}
               */
              mapLayer[dataArray.dimension] = [{
                dimension: 'dx',
                items: [dataItem]
              }];

              /**
               * Create period part of the new layer
               * @type {{dimension: string; items: T}}
               */
              mapLayer[periodArray.dimension] = [{
                dimension: 'pe',
                items: [periodItem]
              }];

              /**
               * Create orgunit part of the new layer
               * @type {{dimension: string; items: (T|any|Array|SortableItem[]|Array<any>|Highcharts.LabelItem[])}}
               */
              if (orgUnitArray.hasOwnProperty('items')) {
                mapLayer[orgUnitArray.dimension] = [{
                  dimension: 'ou',
                  items: orgUnitArray.items
                }];
              }

              mapLayers.push(mapLayer);
            })
          }
        })
      } else {
        console.warn('An error has occurred, something wrong with the favorite');
      }
      observer.next(mapLayers);
      observer.complete();
    })
  }

  private _getDimensionArray(favoriteObject, dimension) {
    let dimensionArray: any = {};
    let found: boolean = false;
    //find in the column list first
    let columnItems = this._findDimensionItems(favoriteObject.hasOwnProperty('columns') ? favoriteObject.columns : [], dimension);
    if (columnItems != null) {
      dimensionArray = {
        dimension: 'columns',
        items: columnItems
      };
      found = true;
    }

    //find in the row list if not found
    if (!found) {
      let rowItems = this._findDimensionItems(favoriteObject.hasOwnProperty('rows') ? favoriteObject.rows : [], dimension);
      if (rowItems != null) {
        dimensionArray = {
          dimension: 'rows',
          items: rowItems
        };
        found = true;
      }
    }

    //find in the filter list if still not found
    if (!found) {
      let filterItems = this._findDimensionItems(favoriteObject.hasOwnProperty('filters') ? favoriteObject.filters : [], dimension);
      if (filterItems != null) {
        dimensionArray = {
          dimension: 'filters',
          items: filterItems
        };
        found = true;
      }
    }

    return dimensionArray;

  }


}

