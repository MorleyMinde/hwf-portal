import {Injectable} from '@angular/core';
import {Http, Response} from "@angular/http";
import {Observable} from "rxjs";
import * as _ from 'lodash';
import {Visualization} from "../model/visualization";
import {Constants} from "../../providers/constants";

@Injectable()
export class AnalyticsService {

  constructor(private constant: Constants,
              private http: Http) {
  }

  public getAnalytic(visualization: Visualization): Observable<Visualization> {
    let visualizationObject: Visualization = _.clone(visualization);
    return Observable.create(observer => {
      let analyticCallAArray: any[] = [];
      visualizationObject.layers.forEach(layer => {
        if (visualizationObject.type == 'MAP') {
          if (layer.settings.layer != 'boundary' && layer.settings.layer != 'external' && layer.settings.layer != 'earthEngine' && layer.settings.layer != 'facility') {
            analyticCallAArray.push(this.http.get(this.constructUrl(layer.settings, visualizationObject.type, visualizationObject.details.filters))
              .map((res: Response) => res.json())
              .catch(error => Observable.throw(new Error(error))))
          } else {
            analyticCallAArray.push(Observable.of({}))
          }
        } else {
          analyticCallAArray.push(this.http.get(this.constructUrl(layer.settings, visualizationObject.type, visualizationObject.details.filters))
            .map((res: Response) => res.json())
            .catch(error => Observable.throw(new Error(error))))
        }
      });
      if (analyticCallAArray.length > 0) {
        Observable.forkJoin(analyticCallAArray).subscribe(analyticsObjects => {
          let layerIndex: number = 0;
          visualizationObject.layers.forEach((layer: any) => {
            layer.analytics = analyticsObjects[layerIndex];
            layerIndex++;
          });

          observer.next(visualizationObject);
          observer.complete();
        }, error => observer.error(error));
      } else {
        observer.next(visualizationObject);
        observer.complete();
      }
    });

  }

  getSplitedAnalytics(visualization): Visualization {
    let newSettings: any[] = [];
    let newAnalytics: any[] = [];
    let newLayers: any[] = [];
    let settings: any = visualization.layers[0].settings;
    visualization.layers.forEach(layer => {
      this.splitFavorite(layer.settings).forEach(settings => {
        newSettings.push(settings);
      });

      if (layer.hasOwnProperty('analytics') && layer.analytics != undefined) {
        if (visualization.type == "REPORT_TABLE" || visualization.type == "CHART") {
          this.splitReportTableAnalytics(layer.analytics).forEach(analytics => {
            newAnalytics.push(analytics)
          });

        }

        if (visualization.type == "EVENT_REPORT" || visualization.type == "EVENT_CHART") {

          this.splitEventReportAnalytics(layer.analytics).forEach(analytics => {

            newAnalytics.push(analytics)
          });
        }


      }


    });


    newSettings.forEach((settingsItem, settingsIndex) => {
      newLayers.push({settings: settingsItem, analytics: newAnalytics[settingsIndex]});
    });


    // newAnalytics.forEach((newAnalytic, newAnalyticIndex) => {
    //   newLayers.push({settings: this._sanitizeLayerSetting(settings, newAnalytic), analytics: newAnalytic});
    // });
    visualization.layers = newLayers;
    return visualization;
  }

  getMergedAnalytics(visualizationObject: Visualization) {
    let newSettings: any = this.mergeFavorite(visualizationObject.layers);
    let newAnalytics: any = this.mergeAnalytics(visualizationObject.layers);
    const newLayer = {
      settings: this.mergeFavorite(visualizationObject.layers),
      analytics: this.mergeAnalytics(visualizationObject.layers)
    };

    visualizationObject.layers = [newLayer];

    return visualizationObject;
  }

