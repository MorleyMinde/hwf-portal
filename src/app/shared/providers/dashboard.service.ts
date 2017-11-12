import {Injectable} from '@angular/core';
import {Http, Response, Headers, RequestOptions} from '@angular/http';
import {Observable, Subject} from "rxjs"
import {isObject} from "rxjs/util/isObject";
import {isArray} from "rxjs/util/isArray";
import {Constants} from "./constants";
import {Utilities} from "./utilities";

declare var $: any;

export interface Dashboard {
  id: string;
  name: string;
  dashboardItems: Array<any>
}

@Injectable()
export class DashboardService {
  dashboards: Dashboard[];
  url: string;

  constructor(private http: Http,
              private constant: Constants,
              private utility: Utilities) {
    this.url = this.constant.api + 'dashboards';
    this.dashboards = [];
  }

  all(): Observable<Dashboard[]> {
    return Observable.create(observer => {
      if (this.dashboards.length > 0) {
        observer.next(this.dashboards);
        observer.complete();
      } else {
        this.http.get(this.url + '.json?paging=false&fields=id,name,dashboardItems[:all,users[:all],resources[:all],reports[:all]]')
          .map((res: Response) => res.json())
          .catch(this.utility.handleError)
          .subscribe(response => {
            response.dashboards.forEach(dashboard => {
              if (this.utility.isUndefined(this.dashboards.filter((item) => {
                  return item.id == dashboard.id ? item : null;
                })[0])) {
                this.dashboards.push(dashboard)
              }
            });
            observer.next(this.dashboards);
            observer.complete()
          }, error => {
            observer.next(error);
          })
      }
    });
  }

  getDashboardItemWithObjectAndAnalytics(dashboardId, dashboardItemId, customDimensions) {
    return Observable.create(observer => {
      for (let dashboard of this.dashboards) {
        if (dashboard.id == dashboardId) {
          for (let dashboardItem of dashboard.dashboardItems) {
            if (dashboardItem.id == dashboardItemId) {
              if (dashboardItem.hasOwnProperty('object')) {
                if (customDimensions.length > 0) {
                  customDimensions.forEach((dimension) => {
                    if (dimension.name == 'ou') {
                      dashboardItem.object.custom_ou = dimension.value;
                    }

                    if (dimension.name == 'pe') {
                      dashboardItem.object.custom_pe = dimension.value;
                    }
                  });
                  this.http.get(this._getDashBoardItemAnalyticsUrl(dashboardItem.object, dashboardItem.type, true)).map(res => res.json())
                    .catch(this.utility.handleError)
                    .subscribe(analyticObject => {
                      dashboardItem['analytic'] = analyticObject;
                      observer.next(dashboardItem);
                      observer.complete();
                    }, analyticError => observer.error(analyticError));
                } else {
                  observer.next(dashboardItem);
                  observer.complete();
                }
              } else {
                this.http.get(this.constant.api + this.utility.formatEnumString(dashboardItem.type) + "s/" + dashboardItem[this.utility.formatEnumString(dashboardItem.type)].id + ".json?fields=*,dataElementDimensions[dataElement[id,optionSet[id,options[id,name]]]],displayDescription,program[id,name],programStage[id,name],interpretations[*,user[id,displayName],likedBy[id,displayName],comments[lastUpdated,text,user[id,displayName]]],columns[dimension,filter,legendSet,items[id,dimensionItem,dimensionItemType,displayName]],rows[dimension,filter,legendSet,items[id,dimensionItem,dimensionItemType,displayName]],filters[dimension,filter,legendSet,items[id,dimensionItem,dimensionItemType,displayName]],access,userGroupAccesses,publicAccess,displayDescription,user[displayName,dataViewOrganisationUnits],!href,!rewindRelativePeriods,!userOrganisationUnit,!userOrganisationUnitChildren,!userOrganisationUnitGrandChildren,!externalAccess,!relativePeriods,!columnDimensions,!rowDimensions,!filterDimensions,!organisationUnitGroups,!itemOrganisationUnitGroups,!indicators,!dataElements,!dataElementOperands,!dataElementGroups,!dataSets,!periods,!organisationUnitLevels,!organisationUnits")
                  .map(res => res.json())
                  .catch(this.utility.handleError)
                  .subscribe(dashboardObject => {
                    //get orgUnitModel also
                    //dashboardObject['orgUnitModel'] = this.getOrgUnitModel(dashboardObject);
                    //dashboardObject['periodModel'] = this.getPeriodModel(dashboardObject);
                    //dashboardObject['layout'] = this.getLayout(dashboardObject);
                    dashboardItem['object'] = dashboardObject;
                    //get analytic object also
                    this.http.get(this._getDashBoardItemAnalyticsUrl(dashboardObject, dashboardItem.type, null))
                      .map(res => res.json())
                      .catch(this.utility.handleError)
                      .subscribe(analyticObject => {
                        dashboardItem['analytic'] = analyticObject;
                        observer.next(dashboardItem);
                        observer.complete();
                      }, analyticError => observer.error(analyticError));
                  }, error => {
                    observer.error(error)
                  })
              }
              break;
            }
          }
          break;
        }
      }
    })
  }

