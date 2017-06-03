import { Component, OnInit} from '@angular/core';
import { ActivatedRoute,Params,Router,NavigationStart } from '@angular/router';
import {HttpClientService} from "../../../providers/http-client.service";
import {OrderByPipe} from "../../pipes/order-by.pipe";
import {Observable} from 'rxjs/Observable';
import {ChangeService} from "../../providers/change.service";
import {UserService} from "../../providers/user.service";
declare var $:any;
declare var document:any;

@Component({
  selector: 'app-sub-organisation-units',
  templateUrl: './sub-organisation-units.component.html',
  styleUrls: ['./sub-organisation-units.component.css']
})
export class SubOrganisationUnitsComponent implements OnInit {

  private organisationUnit;
  loading = true;
  loadingError;
  id;
  waterPointId;
  pageSize = 10;
  selectedOrder = "name";
  searchText = "";
  totalWaterPoints;
  monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  date:Date;

  statusPeriod;

  constructor(private http:HttpClientService, private route:ActivatedRoute, private router:Router, private changeService:ChangeService,private userService:UserService) {
    this.route.params.subscribe((params)=> {
      this.init()
    })
    //this.init();
  }

  openWaterPoint(selectedOrganisationUnit) {
    if (this.router.url.indexOf("level") > -1) {
      this.router.navigate(['data-entry', 'orgUnit', this.id, 'level', this.level, 'waterPoint', selectedOrganisationUnit.id]);
    } else {
      this.router.navigate(['data-entry', 'orgUnit', this.id, 'waterPoint', selectedOrganisationUnit.id]);
    }
  }

  addOrganisationUnit(orgUnit) {
    this.totalWaterPoints++;
    orgUnit.status = "loaded";
    orgUnit.completeness = 0;

    if (!this.organisationUnit.children) {
      this.organisationUnit.children = [];
    }
    this.organisationUnit.children.push(orgUnit);
    let order = new OrderByPipe();
    this.organisationUnit.children = order.transform(this.organisationUnit.children, this.selectedOrder);
  }

  waterPointParentLevel;
  pageClustering;
  level;
  setLevel;
  nextLevel
  authorities
  init() {
    this.searchText = "";

    this.route.params.forEach((params:Params) => {
      if (this.id != params['id'] || this.level != params['level']) {
        this.id = params['id'];
        this.setLevel = params['level'];
        this.level = params['level'];

        this.waterPointId = params['waterPointId'];
        this.changeService.setListener(this)
        this.loading = true;
        this.loadingError = false;
        this.userService.getAuthorities().subscribe((authorities)=>{
          this.authorities = authorities;
        })
        this.http.get("constants.json?fields=id,name,value&filter=name:eq:Water Point Parent Level").subscribe((data:any) => {
          this.waterPointParentLevel = data.constants[0].value;
          this.http.get("organisationUnits.json?filter=level:eq:" + this.waterPointParentLevel + "&filter=path:like:" + this.id + "&pageSize=1").subscribe((data:any) => {
            this.totalWaterPoints = data.pager.total;
            this.http.get("organisationUnits/" + this.id + ".json?fields=id,name,level,ancestors[id,name],parent[id],dataSets[id,categoryCombo[*,categoryOptionCombos[*]],name,periodType,dataElements[id,name,valueType,attributeValues[value,attribute[id,name,optionSet[options[id,name,code]]]]],attributeValues[value,attribute[id,name]]],dataSets[id,name,periodType,openFuturePeriods,dataElements[id,name,valueType,attributeValues[value,attribute[id,name,optionSet[options[id,name,code]]]],optionSet[id,name,options[id,name,code]]]]").subscribe((data:any) => {
              //let dataJSON = data;
              this.organisationUnit = data;

              this.userService.getRootOrganisationUnits().subscribe((organisationUnits:any)=>{
                var newAncestors = [];
                var rootFound = false;
                this.organisationUnit.ancestors.forEach((ancestor)=>{
                  if(rootFound){
                    newAncestors.push(ancestor);
                  }else{
                    organisationUnits.some((organisationUnit:any)=>{
                      if(ancestor.id == organisationUnit.id){
                        newAncestors.push(ancestor);
                        rootFound = true;
                      }
                    })
                  }
                })
                this.organisationUnit.ancestors = newAncestors;
              })
              if (!this.level) {
                this.level = (this.organisationUnit.level + 1);
              }
              this.http.get("organisationUnitLevels.json?fields=name,level").subscribe((organisationUnitLevelsData:any) => {
                organisationUnitLevelsData.organisationUnitLevels.forEach((organisationUnitLevel)=> {
                  console.log
                  if (organisationUnitLevel.level == this.level) {
                    this.nextLevel = organisationUnitLevel;
                  }
                })
              })
              if (this.waterPointParentLevel == this.organisationUnit.level) {
                this.router.navigate(['data-entry', 'orgUnit', this.organisationUnit.parent.id, "waterPoint", this.organisationUnit.id]);
              } else {
                let url = "organisationUnits.json?paging=false&fields=id,name,code,ancestors[name],attributeValues[value,attribute[id,name]]&filter=path:like:" + this.id + "&filter=level:eq:" + this.level;
                if (this.level.indexOf)
                  if (this.level.indexOf("OU_GROUP-") > -1) {
                    url = "organisationUnits.json?paging=false&fields=id,name,code,ancestors[name],attributeValues[value,attribute[id,name]]&filter=path:like:" + this.id + "&filter=organisationUnitGroups.id:eq:" + this.level.replace("OU_GROUP-", "");
                    this.level = (this.organisationUnit.level + 1);
                  }
                this.http.get(url).subscribe((data:any) => {
                  this.organisationUnit.children = data.organisationUnits;
                  this.calculateCompletenessStatus();
                  this.loading = false;
                  let possibleValues = [5, 10, 20, 30, 50, 100];
                  this.pageClustering = [];
                  for (let i = 0; i < possibleValues.length; i++) {
                    if (this.organisationUnit.children.length > possibleValues[i]) {
                      this.pageClustering.push({name: possibleValues[i], value: possibleValues[i]})
                    }
                  }
                  this.pageClustering.push({name: "All", value: this.organisationUnit.children.length});

                }, (error) => {
                  this.loading = false;
                  this.loadingError = error;
                });
              }
              //if(this.organisationUnit.level == this.waterPointParentLevel -1)

            }, (error) => {
              this.loading = false;
              this.loadingError = error;
            });
          }, (error) => {
            this.loading = false;
            this.loadingError = error;
          })
        }, (error) => {
          this.loading = false;
          this.loadingError = error;
        })
      }

    });
  }