  splitFavorite(favorite) {
    let dimensionArray: any = {
      ou: {items: []},
      pe: {items: []},
      dx: {items: []}
    };

    let favoriteArray: any[] = [];

    if (favorite.hasOwnProperty('columns')) {
      if(favorite.columns.length > 0) {
        favorite.columns.forEach(column => {
          const items: any[] = column.items;
          if(items.length > 0) {
            column.items.forEach(item => {
              if(column.dimension) {
                dimensionArray[column.dimension].type = 'columns';
                dimensionArray[column.dimension].items.push(item);
              }
            });
          }
        })
      }
    }

    if (favorite.hasOwnProperty('rows')) {
      if(favorite.rows.length > 0) {
        favorite.rows.forEach(row => {
          const items: any[] = row.items;
          if(items.length > 0) {
            row.items.forEach(item => {
              if(row.dimension) {
                dimensionArray[row.dimension].type = 'rows';
                dimensionArray[row.dimension].items.push(item);
              }
            });
          }
        })
      }
    }

    if (favorite.hasOwnProperty('filters')) {
      if(favorite.filters.length > 0) {
        favorite.filters.forEach(filter => {
          const items: any[] = filter.items;
          if(items.length > 0) {
            filter.items.forEach(item => {
              if(filter.dimension) {
                dimensionArray[filter.dimension].type = 'filters';
                dimensionArray[filter.dimension].items.push(item);
              }
            });
          }
        })
      }
    }

    favorite.columns = [];
    favorite.rows = [];
    favorite.filters = [];

    /**
     * create favorite copy
     */

    if(dimensionArray.dx.items) {
      dimensionArray.dx.items.forEach(dxItem => {
        if(dimensionArray.pe.items) {
          dimensionArray.pe.items.forEach(peItem => {
            let newFavorite = favorite;
            const currentDate = new Date();
            const year: number = currentDate.getFullYear();
            const month: number = currentDate.getMonth();
            const monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const readableNames = {
              LAST_MONTH: year + ' ' + monthArray[month > 0 ? month - 1 : 11]
            };

            newFavorite.name = dxItem.displayName + " " + readableNames[peItem.id];
            newFavorite[dimensionArray.dx.type] = [{dimension: 'dx', items: dxItem}];
            newFavorite[dimensionArray.pe.type] = [{dimension: 'pe', items: peItem}];
            newFavorite[dimensionArray.ou.type] = [{dimension: 'ou', items: dimensionArray.ou.items}];
            favoriteArray.push(newFavorite);
          })
        }
      });
    }

    return favoriteArray;
  }

  mergeFavorite(layers: any[]) {
    const favoriteArray = layers.map((layer: any) => {
      return layer.settings
    });
    let columns: any[] = [];
    let rows: any[] = [];
    let filters: any[] = [];
    let newFavorite: any = {};

    if (favoriteArray.length > 0) {
      newFavorite = favoriteArray[0];
      favoriteArray.forEach((favorite: any) => {
        /**
         * Start with columns
         */
        if (favorite.columns) {
          if (favorite.columns.length > 0) {
            if (columns.length == 0) {
              columns = favorite.columns;
            } else {
              columns.forEach(column => {
                favorite.columns.forEach(favoriteColumn => {
                  if (column.dimension == favoriteColumn.dimension) {
                    if (column.items) {
                      let columnItems: any[] = column.items.length > 0 ? column.items : [];
                      if (favoriteColumn.items) {
                        const favoriteItems: any[] = favoriteColumn.items.length > 0 ? favoriteColumn.items : [];
                        if (favoriteItems.length > 0) {
                          favoriteItems.forEach(item => {
                            columnItems.push(item);
                          })
                        }
                      }
                      column.items = columnItems;
                    }
                  }
                })
              })
            }
          }
        }

        /**
         * Start with rows
         */
        if (favorite.rows) {
          if (favorite.rows.length > 0) {
            if (rows.length == 0) {
              rows = favorite.rows;
            } else {
              rows.forEach(row => {
                favorite.columns.forEach(favoriteRow => {
                  if (row.dimension == favoriteRow.dimension) {
                    if (row.items) {
                      let rowItems: any[] = row.items.length > 0 ? row.items : [];
                      if (favoriteRow.items) {
                        const favoriteItems: any[] = favoriteRow.items.length > 0 ? favoriteRow.items : [];
                        if (favoriteItems.length > 0) {
                          favoriteItems.forEach(item => {
                            rowItems.push(item);
                          })
                        }
                      }
                      row.items = rowItems;
                    }
                  }
                })
              })
            }
          }
        }

        /**
         * Start with filters
         */
        if (favorite.filters) {
          if (favorite.filters.length > 0) {
            if (filters.length == 0) {
              filters = favorite.filters;
            } else {
              filters.forEach(filter => {
                favorite.filters.forEach(favoriteFilter => {
                  if (filter.dimension == favoriteFilter.dimension) {
                    if (filter.items) {

                      let filterItems: any[] = filter.items.length > 0 ? filter.items : [];
                      if (favoriteFilter.items) {
                        const favoriteItems: any[] = favoriteFilter.items.length > 0 ? favoriteFilter.items : [];
                        if (favoriteItems.length > 0) {
                          favoriteItems.forEach(item => {
                            filterItems.push(item);
                          })
                        }
                      }
                      filter.items = filterItems;
                    }
                  }
                })
              })
            }
          }
        }
      })
    }

    newFavorite.rows = rows;
    newFavorite.columns = columns;
    newFavorite.filters = filters;
    return newFavorite;
  }