  _formatAnalyticsObjectFromEventTables(analyticsObject: any): any {
    let return_object = {};

  }

  find(id: string): Observable<Dashboard> {
    return Observable.create(observer => {
      let dashboard = this.dashboards.filter((item) => {
        return item.id == id ? item : null;
      })[0];
      if (this.utility.isUndefined(dashboard)) {
        this.load(id).subscribe(dashboard => {
          observer.next(dashboard);
          observer.complete();
        }, error => {
          observer.error(error)
        })
      } else {
        observer.next(dashboard);
        observer.complete()
      }
    })
  }

  load(id: string): Observable<any> {
    return Observable.create(observer => {
      this.http.get(this.url + '/' + id + '.json?fields=id,name,dashboardItems[:all,users[:all],resources[:all],reports[:all]]')
        .map((res: Response) => res.json())
        .catch(this.utility.handleError)
        .subscribe(dashboard => {
          if (this.utility.isUndefined(this.dashboards.filter((item) => {
              return item.id == id ? item : null;
            })[0])) {
            this.dashboards.push(dashboard);
          }
          observer.next(dashboard);
          observer.complete();
        }, error => {
          observer.error(error)
        })
    })
  }

  create(dashboardData: Dashboard): Observable<string> {
    return Observable.create(observer => {
      this.utility.getUniqueId()
        .subscribe(uniqueId => {
          dashboardData.id = uniqueId;
          this.http.post(this.url, dashboardData)
            .map(res => res.json())
            .catch(this.utility.handleError)
            .subscribe(
              response => {
                this.load(uniqueId).subscribe(dashboard => {
                  //sort dashboard
                  this.dashboards.sort((a: any, b: any) => {
                    if (a.name < b.name) {
                      return -1;
                    } else if (a.name > b.name) {
                      return 1;
                    } else {
                      return 0;
                    }
                  });
                  observer.next(dashboard);
                  observer.complete();
                }, error => observer.error(error))
              },
              error => {
                observer.error(error);
              });
        })
    })
  }

  updateDashboardName(dashboardName: string, dashboardId): Observable<any> {
    for (let dashboard of this.dashboards) {
      if (dashboard.id == dashboardId) {
        dashboard.name = dashboardName;
        break;
      }
    }
    return this.http.put(this.url + '/' + dashboardId, {name: dashboardName})
      .catch(this.utility.handleError)
  }

  delete(id: string): Observable<any> {

    for (let dashboard of this.dashboards) {
      if (dashboard.id == id) {
        this.dashboards.splice(this.dashboards.indexOf(dashboard), 1);
        break;
      }
    }
    return this.http.delete(this.url + '/' + id)
      .map((res: Response) => res.json())
      .catch(this.utility.handleError)
  }

  removeDashboardItem(dashboardItemId, dashboardId) {
    this.find(dashboardId).subscribe(dashboard => {
      dashboard.dashboardItems.splice(dashboard.dashboardItems.indexOf({id: dashboardItemId}), 1)
    })
  }

  private _getDashBoardItemAnalyticsUrl(dashBoardObject, dashboardType, useCustomDimension = false): string {
    let url: string = this.constant.api;
    if (dashboardType == 'MAP' && dashBoardObject.layer == 'boundary') {
      url += 'geoFeatures';
    } else {
      url += "analytics";
    }

    let column = "";
    let row = "";
    let filter = "";
    //checking for columns
    column = this.getDashboardObjectDimension('columns', dashBoardObject, useCustomDimension);
    row = this.getDashboardObjectDimension('rows', dashBoardObject, useCustomDimension);
    filter = this.getDashboardObjectDimension('filters', dashBoardObject, useCustomDimension);

    //set url base on type
    if (dashboardType == "EVENT_CHART") {
      url += "/events/aggregate/" + dashBoardObject.program.id + ".json?stage=" + dashBoardObject.programStage.id + "&";
    } else if (dashboardType == "EVENT_REPORT") {
      if (dashBoardObject.dataType == "AGGREGATED_VALUES") {
        url += "/events/aggregate/" + dashBoardObject.program.id + ".json?stage=" + dashBoardObject.programStage.id + "&";
      } else {
        url += "/events/query/" + dashBoardObject.program.id + ".json?stage=" + dashBoardObject.programStage.id + "&pageSize=50&";
      }

    }else if ( dashboardType=="EVENT_MAP") {
      url +="/events/aggregate/"+dashBoardObject.program.id+".json?stage="  +dashBoardObject.programStage.id+"&";
    }else if(dashboardType='MAP' && dashBoardObject.layer == 'event') {
      url += "/events/query/"+dashBoardObject.program.id+".json?stage="  +dashBoardObject.programStage.id+"&";
      //@todo consider start and end date
      // url += 'startDate=' + dashBoardObject.startDate + '&' + 'endDate=' + dashBoardObject.endDate + '&';
      if(dashBoardObject.hasOwnProperty('startDate') && dashBoardObject.hasOwnProperty('endDate')) {
        url += 'startDate=' + dashBoardObject.startDate + '&' + 'endDate=' + dashBoardObject.endDate + '&';
      }

    } else {
      url += ".json?";
    }

    //@todo find best way to structure geoFeatures
    if (dashBoardObject.layer == 'boundary') {
      url += this.getGeoFeatureParameters(dashBoardObject);
    } else {
      url += column + '&' + row;
      url += filter == "" ? "" : '&' + filter;
    }
    // url += "&user=" + currentUserId;

    url += "&displayProperty=NAME" + dashboardType == "EVENT_CHART" ?
      "&outputType=EVENT&"
      : dashboardType == "EVENT_REPORT" ?
        "&outputType=EVENT&displayProperty=NAME"
        : dashboardType == "EVENT_MAP" ?
          "&outputType=EVENT&displayProperty=NAME"
          : "&displayProperty=NAME";
    if (dashBoardObject.layer == 'event') {
      url += "&coordinatesOnly=true";
    }
    return url;
  }