  periodStatus;

  changeOrder(field){
    if(this.selectedOrder.endsWith(field)){
      if(this.selectedOrder.startsWith("-")){
        this.selectedOrder = field;
      }else{
        this.selectedOrder = "-" + field;
      }
    }else{
      this.selectedOrder = field;
    }
  }
  calculateCompletenessStatus() {
    this.periodStatus = undefined;
    this.route
      .queryParams
      .subscribe((params:any) => {
        this.periodStatus = params.period;
      });
    if (!this.periodStatus) {
      this.date = new Date();
      //this.date.setMonth(this.date.getMonth() - 1);
      this.date = new Date(this.date.getFullYear(), this.date.getMonth() - 1, 1);
      this.periodStatus = "" + this.date.getFullYear();
      if (this.date.getMonth() < 9) {
        this.periodStatus += "0" + (this.date.getMonth() + 1);
      } else {
        this.periodStatus += "" + (this.date.getMonth() + 1);
      }
    }
    this.http.get("analytics.json?dimension=dx:MTAVidYwh6V.REPORTING_RATE&dimension=pe:" + this.periodStatus + "&dimension=ou:" + this.organisationUnit.id + ";LEVEL-" + (this.level) + "&displayProperty=NAME&skipMeta=true").subscribe((data:any) => {
      //this.http.get("analytics.json?dimension=dx:MTAVidYwh6V.REPORTING_RATE&dimension=pe:201702&dimension=ou:" + this.organisationUnit.id+ ";LEVEL-" +(this.level)+ "&displayProperty=NAME&skipMeta=true").subscribe((data) => {
      let rows = data.rows;
      this.organisationUnit.children.forEach((child:any) => {
        let found = false;
        rows.forEach((row)=> {
          if (child.id == row[2]) {
            found = true;
            child.completeness = parseFloat(row[3]);
            child.status = "loaded";
          }
        })
        if (!found) {
          child.completeness = 0;
          child.status = "loaded";
        }
      })
    }, (error) => {
      this.organisationUnit.children.forEach((child:any) => {
        console.log(error.message);
        child.status = "error";
        if (error.message.indexOf("is not allowed to view org unit") > -1) {
          child.statusMessage = "Not allowed to view this. Contact Administrator";
        } else {
          child.statusMessage = "Network Error";
        }
      })
    });
    this.organisationUnit.children.forEach((child:any) => {
      child.completeness = undefined;
      child.status = undefined;
    })
  }