  mergeAnalytics(layers: any) {
    const analyticsArray = layers.map((layer: any) => {
      return layer.analytics
    });
    let newAnalytics: any = {};
    let newAnalyticsRows: any[] = [];

    if (analyticsArray.length > 0) {
      newAnalytics = analyticsArray[0];
      analyticsArray.forEach((analytics: any) => {
        if (analytics.rows) {
          const analyticsRows: any[] = analytics.rows.length > 0 ? analytics.rows : [];
          if (analyticsRows.length > 0) {
            analyticsRows.forEach(row => {
              newAnalyticsRows.push(row)
            })
          }
        }
      });
    }
    newAnalytics.rows = newAnalyticsRows;
    return newAnalytics;
  }

  splitReportTableAnalytics(reportTableAnalytics: any): Array<any> {
    let splitAnalytics: Array<any> = []
    const dataIdentifiers = reportTableAnalytics.metaData.dx;
    const periodIdentifiers = reportTableAnalytics.metaData.pe;
    const orgUnitIdentifiers = reportTableAnalytics.metaData.ou;
    const rows = reportTableAnalytics.rows;
    const names = reportTableAnalytics.metaData.names;
    const indexOfPeriod = _.findIndex(reportTableAnalytics.headers, ['name', 'pe']);
    const indexOfOrgUnit = _.findIndex(reportTableAnalytics.headers, ['name', 'ou']);
    const indexOfData = _.findIndex(reportTableAnalytics.headers, ['name', 'dx']);


    dataIdentifiers.forEach((dataIdentifier) => {
      periodIdentifiers.forEach((periodIdentifier) => {
        let analyticsTemplate = {
          headers: reportTableAnalytics.headers,
          metaData: {
            co: reportTableAnalytics.metaData.co,
            dx: [dataIdentifier],
            names: names,
            ou: reportTableAnalytics.metaData.ou,
            pe: []
          },
          rows: []
        }

        analyticsTemplate.metaData.names[analyticsTemplate.metaData.dx[0]] = reportTableAnalytics.metaData.names[analyticsTemplate.metaData.dx[0]];

        analyticsTemplate.metaData.pe.push(periodIdentifier);

        rows.forEach((row) => {
          if (row[indexOfData] == dataIdentifier && row[indexOfPeriod] == periodIdentifier) {
            analyticsTemplate.rows.push(row);
          }
        })

        splitAnalytics.push(analyticsTemplate);
      })
    })
    return splitAnalytics;
  }