  private _getGeoFeatureUrl(mapView) {
    let url: string = this.constant.api + 'geoFeatures.json?';
    url += this.getGeoFeatureParameters(mapView);
    url += "&displayProperty=NAME";
    return url;
  }

  private _getDashBoardItemMapAnalyticsUrl(dashBoardObject, dashboardType, useCustomDimension = false): Array<string> {
    let url: string = this.constant.api;
    let geoUrl: string = this.constant.api;
    let urlArray: Array<string> = [];

    if (dashBoardObject.layer == 'boundary') {
      geoUrl += 'geoFeatures.json?';
    } else {
      geoUrl += 'geoFeatures.json?';
      url += "analytics";
    }

    let column = "";
    let row = "";
    let filter = "";
    //checking for columns
    column = this.getDashboardObjectDimension('columns', dashBoardObject, useCustomDimension);
    row = this.getDashboardObjectDimension('rows', dashBoardObject, useCustomDimension);
    filter = this.getDashboardObjectDimension('filters', dashBoardObject, useCustomDimension);

    //set url base on type
    if (dashboardType == "EVENT_CHART") {
      url += "/events/aggregate/" + dashBoardObject.program.id + ".json?stage=" + dashBoardObject.programStage.id + "&";
    } else if (dashboardType == "EVENT_REPORT") {
      if (dashBoardObject.dataType == "AGGREGATED_VALUES") {
        url += "/events/aggregate/" + dashBoardObject.program.id + ".json?stage=" + dashBoardObject.programStage.id + "&";
      } else {
        url += "/events/query/" + dashBoardObject.program.id + ".json?stage=" + dashBoardObject.programStage.id + "&";
      }

    } else if (dashboardType == "EVENT_MAP") {
      url += "/events/aggregate/" + dashBoardObject.program.id + ".json?stage=" + dashBoardObject.programStage.id + "&";
    } else {
      url += ".json?";
    }

    //@todo find best way to structure geoFeatures
    if (dashBoardObject.layer == 'boundary') {
      geoUrl += this.getGeoFeatureParameters(dashBoardObject);
    } else {
      geoUrl += this.getGeoFeatureParameters(dashBoardObject);
      url += column + '&' + row;
      url += filter == "" ? "" : '&' + filter;
    }
    // url += "&user=" + currentUserId;

    url += "&displayProperty=NAME" + dashboardType == "EVENT_CHART" ?
      "&outputType=EVENT&"
      : dashboardType == "EVENT_REPORT" ?
        "&outputType=EVENT&displayProperty=NAME"
        : dashboardType == "EVENT_MAP" ?
          "&outputType=EVENT&displayProperty=NAME"
          : "&displayProperty=NAME";

    if (dashBoardObject.layer == 'boundary') {
      urlArray.push(geoUrl);
    } else {
      urlArray.push(geoUrl);
      urlArray.push(url);
    }
    return urlArray;
  }

  getDashboardObjectDimension(dimension, dashboardObject, custom = false): string {
    let items: string = "";
    if(dashboardObject.hasOwnProperty(dimension)) {
      dashboardObject[dimension].forEach((dimensionValue: any) => {
        items += items != "" ? '&' : "";
        if (dimensionValue.dimension != 'dy') {
          items += dimension == 'filters' ? 'filter=' : 'dimension=';
          items += dimensionValue.dimension;
          items += dimensionValue.hasOwnProperty('legendSet') ? '-' + dimensionValue.legendSet.id : "";
          items += ':';
          items += dimensionValue.hasOwnProperty('filter') ? dimensionValue.filter : "";
          if (custom && dashboardObject.hasOwnProperty('custom_' + dimensionValue.dimension)) {
            items += dashboardObject['custom_' + dimensionValue.dimension] + ';';
          } else {
            dimensionValue.items.forEach((itemValue, itemIndex) => {
              items += itemValue.dimensionItem;
              items += itemIndex == dimensionValue.items.length - 1 ? "" : ";";
            })
          }
        }
      });
    } else {
      console.log('Dimension not found')
    }

    return items
  }

