import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {FavoriteService} from "./favorite.service";
import {Visualization} from "../model/visualization";
import {MapService} from "./map.service";
import {ChartService} from "./chart.service";
import {TableService} from "./table.service";
import * as _ from 'lodash';
import {AnalyticsService} from "./analytics.service";
import {error} from "util";

@Injectable()
export class VisualizationObjectService {

  constructor(
    private favoriteService: FavoriteService,
    private mapService: MapService,
    private chartService: ChartService,
    private tableService: TableService,
    private analyticsService: AnalyticsService
  ) { }

  getSanitizedVisualizationObject(initialVisualization: Visualization): Observable<any> {
    return Observable.create(observer => {
      if(initialVisualization.type == 'USERS' || initialVisualization.type == 'REPORTS' || initialVisualization.type == 'RESOURCES' || initialVisualization.type == 'MESSAGES' || initialVisualization.type == 'APP'  ) {
        observer.next(initialVisualization);
        observer.complete();
      } else {
        if(initialVisualization.details.favorite.hasOwnProperty('id')) {
          this.favoriteService.getFavoriteDetails(initialVisualization.details.favorite.type, initialVisualization.details.favorite.id, initialVisualization.layers.length > 0 ? true : false)
            .subscribe(favoriteObject => {
              this.updateVisualizationConfigurationAndSettings(initialVisualization, favoriteObject).subscribe(visualizationWithSettings => {
                this.analyticsService.getAnalytic(visualizationWithSettings).subscribe(visualizationWithAnalytics => {

                  if(visualizationWithAnalytics.details.currentVisualization == 'MAP') {
                    this.mapService.getGeoFeatures(visualizationWithAnalytics).subscribe(visualizationWithGeoFeature => {
                      this.mapService.getPredefinedLegend(visualizationWithGeoFeature).subscribe(visualizationWithLegendSet => {
                        this.mapService.getGroupSet(visualizationWithLegendSet).subscribe(visualizationWithGroupSet => {
                          observer.next(this.validateVisualization(visualizationWithGroupSet,''));
                          observer.complete();
                        })
                      })
                    })
                  } else {
                    observer.next(this.validateVisualization(visualizationWithAnalytics,''));
                    observer.complete();
                  }

                }, analyticsError => observer.error(this.validateVisualization(visualizationWithSettings,analyticsError)));
              }, visualizationWithConfigurationError => observer.error(visualizationWithConfigurationError));
            }, favoriteError => observer.error(this.validateVisualization(initialVisualization,favoriteError)))
        } else {
          //TODO use external dimension concept
        }
      }

    });
  }

  validateVisualization(visualizationObject: Visualization, errorMessage: string): Visualization {
    if(errorMessage == '') {
      visualizationObject.details.loaded = true;
      visualizationObject.details.hasError = false;
      visualizationObject.details.errorMessage = ''
    } else {
      visualizationObject.details.loaded = true;
      visualizationObject.details.hasError = true;
      visualizationObject.details.errorMessage = errorMessage;
    }
    return visualizationObject;
  }

  // getDrawableObjects(visualizationObject: Visualization): Visualization {
  //   if(visualizationObject.details.currentVisualization == 'CHART') {
  //     visualizationObject = this.chartService.getChartObjects(visualizationObject);
  //   }else if(visualizationObject.details.currentVisualization == 'MAP') {
  //
  //   } else if(visualizationObject.details.currentVisualization == 'TABLE') {
  //     visualizationObject = this.tableService.getTableObjects(visualizationObject)
  //   }
  //   return visualizationObject;
  // }

  private _getVisualizationSubtitle(filterArray: any, userOrganisationUnit) {
    let subtitleArray: any = {};
    let subtitle: string = '';

    if(filterArray.length > 0) {
      filterArray.forEach(filter => {
        subtitleArray[filter.dimension] = filter.items.map(item => {return this._getReadableSubtitleSection(item.displayName, userOrganisationUnit)})
      })
    }

    subtitle += subtitleArray.hasOwnProperty('dx') ? subtitleArray.dx.join(',') : '';
    subtitle += subtitleArray.hasOwnProperty('pe') ? subtitle != '' ? ' - ' + subtitleArray.pe.join(',') : '' + subtitleArray.pe.join(',') : '';
    subtitle += subtitleArray.hasOwnProperty('ou') ? subtitle != '' ? ' - ' + subtitleArray.ou.join(',') : '' + subtitleArray.ou.join(',') : '';

    return subtitle;
  }

  private _getReadableSubtitleSection(subtitleName, userOrganisationUnit) {
    //TODO find best way to deal with code names
    const currentDate =  new Date();
    const year: number = currentDate.getFullYear();
    const month: number = currentDate.getMonth();
    const monthArray = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const readableNames = {
      USER_ORGUNIT: userOrganisationUnit,
      LAST_MONTH:  year + ' ' + monthArray[month > 0 ? month-1 : 11]
    };

    const readableName = readableNames[subtitleName];
    return readableName ? readableName : subtitleName;
  }