  splitEventReportAnalytics(reportTableAnalytics: any): Array<any> {
    let splitAnalytics: Array<any> = [];
    const periodIdentifiers = reportTableAnalytics.metaData.pe;
    const rows = reportTableAnalytics.rows;
    const names = reportTableAnalytics.metaData.names;
    const dataGroups = this._getAnalyticsDataGroups(reportTableAnalytics.headers);
    let verticalDataGroups = this._getAnalyticsDataArrayGroups(reportTableAnalytics)[0];
    let horizontalDataGroups = this._getAnalyticsDataArrayGroups(reportTableAnalytics)[1];
    const indexOfPeriod = _.findIndex(reportTableAnalytics.headers, ['name', 'pe']);
    const indexOfOrgUnit = _.findIndex(reportTableAnalytics.headers, ['name', 'ou']);
    const indexOfValue = _.findIndex(reportTableAnalytics.headers, ['name', 'value']);
    let verticalIndex = _.findIndex(reportTableAnalytics.headers, ['name', dataGroups[0]]);
    let holizontalIndex = _.findIndex(reportTableAnalytics.headers, ['name', dataGroups[1]]);

    verticalDataGroups.forEach(verticalDataGroup => {
      horizontalDataGroups.forEach(horizontalDataGroup => {
        periodIdentifiers.forEach(period => {
          let analyticsTemplate = {
            headers: this._getHeaders(reportTableAnalytics.headers),
            metaData: {
              co: reportTableAnalytics.metaData.co,
              dx: [],
              names: names,
              ou: reportTableAnalytics.metaData.ou,
              pe: [period]
            },
            rows: []
          }
          dataGroups.forEach(dataGroup => {
            if (reportTableAnalytics.metaData[dataGroup].indexOf(verticalDataGroup) > -1) {
              analyticsTemplate.metaData.dx.push(dataGroup);
              analyticsTemplate.metaData.names[dataGroup] = verticalDataGroup + " " + horizontalDataGroup;
            }

            if (reportTableAnalytics.metaData[dataGroup].indexOf(horizontalDataGroups) > -1) {
              analyticsTemplate.metaData.dx.push(dataGroup);
              analyticsTemplate.metaData.names[dataGroup] = verticalDataGroup + " " + horizontalDataGroup;
            }

          })


          rows.forEach(row => {
            if (row[verticalIndex] == verticalDataGroup && row[holizontalIndex] == horizontalDataGroup && row[indexOfPeriod] == period) {
              analyticsTemplate.rows.push([analyticsTemplate.metaData.dx[0], row[indexOfOrgUnit], row[indexOfPeriod], row[indexOfValue]]);
            }
          })

          splitAnalytics.push(analyticsTemplate);
        })
      })
    })

    return splitAnalytics;
  }

  private _sanitizeLayerSetting(settings, analytics) {
    let layerName = analytics.metaData.names[analytics.metaData.dx[0]] + " " + analytics.metaData.names[analytics.metaData.pe[0]];
    settings.name = layerName;
    return settings;
  }

  private _getAnalyticsDataGroups(analyticsHeaders: any): Array<any> {
    let headers: any[] = [];
    if (analyticsHeaders) {
      analyticsHeaders.forEach(header => {
        if (
          header.name != "ou" &&
          header.name != "pe" &&
          header.name != "value") {
          headers.push(header.name);
        }
      })
    }

    return headers;
  }

  private _getAnalyticsDataArrayGroups(reportTableAnalytics): Array<any> {
    let dataGroupsArray: any[] = [];
    const dataGroups = this._getAnalyticsDataGroups(reportTableAnalytics.headers);

    dataGroups.forEach(dataGroup => {
      dataGroupsArray.push(reportTableAnalytics.metaData[dataGroup]);
    })

    return dataGroupsArray;
  }

  private _getHeaders(headers) {
    return [{
      column: "Data",
      hidden: false,
      meta: true,
      name: "dx",
      type: "java.lang.String",
      valueType: "TEXT"
    }
      ,
      headers[_.findIndex(headers, ['name', 'ou'])],
      headers[_.findIndex(headers, ['name', 'pe'])],
      headers[_.findIndex(headers, ['name', 'value'])]
    ]
  }