  getOrgUnitModel(dashboardObject): any {
    let orgUnitModel: any = {
      selection_mode: "orgUnit",
      selected_level: "",
      selected_group: "",
      orgunit_levels: [],
      orgunit_groups: [],
      selected_orgunits: [],
      user_orgunits: []
    };
    let dimensionItems: any;
    for (let columnDimension of dashboardObject.columns) {
      if (columnDimension.dimension == 'ou') {
        dimensionItems = columnDimension.items;
        break;
      } else {
        for (let rowDimension of dashboardObject.rows) {
          if (rowDimension.dimension == 'ou') {
            dimensionItems = rowDimension.items;
            break;
          } else {
            for (let filterDimension of dashboardObject.filters) {
              if (filterDimension.dimension == 'ou') {
                dimensionItems = filterDimension.items;
                break;
              }
            }
          }
        }
      }
    }

    dimensionItems.forEach(item => {
      if (item.hasOwnProperty('dimensionItemType')) {
        orgUnitModel.selected_orgunits.push({id: item.id, name: item.displayName})
      } else {
        //find selected organisation group
        if (item.dimensionItem.substring(0, 8) == 'OU_GROUP') {
          orgUnitModel.selected_group = item.dimensionItem;
        }

        //find selected level
        if (item.dimensionItem.substring(0, 5) == 'LEVEL') {
          orgUnitModel.selected_level = item.dimensionItem;
        }
      }
    });

    //get user orgunits
    // if(dashboardObject.user.dataViewOrganisationUnits.length > 0) {
    //   console.log(dashboardObject.user.dataViewOrganisationUnits.length)
    //   dashboardObject.user.dataViewOrganisationUnits.forEach(orgUnit => {
    //     orgUnitModel.user_orgunits.push(orgUnit.id);
    //   });
    // }

    return orgUnitModel
  }

  getPeriodModel(dashboardObject): any {
    let periodModel = [];
    let dimensionItems: any;
    for (let columnDimension of dashboardObject.columns) {
      if (columnDimension.dimension == 'pe') {
        dimensionItems = columnDimension.items;
        break;
      } else {
        for (let rowDimension of dashboardObject.rows) {
          if (rowDimension.dimension == 'pe') {
            dimensionItems = rowDimension.items;
            break;
          } else {
            for (let filterDimension of dashboardObject.filters) {
              if (filterDimension.dimension == 'pe') {
                dimensionItems = filterDimension.items;
                break;
              }
            }
          }
        }
      }
    }

    dimensionItems.forEach(item => {
      periodModel.push({id: item.id, name: item.displayName, selected: true})
    });
    return periodModel;
  }

  getLayout(dashboardObject) {
    let layout = {};
    if (dashboardObject.hasOwnProperty('series')) {
      layout = {

        series: dashboardObject.series,
        category: dashboardObject.category,
      }
    }

    let rows = [];
    dashboardObject.rows.forEach(row => {
      rows.push(row.dimension);
    });
    let columns = [];
    dashboardObject.columns.forEach(column => {
      columns.push(column.dimension)
    });
    let filters = [];
    dashboardObject.filters.forEach(filter => {
      filters.push(filter.dimension)
    });

    layout['rows'] = rows;
    layout['columns'] = columns;
    layout['filters'] = filters;

    return layout;
  }

  getDashboardItemMetadataIdentifiers(dashboardObject: any): string {
    let items = "";
    dashboardObject.rows.forEach((dashBoardObjectRow: any) => {
      if (dashBoardObjectRow.dimension === "dx") {
        dashBoardObjectRow.items.forEach((dashBoardObjectRowItem: any) => {
          items += dashBoardObjectRowItem.id + ";"
        });
      } else {
        //find identifiers in the column if not in row
        dashboardObject.columns.forEach((dashBoardObjectColumn: any) => {
          if (dashBoardObjectColumn.dimension === "dx") {
            dashBoardObjectColumn.items.forEach((dashBoardObjectColumnItem: any) => {
              items += dashBoardObjectColumnItem.id + ";"
            });
          }
        });
      }
    });
    return items.slice(0, -1);
  }

  updateShape(dashboardId, dashboardItemId, shape): void {
    //update dashboard item pool
    this.find(dashboardId).subscribe(
      dashboard => {
        for (let dashboardItem of dashboard.dashboardItems) {
          if (dashboardItem.id == dashboardItemId) {
            dashboardItem.shape = shape;
            break;
          }
        }
      });
    //update permanently to the source
    //@todo find best way to show success for no body request
    this.http.put(this.constant.root_url + 'api/dashboardItems/' + dashboardItemId + '/shape/' + shape, '').map(res => res.json()).subscribe(response => {
    }, error => {
      console.log(error)
    })
  }