  public updateVisualizationConfigurationAndSettings(initialVisualization: Visualization, favoriteObject: any): Observable<Visualization> {
    let visualizationObject = _.clone(initialVisualization);
    return Observable.create(observer => {
      /**
       * Get visualization object name if any
       */
      if(visualizationObject.layers.length == 0) {
        visualizationObject.name = favoriteObject.hasOwnProperty('displayName') ? favoriteObject.displayName : favoriteObject.hasOwnProperty('name') ? favoriteObject.name : null;
      }

      if (visualizationObject.details.currentVisualization == 'MAP') {

        if(!visualizationObject.details.hasOwnProperty('mapConfiguration')) {
          visualizationObject.details.mapConfiguration = this.mapService._getMapConfiguration(favoriteObject);
        }

        if(visualizationObject.layers.length == 0) {
          if(favoriteObject.hasOwnProperty('mapViews') && favoriteObject.mapViews.length > 0) {
            favoriteObject.mapViews.forEach((view: any) => {

              if(view.hasOwnProperty('filters') && view.filters.length > 0) {
                view.subtitle = this._getVisualizationSubtitle(view.filters,visualizationObject.details.userOrganisationUnit)
              }

              visualizationObject.layers.push({settings: view, analytics: {}})
            })
          }
        } else {
          if(visualizationObject.details.analyticsStrategy == 'split') {
            visualizationObject = this.analyticsService.getSplitedAnalytics(visualizationObject);
          }

          this.mapService.getGeoFeatures(visualizationObject).subscribe(visualizationWithGeoFeature => {
            this.mapService.getPredefinedLegend(visualizationWithGeoFeature).subscribe(visualizationWithLegendSet => {
              this.mapService.getGroupSet(visualizationWithLegendSet).subscribe(visualizationWithGroupSet => {
                observer.next(this.sanitizeMapSettings(visualizationWithGroupSet));
                observer.complete();
              }, groupSetError => observer.error(this.validateVisualization(visualizationObject,groupSetError)))
            }, legendError => observer.error(this.validateVisualization(visualizationObject,legendError)))
          }, geoFeatureError => observer.error(this.validateVisualization(visualizationObject,geoFeatureError)));
        }


      } else if (visualizationObject.details.currentVisualization == 'CHART') {

        if(visualizationObject.layers.length == 0) {
          let settings: any = favoriteObject;

          /**
           * Get chart subtitle
           */
          if(favoriteObject.hasOwnProperty('filters') && favoriteObject.filters.length > 0) {
            settings.subtitle = this._getVisualizationSubtitle(favoriteObject.filters, visualizationObject.details.userOrganisationUnit)
          }

          /**
           * get chart configuration
           * @type {ChartConfiguration}
           */
          settings.chartConfiguration = this.chartService.getChartConfiguration(favoriteObject);


          visualizationObject.layers.push({settings: settings, analytics: {}})

        } else {

          if(visualizationObject.details.analyticsStrategy == 'merge') {
            visualizationObject = this.analyticsService.getMergedAnalytics(visualizationObject);
          }

          visualizationObject.layers.forEach(layer => {
            if(!layer.settings.hasOwnProperty('chartConfiguration')) {
              layer.settings.chartConfiguration = this.chartService.getChartConfiguration(layer.settings);
            }
          })
        }

      } else if (visualizationObject.details.currentVisualization == 'TABLE') {

        if(visualizationObject.layers.length == 0) {

          let settings: any = favoriteObject;

          if(favoriteObject.hasOwnProperty('filters') && favoriteObject.filters.length > 0) {
            settings.subtitle = this._getVisualizationSubtitle(favoriteObject.filters,visualizationObject.details.userOrganisationUnit)
          }
          settings.tableConfiguration = this.tableService.getTableConfiguration(favoriteObject, visualizationObject.type, visualizationObject.details.layout);
          visualizationObject.layers.push({settings: settings, analytics: {}})

        } else {

          if(visualizationObject.details.analyticsStrategy == 'merge') {
            visualizationObject = this.analyticsService.getMergedAnalytics(visualizationObject);
          }

          visualizationObject.layers.forEach(layer => {
            if(!layer.settings.hasOwnProperty('tableConfiguration')) {
              layer.settings.tableConfiguration = this.tableService.getTableConfiguration(layer.settings, visualizationObject.type, visualizationObject.details.layout);
            }
          });

        }

      }
      observer.next(visualizationObject);
      observer.complete();
    });

  }