  ngOnInit() {

  }

  downloadLoad;
  downloadError;

  download() {
    this.downloadLoad = true;
    this.downloadError = false;
    this.ConvertToCSV(this.organisationUnit.children).subscribe((results)=> {
      let a = document.createElement("a");
      a.setAttribute('style', 'display:none;');
      document.body.appendChild(a);
      let blob = new Blob([results], {type: 'text/csv'});
      let url = window.URL.createObjectURL(blob);
      a.href = url;
      var date = new Date();
      a.download = this.organisationUnit.name + " " + this.monthNames[this.date.getMonth()] + " " + this.date.getFullYear() + "_generated_on_" + date.getDate() +"/" + (date.getMonth() + 1)+ "/"+ date.getFullYear() + '.csv';
      a.click();
      this.downloadLoad = false;
    }, (error) => {
      this.downloadLoad = false;
      this.downloadError = error;
    });
  }

  ConvertToCSV(objArray):any {
    console.log(this.setLevel);
    return new Observable(observer => {
      let array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
      let str = '';

      //append Label row with line break

      this.http.get("organisationUnitLevels.json?fields=name,level").subscribe((organisationUnitLevelsData:any) => {
        let organisationUnitLevelsDataJSON = organisationUnitLevelsData.organisationUnitLevels;
        organisationUnitLevelsDataJSON.sort((a, b) => {
          if (a.level < b.level) {
            return -1;
          }
          if (a.level > b.level) {
            return 1;
          }
          // a must be equal to b
          return 0;
        })
        organisationUnitLevelsDataJSON.forEach((organisationUnitLevel)=> {
          if (organisationUnitLevel.level != 1 && organisationUnitLevel.level <= this.level) {
            str += organisationUnitLevel.name + ",";
          }
        })
        str += "Code";
        let headers = ["Project", "Basin", "Year of Construction", "Source", "Technology", "Old Code", "Extraction System", "Village Population", "Water Point Management"];
        if (this.level == (this.waterPointParentLevel)) {
          str += "," + headers.join(",");
        }
        str += ",Completeness Status";
        let dx = ["DIC1UYnqUf7", "OXHW0r8lrdk", "WteCqFCRv7H", "d8MNkGPyADo", "kMeKnrbm9UV", "yFLFPloToNW"];
        this.http.get("analytics.json?dimension=dx:" + dx.join(";") + "&filter=pe:" + this.periodStatus + "&dimension=ou:LEVEL-" + this.level + ";" + this.organisationUnit.id + "&displayProperty=NAME&skipMeta=false").subscribe((analyticsData:any) => {
          let analyticsDataJSON = (analyticsData);
          let orgUnitsObject = {};
          analyticsDataJSON.rows.forEach((row)=> {
            if (!orgUnitsObject[row[1]]) {
              orgUnitsObject[row[1]] = {};
            }
            orgUnitsObject[row[1]][row[0]] = row[2];
          })
          dx.forEach((d)=> {
            str += "," + analyticsDataJSON.metaData.items[d].name;
          })
          str += "\r\n";

          array.forEach((orgUnit) => {
            let line = "";
            orgUnit.ancestors.forEach((ancestor, index) => {
              if (index != 0) {
                line += ancestor.name;
                if(this.setLevel.indexOf("OU_GROUP") > -1){
                  line += "/";
                }else{
                  line += ",";
                }
              }
            })
            line += orgUnit.name + "," + (orgUnit.code ? orgUnit.code : "");
            if (this.level == (this.waterPointParentLevel)) {
              headers.forEach((key)=> {
                if (key)
                  line += "," + this.getAttribute(key, orgUnit);
              })
            }
            line += "," + orgUnit.completeness;
            dx.forEach((d)=> {
              if (orgUnitsObject[orgUnit.id]) {
                if (orgUnitsObject[orgUnit.id][d]) {
                  line += "," + orgUnitsObject[orgUnit.id][d];
                } else {
                  line += ",";
                }
              } else {
                line += ",";
              }
            })
            str += line + '\r\n';
          })
          observer.next(str);
          observer.complete();
        });
      });
    });
  }

  getAttribute(name, orgUnit) {
    let value = "";
    orgUnit.attributeValues.forEach((attributeValue)=> {
      if (attributeValue.attribute.name == name) {
        value = attributeValue.value;
      }
    })
    return value;
  }

  setPageSize(size) {
    // console.log(size);
    this.pageSize = size;
  }
}