  addDashboardItem(dashboardId, dashboardItemData): Observable<string> {
    return Observable.create(observer => {
      let updatableDashboardId = this.getUpdatableDashboardItem(dashboardId, dashboardItemData);
      let existingDashboardId = this.dashboardItemExist(dashboardId, dashboardItemData.id);
      if (this.utility.isNull(existingDashboardId) && this.utility.isNull(updatableDashboardId)) {
        let options = new RequestOptions({headers: new Headers({'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'})});
        this.http.post(this.url + '/' + dashboardId + '/items/content?type=' + dashboardItemData.type + '&id=' + dashboardItemData.id, options)
          .map(res => res.json())
          .catch(this.utility.handleError)
          .subscribe(response => {
              //get and update the created item
              this.http.get(this.url + '/' + dashboardId + '.json?fields=id,name,dashboardItems[:all,users[:all],resources[:all],reports[:all]]')
                .map((res: Response) => res.json())
                .catch(this.utility.handleError).subscribe(dashboard => {
                for (let dashboardItem of dashboard.dashboardItems) {
                  if (!dashboardItem.hasOwnProperty('shape')) {
                    dashboardItem.shape = 'NORMAL';
                    this.updateShape(dashboardId, dashboardItem.id, 'NORMAL');
                  }
                  if (dashboardItem.type == 'APP') {
                    this.updateDashboard(dashboardId, dashboardItem);
                    observer.next({status: 'created', id: dashboardItem.id});
                    observer.complete();
                    break;
                  } else {
                    if (dashboardItem[this.utility.camelCaseName(dashboardItem.type)].hasOwnProperty('id')) {
                      if (dashboardItem[this.utility.camelCaseName(dashboardItem.type)].id == dashboardItemData.id) {
                        this.updateDashboard(dashboardId, dashboardItem);
                        observer.next({status: 'created', id: dashboardItem.id});
                        observer.complete();
                        break;
                      }
                    } else {
                      this.updateDashboard(dashboardId, dashboardItem);
                      observer.next({status: 'created', id: dashboardItem.id});
                      observer.complete();
                      break;
                    }
                  }
                }
              }, error => {
                observer.error(error)
              });
            },
            error => {
              observer.error(error)
            })
      } else if (!this.utility.isNull(updatableDashboardId)) {
        let options = new RequestOptions({headers: new Headers({'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'})});
        this.http.post(this.url + '/' + dashboardId + '/items/content?type=' + dashboardItemData.type + '&id=' + dashboardItemData.id, options)
          .map(res => res.json())
          .catch(this.utility.handleError)
          .subscribe(response => {
            //get and update the created item
            this.http.get(this.url + '/' + dashboardId + '.json?fields=id,name,dashboardItems[:all,users[:all],resources[:all],reports[:all]]')
              .map((res: Response) => res.json())
              .catch(this.utility.handleError).subscribe(dashboard => {
              for (let dashboardItem of dashboard.dashboardItems) {
                if (!dashboardItem.hasOwnProperty('shape')) {
                  dashboardItem.shape = 'NORMAL';
                  this.updateShape(dashboardId, dashboardItem.id, 'NORMAL');
                }
                if (dashboardItem.id == updatableDashboardId) {
                  this.updateDashboard(dashboardId, dashboardItem, 'update');
                  observer.next({status: 'updated', id: dashboardItem.id});
                  observer.complete();
                  break;
                }
              }

            }, error => observer.error(error));

          }, error => {
            observer.error(error)
          })
      } else if (!this.utility.isNull(existingDashboardId) && this.utility.isNull(updatableDashboardId)) {
        this.updateDashboard(dashboardId, null, 'exist', existingDashboardId);
        observer.next({status: 'Already exist', id: existingDashboardId});
        observer.complete();
      }
    });
  }

  updateDashboard(dashboardId, dashboardItem, action = 'save', dashboardItemId?) {
    for (let dashboard of this.dashboards) {
      if (dashboard.id == dashboardId) {
        if (action == 'save') {
          dashboard.dashboardItems.unshift(dashboardItem);
        } else if (action == 'update') {
          for (let item of dashboard.dashboardItems) {
            if (item.id == dashboardItem.id) {
              dashboard.dashboardItems.splice(dashboard.dashboardItems.indexOf(item), 1);
              dashboard.dashboardItems.unshift(dashboardItem);
              break;
            }
          }
        } else {
          for (let item of dashboard.dashboardItems) {
            if (item.id == dashboardItemId) {
              let itemBuffer: any = item;
              dashboard.dashboardItems.splice(dashboard.dashboardItems.indexOf(item), 1);
              dashboard.dashboardItems.unshift(itemBuffer);
              break;
            }
          }
        }
        break;
      }
    }
  }

  getUpdatableDashboardItem(dashboardId, dashboardFavourate) {
    let dashboardItemId = null;
    if (dashboardFavourate.type != 'APP') {
      for (let dashboard of this.dashboards) {
        if (dashboard.id == dashboardId) {
          if (dashboard.dashboardItems.length > 0) {
            for (let dashboardItem of dashboard.dashboardItems) {
              if (dashboardItem.type == dashboardFavourate.type) {
                if (!this.utility.isUndefined(dashboardItem[this.utility.camelCaseName(dashboardFavourate.type)])) {
                  if (!dashboardItem[this.utility.camelCaseName(dashboardFavourate.type)].hasOwnProperty('id')) {
                    dashboardItemId = dashboardItem.id;
                  }
                }
                break;
              }
            }
          }
          break;
        }
      }
    }
    return dashboardItemId;
  }