  sanitizeMapSettings(visualizationObject: Visualization): Visualization {
    visualizationObject.layers.forEach(layer => {
      if(!layer.settings.hasOwnProperty('labelFontColor')) {
        layer.settings.labelFontColor = '#000000';
      }

      if(!layer.settings.hasOwnProperty('layer')) {
        layer.settings.layer = 'thematic';
      }

      if(!layer.settings.hasOwnProperty('labelFontStyle')) {
        layer.settings.labelFontStyle = 'normal';
      }

      if(!layer.settings.hasOwnProperty('radiusHigh')) {
        layer.settings.radiusHigh = 15;
      }

      if(!layer.settings.hasOwnProperty('eventClustering')) {
        layer.settings.eventClustering = false;
      }

      if(!layer.settings.hasOwnProperty('colorLow')) {
        layer.settings.colorLow = 'ff0000';
      }

      if(!layer.settings.hasOwnProperty('colorHigh')) {
        layer.settings.colorHigh = '00ff00';
      }

      if(!layer.settings.hasOwnProperty('opacity')) {
        layer.settings.opacity = 0.8;
      }

      if(!layer.settings.hasOwnProperty('colorScale')) {
        layer.settings.colorScale = '#fc8d59,#ffffbf,#91cf60';
      }

      if(!layer.settings.hasOwnProperty('labelFontSize')) {
        layer.settings.labelFontSize = '11px';
      }

      if(!layer.settings.hasOwnProperty('eventPointRadius')) {
        layer.settings.eventPointRadius = 0;
      }

      if(!layer.settings.hasOwnProperty('hidden')) {
        layer.settings.hidden = false;
      }

      if(!layer.settings.hasOwnProperty('classes')) {
        layer.settings.classes = 3;
      }

      if(!layer.settings.hasOwnProperty('labelFontWeight')) {
        layer.settings.labelFontWeight = 'normal';
      }

      if(!layer.settings.hasOwnProperty('radiusLow')) {
        layer.settings.radiusLow = 5;
      }

      if(!layer.settings.hasOwnProperty('method')) {
        layer.settings.method = 2;
      }

    });

    return visualizationObject;
  }

  updateVisualizationObjectWithQueryParams(visualizationObject: Visualization, queryParams: any): Visualization {

    if(visualizationObject) {
      if(queryParams.hasOwnProperty('dashboardItems')) {

        const queryResult: any = _.find(queryParams.dashboardItems, ['dashboardItemId', visualizationObject.id]);
        const currentQueryParams: any = queryResult ? queryResult : {};
        const globalFilterParams = queryParams.filters;
        if(currentQueryParams) {
          /**
           * update current Visualization If any
           */
          if(currentQueryParams.hasOwnProperty('currentVisualization')) {
            visualizationObject.details.currentVisualization = currentQueryParams.currentVisualization.toUpperCase();
          }

          /**
           * Update filter if there is an filter params
           */
          let filterParams: any[] = _.clone(visualizationObject.details.filters);
          if(currentQueryParams.hasOwnProperty('ou')) {
            filterParams = this.updateFilterWithQueryParams(filterParams,{name: 'ou', value: currentQueryParams.ou})
          } else if(globalFilterParams.length > 0) {
            const globalOrgUnitIndex = _.findIndex(globalFilterParams, 'ou');
            if( globalOrgUnitIndex!= -1) {
              const orgUnit = globalFilterParams[globalOrgUnitIndex];
              filterParams = this.updateFilterWithQueryParams(filterParams,{name: 'ou', value: orgUnit.ou});
            }
          }

          if(currentQueryParams.hasOwnProperty('pe')) {
            filterParams = this.updateFilterWithQueryParams(filterParams,{name: 'pe', value: currentQueryParams.pe})
          } else if(globalFilterParams.length > 0) {
            const globalPeriodIndex = _.findIndex(globalFilterParams, 'pe');
            if(globalPeriodIndex != -1) {
              const period = globalFilterParams[globalPeriodIndex];
              filterParams = this.updateFilterWithQueryParams(filterParams,{name: 'pe', value: period.pe});
            }
          }

          if(currentQueryParams.hasOwnProperty('dx')) {
            filterParams = this.updateFilterWithQueryParams(filterParams,{name: 'dx', value: currentQueryParams.dx})
          } else if(globalFilterParams.length > 0) {
            const globalDataIndex = _.findIndex(globalFilterParams, 'dx');
            if(globalDataIndex != -1) {
              const data = globalFilterParams[globalDataIndex];
              filterParams = this.updateFilterWithQueryParams(filterParams,{name: 'dx', value: data.dx});
            }
          }

          visualizationObject.details.filters = filterParams;

        }
      }
    }

    return visualizationObject;
  }

  updateFilterWithQueryParams(filterParams,queryDimension: any) {
    const currentDimension: any = _.find(filterParams,['name', queryDimension.name]);
    const currentDimensionIndex: number = _.indexOf(filterParams,currentDimension);

    if(currentDimension) {
      currentDimension.value = queryDimension.value;
      filterParams[currentDimensionIndex] = currentDimension;
    } else {
      filterParams.push({name: queryDimension.name, value: queryDimension.value});
    }

    return filterParams;
  }

  updateVisualizationObjectsWithFilters(visualizationObject: Visualization, filterValues: any): Visualization {
    const filterArray = _.isPlainObject(filterValues) ? [filterValues] : filterValues;
    if(visualizationObject.details.filters.length > 0) {
      filterArray.forEach(filter => {
        const existingFilter = _.find(visualizationObject.details.filters, ['name', filter.name]);
        if(!existingFilter) {
          visualizationObject.details.filters.push(filter)
        } else {
          visualizationObject.details.filters[_.indexOf(visualizationObject.details.filters, existingFilter)] = filter;
        }
      });

    } else {
      visualizationObject.details.filters = filterArray;
    }

    return visualizationObject;
  }

}