  constructUrl(visualizationSettings: any, visualizationType: string, filters: any): string {
    let url: string = this.constant.api + "analytics";
    const rowParameters: string = this._getDimension('rows', visualizationSettings, filters);
    const columnParameters: string = this._getDimension('columns', visualizationSettings, filters);
    const filterParameters: string = this._getDimension('filters', visualizationSettings, filters);

    let aggregationType: string = visualizationSettings.hasOwnProperty('aggregationType') ? '&aggregationType=' + visualizationSettings.aggregationType : '';
    let value: string = visualizationSettings.hasOwnProperty('value') ? '&value=' + visualizationSettings.value.id : '';

    if (visualizationType == 'EVENT_CHART') {
      url += "/events/aggregate/" + this._getProgramParameters(visualizationSettings);

    } else if (visualizationType == "EVENT_REPORT") {

      if (visualizationSettings.hasOwnProperty('dataType')) {
        if (visualizationSettings.dataType == "AGGREGATED_VALUES") {
          url += "/events/aggregate/" + this._getProgramParameters(visualizationSettings);
        } else {
          url += "/events/query/" + this._getProgramParameters(visualizationSettings);
        }
      }

    } else if (visualizationType == "EVENT_MAP") {

      url += "/events/aggregate/" + this._getProgramParameters(visualizationSettings);

    } else if (visualizationType == 'MAP' && visualizationSettings.layer == 'event') {

      url += "/events/query/" + this._getProgramParameters(visualizationSettings);

      /**
       * Also get startDate and end date if available
       */
      if (visualizationSettings.hasOwnProperty('startDate') && visualizationSettings.hasOwnProperty('endDate')) {
        url += 'startDate=' + visualizationSettings.startDate + '&' + 'endDate=' + visualizationSettings.endDate + '&';
      }

    } else {
      url += ".json?";
    }

    /**
     * Add row, column and filter parameters
     * @type {string}
     */
    url += rowParameters != "" ? rowParameters : "";
    url += columnParameters != "" ? '&' + columnParameters : "";
    url += filterParameters != "" ? '&' + filterParameters : "";
    url += value != "" || value != undefined ? value : "";
    url += aggregationType != "" ? aggregationType : "";


    url += this._getAnalyticsCallStrategies(visualizationType, null);
    return url;
  }

  _getDimensionParameters(dimensionArray: any[], filters: any[] = []): string {
    let parameterArray: any = [];
    if (dimensionArray.length > 0) {
      dimensionArray.forEach(dimensionObject => {
        let customDimension: any = _.find(filters, ['name', dimensionObject.dimension]);

        if (customDimension) {
          parameterArray.push('dimension=' + customDimension.name + ':' + customDimension.value)
        } else {
          if (dimensionObject.dimension != 'dy') {
            if (dimensionObject.hasOwnProperty('filter')) {
              parameterArray.push('dimension=' + dimensionObject.dimension + ':' + dimensionObject.filter)
            } else {
              let dimensionConnector: string = dimensionObject.items.length > 0 ? ':' : '';
              parameterArray.push('dimension=' + dimensionObject.dimension + dimensionConnector + dimensionObject.items.map(item => {
                  return item.dimensionItem
                }).join(';'));
            }
          }
        }
      })
    }

    return parameterArray.join('&');
  }

  public getAnalytics(favoriteObject: any, favoriteType: string, customFilter: any[]): Observable<any> {
    return this.http.get(this._constructAnalyticUrl(favoriteObject, favoriteType, customFilter))
      .map((res: Response) => res.json())
      .catch(error => Observable.throw(new Error(error)));
  }