  dashboardItemExist(dashboardId, dashboardFavourateId) {
    let itemId = null;
    for (let dashboard of this.dashboards) {
      if (dashboard.id == dashboardId) {
        if (dashboard.dashboardItems.length > 0) {
          for (let dashboardItem of dashboard.dashboardItems) {
            if (!this.utility.isUndefined(dashboardItem[this.utility.camelCaseName(dashboardItem.type)])) {
              if (dashboardItem[this.utility.camelCaseName(dashboardItem.type)].hasOwnProperty('id')) {
                if (dashboardItem[this.utility.camelCaseName(dashboardItem.type)].id == dashboardFavourateId) {
                  itemId = dashboardItem.id;
                  break;
                }
              }
            } else {
              //for APP type
              if (dashboardItem.appKey == dashboardFavourateId) {
                itemId = dashboardItem.id;
                break;
              }
            }
          }
        }
        break;
      }
    }
    return itemId;
  }

  deleteDashboardItem(dashboardId, dashboardItemId) {
    //Delete from the pool first
    this.find(dashboardId).subscribe(dashboard => {
      for (let dashboardItem of dashboard.dashboardItems) {
        if (dashboardItem.id == dashboardItemId) {
          dashboard.dashboardItems.splice(dashboard.dashboardItems.indexOf(dashboardItem), 1)
        }
      }
    });
    return this.http.delete(this.url + '/' + dashboardId + '/items/' + dashboardItemId)
      .map((res: Response) => res.json())
  }

  loadDashboardSharingData(dashboardId): Observable<any> {
    return Observable.create(observer => {
      for (let dashboard of this.dashboards) {
        if (dashboard.id == dashboardId) {
          if (dashboard.hasOwnProperty('sharing')) {
            observer.next(dashboard['sharing']);
            observer.complete()
          } else {
            this.http.get(this.constant.api + 'sharing?type=dashboard&id=' + dashboardId)
              .map(res => res.json())
              .catch(this.utility.handleError)
              .subscribe(sharing => {
                //persist sharing locally
                dashboard['sharing'] = sharing;
                observer.next(sharing);
                observer.complete()
              }, error => observer.error(error));
          }
          break;
        }
      }
    });
  }

  saveSharingData(sharingData, dashboardId): Observable<any> {
    //update to the pull first
    this.dashboards.forEach(dashboard => {
      if (dashboard.id == dashboardId) {
        dashboard['sharing'] = sharingData;
      }
    });

    //update to the server
    return this.http.post(this.constant.api + 'sharing?type=dashboard&id=' + dashboardId, sharingData)
      .map(res => res.json())
      .catch(this.utility.handleError);
  }

  getGeoFeatureParameters(dashboardObject): string {
    let dimensionItems: any;
    let params: string = 'ou=ou:';
    let columnItems = this.findDimensionItems(dashboardObject.columns, 'ou');
    let rowItems = this.findDimensionItems(dashboardObject.rows, 'ou');
    let filterItems = this.findDimensionItems(dashboardObject.filters, 'ou');
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
    return params;
  }