  private _constructAnalyticUrl(favoriteObject: any, favoriteType: string, customFilter: any[]): string {
    let url: string = this.constant.api + "analytics";
    /**
     * Get row, column and filter parameters from object dimension
     * @type {string}
     */
    let rowParameters = this._getDimension('rows', favoriteObject, customFilter);
    let columnParameters = this._getDimension('columns', favoriteObject, customFilter);
    let filterParameters = this._getDimension('filters', favoriteObject, customFilter);

    /**
     * Get url extension based on favorite type
     */
    if (favoriteType == "EVENT_CHART") {
      url += "/events/aggregate/" + this._getProgramParameters(favoriteObject);

    } else if (favoriteType == "EVENT_REPORT") {

      if (favoriteObject.hasOwnProperty('dataType')) {
        if (favoriteObject.dataType == "AGGREGATED_VALUES") {
          url += "/events/aggregate/" + this._getProgramParameters(favoriteObject);
        } else {
          url += "/events/query/" + this._getProgramParameters(favoriteObject);
        }
      } else {
        console.warn('No dataType attribute found for event report');
      }

    } else if (favoriteType == "EVENT_MAP") {

      url += "/events/aggregate/" + this._getProgramParameters(favoriteObject);

    } else if (favoriteType == 'MAP' && favoriteObject.layer == 'event') {

      url += "/events/query/" + this._getProgramParameters(favoriteObject);

      /**
       * Also get startDate and end date if available
       */
      if (favoriteObject.hasOwnProperty('startDate') && favoriteObject.hasOwnProperty('endDate')) {
        url += 'startDate=' + favoriteObject.startDate + '&' + 'endDate=' + favoriteObject.endDate + '&';
      }

    } else {

      url += ".json?";
    }

    /**
     * Add row, column and filter parameters
     * @type {string}
     */
    url += rowParameters != "" ? rowParameters : "";
    url += columnParameters != "" ? '&' + columnParameters : "";
    url += filterParameters != "" ? '&' + filterParameters : "";


    /**
     * Get analytic strategies
     * @type {string}
     */
    url += this._getAnalyticsCallStrategies(favoriteType, favoriteObject.layer);


    return url;
  }

  private _getAnalyticsCallStrategies(visualizationType, layerType: string = null): string {
    let strategies: string = '';

    strategies += visualizationType == "EVENT_CHART" || visualizationType == "EVENT_REPORT" || visualizationType == "EVENT_MAP" ? "&outputType=EVENT" : "";

    strategies += "&displayProperty=NAME";

    strategies += layerType != null && layerType == 'event' ? "&coordinatesOnly=true" : "";

    return strategies;

  }

  private _getProgramParameters(favoriteObject: any): string {
    let params: string = "";
    if (favoriteObject.hasOwnProperty('program') && favoriteObject.hasOwnProperty('programStage')) {

      if (favoriteObject.program.hasOwnProperty('id') && favoriteObject.programStage.hasOwnProperty('id')) {
        params = favoriteObject.program.id + ".json?stage=" + favoriteObject.programStage.id + "&";
      }
    }
    return params;
  }

  private _getDimension(dimension: string, favoriteObject: any, filters: any[]): string {
    let items: string = "";
    if (favoriteObject.hasOwnProperty(dimension)) {

      favoriteObject[dimension].forEach((dimensionValue: any) => {
        items += items != "" ? '&' : "";
        if (dimensionValue.hasOwnProperty('dimension') && dimensionValue.dimension != 'dy') {
          const customDimension: any = _.find(filters, ['name', dimensionValue.dimension]);
          if (dimensionValue.hasOwnProperty('items')) {
            items += 'dimension=';
            items += dimensionValue.dimension;
            items += dimensionValue.hasOwnProperty('legendSet') ? '-' + dimensionValue.legendSet.id : "";
            items += ':';
            items += dimensionValue.hasOwnProperty('filter') ? dimensionValue.filter : "";


            if (customDimension) {
              items += customDimension.value;
            } else {
              const dimensionItems: any[] = _.clone(dimensionValue.items);
              items += dimensionItems.map(item => {
                return item.hasOwnProperty('dimensionItem') ? item.dimensionItem : ''
              }).join(';');
            }
          }
        }
      });
    }
    return items;
  }

  private _getCustomDimensionValue(customFilter, dimension): string {
    let customValue: any = _.filter(customFilter, ['name', dimension]);
    return customValue.length > 0 ? customValue[0] : null;
  }

}