  findDimensionItems(dimensionHolder, dimension): any {
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

  getDimensionArray(dashboardObject, dimension) {
    let dimensionArray: any[] = [];
    let found: boolean = false;
    //find in the column list first
    let columnItems = this.findDimensionItems(dashboardObject.columns, dimension);
    if (columnItems != null) {
      dimensionArray = columnItems;
      found = true;
    }

    //find in the row list if not found
    if (!found) {
      let rowItems = this.findDimensionItems(dashboardObject.rows, dimension);
      if (rowItems != null) {
        dimensionArray = rowItems;
        found = true;
      }
    }

    //find in the filter list if still not found
    if (!found) {
      let filterItems = this.findDimensionItems(dashboardObject.filters, dimension);
      if (filterItems != null) {
        dimensionArray = filterItems;
        found = true;
      }
    }

    return dimensionArray;

  }

  getOrganisationUnitString(object, ou) {
    let orgUnitArray = this.getDimensionArray(object, ou);
    let organisationUnitString = "";

    orgUnitArray.forEach(organisationUnit => {
      organisationUnitString += organisationUnit.id + ";";
    })

    organisationUnitString = organisationUnitString.substring(0, organisationUnitString.length - 1);
    return organisationUnitString;
  }

  getMapObject(dashboardItemId, dashboardId): Observable<any> {
    return Observable.create(observer => {
      for (let dashboard of this.dashboards) {
        if (dashboard.id == dashboardId) {
          for (let dashboardItem of dashboard.dashboardItems) {
            if (dashboardItem.id == dashboardItemId) {
              if (dashboardItem.hasOwnProperty('mapObject')) {
                observer.next(dashboardItem.mapObject);
                observer.complete();
              } else {
                this.http.get(this.constant.api + this.utility.formatEnumString(dashboardItem.type) + "s/" + dashboardItem[this.utility.formatEnumString(dashboardItem.type)].id + ".json?fields=id,user,displayName~rename(name),longitude,latitude,zoom,basemap,mapViews[*,columns[dimension,filter,items[dimensionItem,dimensionItemType,displayName]],rows[dimension,filter,items[dimensionItem,dimensionItemType,displayName]],filters[dimension,filter,items[dimensionItem,dimensionItemType,displayName]],dataDimensionItems,program[id,displayName],programStage[id,displayName],legendSet[id,displayName],!lastUpdated,!href,!created,!publicAccess,!rewindRelativePeriods,!userOrganisationUnit,!userOrganisationUnitChildren,!userOrganisationUnitGrandChildren,!externalAccess,!access,!relativePeriods,!columnDimensions,!rowDimensions,!filterDimensions,!user,!organisationUnitGroups,!itemOrganisationUnitGroups,!userGroupAccesses,!indicators,!dataElements,!dataElementOperands,!dataElementGroups,!dataSets,!periods,!organisationUnitLevels,!organisationUnits,!sortOrder,!topLimit]").map(res => res.json())
                  .catch(this.utility.handleError)
                  .subscribe(resultObject => {
                    //Initialize map object
                    let mapObject: any = {
                      basemap: resultObject.basemap,
                      id: resultObject.id,
                      name: resultObject.name,
                      zoom: resultObject.zoom,
                      latitude: resultObject.latitude,
                      longitude: resultObject.longitude
                    };

                    //Retrieve analytic calls and objects from map views
                    let analyticCalls = [];
                    let objects = [];
                    let boundaryView: any = null;
                    resultObject.mapViews.forEach(view => {
                      //Get boundary layer when dealing with different thematic layers
                      if (view.layer != 'boundary') {
                        //TODO remove this hard coding after mpande knows how to handle event layers
                        if(view.layer == 'event') {
                          mapObject.type = 'event';
                        } else {
                          mapObject.type = 'aggregate';
                        }
                        objects.push(view);
                        analyticCalls.push(this.http.get(this._getDashBoardItemAnalyticsUrl(view, 'MAP')).map((res: Response) => res.json()).catch(this.utility.handleError));

                        //get also the geoFeature
                        analyticCalls.push(this.http.get(this._getGeoFeatureUrl(view)).map((res: Response) => res.json()).catch(this.utility.handleError));
                      } else {
                        boundaryView = view;
                      }
                    });

                    //handle boundary separately to avoid confusion
                    if (boundaryView != null) {
                      analyticCalls.push(this.http.get(this._getGeoFeatureUrl(boundaryView)).map((res: Response) => res.json()).catch(this.utility.handleError));
                    }

                    //Combine all calls
                    let analytics = [];
                    let geoFeatures = [];
                    let dataLayers = [];
                    let boundaryLayer = {};
                    Observable.forkJoin(analyticCalls).subscribe(requestResult => {
                      requestResult.forEach((value, index) => {

                        //get geoFeature and analytic object
                        if (isArray(value)) {
                          geoFeatures.push(value);
                        } else {
                          analytics.push(value);
                        }

                      });

                      //combine related objects for layers
                      objects.forEach((objectValue, objectIndex) => {
                        dataLayers.push({
                          object: objectValue,
                          analytic: analytics[objectIndex],
                          geoFeature: geoFeatures[objectIndex]
                        })
                      });

                      //process boundary layer
                      //TODO find best way to dynamically retrieve boundary layer
                      boundaryLayer = {
                        object: boundaryView,
                        geoFeature: geoFeatures[objects.length]
                      }

                      //update mapObject
                      mapObject.dataLayers = dataLayers;
                      mapObject.boundaryLayer = boundaryLayer;

                      //save result in dashboard item
                      dashboardItem.mapObject = mapObject;

                      //return as observable
                      observer.next(mapObject);
                      observer.complete();

                    }, error => {
                      observer.error(error);
                    });

                  }, error => {
                    observer.error(error);
                  })
              }
              break;
            }
          }
          break;
        }
      }
    })
  }

  getGeoFeatures(url) {
    return Observable.create(observer => {
      this.http.get(this.constant.api + url).map(res => res.json())
        .catch(this.utility.handleError)
        .subscribe(mapObject => {
          observer.next(mapObject);
          observer.complete();
        }, error => {
          observer.error(error)
        })
    })
  }

  convertToMapObject(dashboardObject) {


    return Observable.create(observer => {
      let orgUnitArray = this.getDimensionArray(dashboardObject.object, 'ou');
      let periodArray = this.getDimensionArray(dashboardObject.object, 'pe');
      let dataArray = this.getDimensionArray(dashboardObject.object, 'dx');
      let analytics = dashboardObject.analytic;
      let object = dashboardObject.object;
      let mapObjectFormat: any = {
        basemap: "none",
        boundaryLayer: {},
        dataLayers: [],
        id: dashboardObject.object.id,
        latitude: 0,
        longitude: 0,
        name: dashboardObject.object.name,
        zoom: 0
      }

      let boundaryLayer = {
        "id": "h4Za9tihPPF",
        "name": "h4Za9tihPPF",
        "method": 2,
        "labels": false,
        "displayName": "h4Za9tihPPF",
        "labelFontColor": "#normal",
        "layer": "boundary",
        "labelFontStyle": "normal",
        "radiusHigh": 15,
        "eventClustering": false,
        "colorLow": "ff0000",
        "opacity": 1,
        "parentLevel": 0,
        "parentGraphMap": {

        },
        "labelFontSize": "11px",
        "colorHigh": "00ff00",
        "completedOnly": false,
        "eventPointRadius": 0,
        "hidden": false,
        "classes": 5,
        "labelFontWeight": "normal",
        "radiusLow": 5,
        "attributeDimensions": [],
        "translations": [],
        "interpretations": [],
        "columns": [],
        "dataElementDimensions": [],
        "categoryDimensions": [],
        "programIndicatorDimensions": [],
        "attributeValues": [],
        "userAccesses": [],
        "dataDimensionItems": [],
        "filters": [],
        "rows": [],
        "categoryOptionGroups": []
      }


      let orgUnitParams = "";
      if (orgUnitArray.length > 0) {
        orgUnitArray.forEach((item, index) => {
          orgUnitParams += index > 0 ? ";" : "";
          orgUnitParams += item.dimensionItem;
        })
      }
      let analyticParams = [];
      dataArray.forEach(dataParam => {
        periodArray.forEach(periodParam => {
          analyticParams.push({
            ou: orgUnitParams,
            dx: dataParam.dimensionItem,
            pe: periodParam.dimensionItem
          })
        })
      });

      let urlArray = [];
      analyticParams.forEach(param => {
        let analyticsUrl = 'analytics.json?dimension=dx:' + param.dx + '&dimension=ou:' + param.ou + '&filter=pe:' + param.pe + '&displayProperty=NAME';
        let geoJsonUrl = 'geoFeatures.json?ou=ou:' + param.ou;
        urlArray.push(analyticsUrl);
        urlArray.push(geoJsonUrl);
      });

      Observable.forkJoin(
        $.map(urlArray, (url) => {
          return this.http.get(this.constant.api + url).map(res => res.json())
        })
      )
        .subscribe(responses => {
          responses.forEach((response, responseIndex) => {
            if (responseIndex % 2 == 1) {
              return;
            }
            mapObjectFormat.dataLayers.push({object:this.getLayerConiguration(dashboardObject.object),analytic: responses[responseIndex], geoFeature: responses[responseIndex + 1]});


          });

          mapObjectFormat.boundaryLayer = {geoFeature:responses[1],object:boundaryLayer};

          observer.next(mapObjectFormat);
          observer.complete();

        });
    })

  }

  getSingleDataAnalytics(param, analytics, geoFeatures) {
    let pe = param.pe;
    let dx = param.dx;
    let ou = param.ou;
    let rows = analytics.rows;

    let names = analytics.metaData.names;

    let analytic = {
      headers: [],
      metaData: {
        co: [],
        dx: [],
        pe: [],
        names: {},
        ou: []
      },
      rows: []
    }

    rows.forEach(row => {

      if (row[0] == dx) {
        // row[1] = geoFeatures[0].id
        analytic.rows.push(row);
      }
    })
    if (analytics.rows.length == 0) {
      analytic.rows.push([dx, pe, 0]);
    }
    analytic.metaData.dx.push(dx);
    analytic.metaData.names[dx] = names[dx] + "  " + pe;
    analytic.metaData.ou = analytics.metaData.ou;

    return analytic;
  }

  getLayerConiguration(object) {
    let defaultObject = {
      classes: 5,
      colorHigh: "00ff00",
      colorLow: "ff0000",
      colorScale: "#ffffd4,#fed98e,#fe9929,#d95f0e,#993404",
      columns: [],
      completedOnly: false,
      dataDimensionItems: [],
      dataElementDimensions: [],
      displayName: object.displayName,
      eventClustering: false,
      eventPointRadius: 0,
      filters: [],
      hidden: false,
      id: object.id,
      interpretations: [],
      labelFontColor: "##000000",
      labelFontSize: "11px",
      labelFontStyle: "normal",
      labelFontWeight: "normal",
      labels: false,
      layer: "thematic1",
      method: 3,
      name: object.name,
      opacity: 0.8,
      parentGraphMap: Object,
      parentLevel: 0,
      program: Object,
      programIndicatorDimensions: [],
      radiusHigh: 15,
      radiusLow: 5,
      rows: [],
      translations: [],
      userAccesses: []
    }
    return defaultObject;
  }

  getGeoFeature(ou) {
    return Observable.create(observer => {
      this.http.get(this.constant.api + 'geoFeatures.json?ou=ou:' + ou).map(res => res.json())
        .catch(this.utility.handleError)
        .subscribe(mapObject => {
          observer.next(mapObject);
          observer.complete();
        }, error => {
          observer.error(error)
        })
    })
  }
}
