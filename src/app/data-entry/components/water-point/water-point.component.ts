import { Component, OnInit,Output,EventEmitter } from '@angular/core';
import { ActivatedRoute,Params,Router,NavigationEnd} from '@angular/router';
import {HttpClientService} from "../../../shared/providers/http-client.service";
import {ChangeService} from "../../providers/change.service";
import {UserService} from "../../providers/user.service";
declare var L:any;

@Component({
  selector: 'app-water-point',
  templateUrl: './water-point.component.html',
  styleUrls: ['./water-point.component.css']
})
export class WaterPointComponent implements OnInit {
  private id;
  private parentId;
  private loading;
  private loadingError;
  private organisationUnit;
  private editing = false;
  saveTriggered = false;
  @Output() addOrgUnit = new EventEmitter();
  //lat: number = -6.3690;
  //lng: number = 34.8888;
  readonly = true;
  constructor(private http:HttpClientService, private route:ActivatedRoute, private router:Router, private changeService:ChangeService,private userService:UserService) {
    this.route.params.subscribe((params)=> {
      route.parent.params.forEach((params2:Params) => {
        if(params2['readonly']){
          this.readonly = true;
        }else{
          this.readonly = false;
        }
        this.parentId = params2['id'];
      })
      this.id = params['waterPointId'];
      this.init()
    })
  }

  addOrganisationUnit(orgUnit:any) {
    this.changeService.envokeNewWaterPoint(orgUnit);
  }

  ngOnInit() {

  }

  cancel() {
    this.editing = false;
    if (this.id == 'new')
      this.router.navigate(['orgUnit', this.parentId], {relativeTo: this.route})
  }

  authorities;
  programs;
  init() {
    this.organisationUnit = undefined;
    this.loading = true;
    this.loadingError = false;
    this.userService.getAuthorities().subscribe((authorities:any)=>{
      this.authorities = authorities;
      this.userService.getPrograms().subscribe((programs:any)=>{
        this.programs = programs;
        if (this.id == "new" && (authorities.indexOf('ALL') || authorities.indexOf('F_DATAVALUE_ADD'))) {
          this.http.get("attributes.json?fields=id,name,valueType,optionSet[options[id,name,code]]&filter=organisationUnitAttribute:eq:true").subscribe((data:any) => {
            let attributeValues = [];
            data.attributes.forEach((attribute) => {
              attributeValues.push({value: "", attribute: attribute})
            })
            this.http.get("dataSets.json?fields=id,name,periodType,openFuturePeriods,sections[indicators[id,name,numerator,denominator,factor],dataElements[id,name,valueType,optionSet[id,name,options[id,name,code]]]]&filter=attributeValues.value:eq:5").subscribe((dataSetData:any) => {
              this.http.get("organisationUnits/" + this.parentId + ".json?fields=id,name,code,ancestors[code],children,programs[id,name,programStages[programStageDataElements[dataElement[id,name,valueType,optionSet[id,name,options[id,name,code]]]]]]").subscribe((orgUnitData:any) => {
                let orgUnit = orgUnitData;
                let code = orgUnit.ancestors[3].code;

                let length = "";
                if (orgUnit.children.length < 10) {
                  length = "0" + (orgUnit.children.length + 1);
                } else {
                  length = "" + (orgUnit.children.length + 1);
                }
                if (orgUnit.code) {
                  code = orgUnit.code + length;

                } else {
                  code += "." + orgUnit.name.substr(0, 3) + length;
                }
                var date = new Date();
                date = new Date(date.getFullYear(),date.getMonth() - 1,1);
                this.organisationUnit = {
                  name: "",
                  code: code,
                  openingDate: date,
                  coordinates: "[-6.3690,34.8888]",
                  attributeValues: attributeValues,
                  parent: {
                    id: orgUnit.id
                  },
                  //dataSets:dataSetData.dataSets
                };
                this.loading = false;
                this.editing = true;
              }, (error) => {
                this.loading = false;
                this.loadingError = error;
              });
            }, (error) => {
              this.loading = false;
              this.loadingError = error;
            });
          }, (error) => {
            this.loading = false;
            this.loadingError = error;
          });
        } else {
          this.loadOrganisationUnit();
        }
      })
    })
  }

  loadOrganisationUnit() {
    this.editing = false;
    this.http.get("organisationUnits/" + this.id + ".json?fields=id,name,shortName,openingDate,code,parent,coordinates,programs[id,programRules[condition,programRuleActions[programRuleActionType,content,dataElement]],programRuleVariables[name,dataElement],name,programStages[programStageDataElements[dataElement[id,name,valueType,attributeValues[value,attribute[name]],optionSet[id,name,options[id,name,code]]]]]],attributeValues[value,attribute[id,name,valueType,optionSet[options[id,name,code]]]],dataSets[id,name,openFuturePeriods,periodType,sections[dataElements[id,name,categoryCombo[*,categoryOptionCombos[*]],attributeValues[value,attribute[id,name]],valueType,optionSet[id,name,options[id,name,code]]]]").subscribe((data:any) => {

      this.http.get("attributes.json?fields=id,name,valueType,optionSet[options[id,name,code]]&filter=organisationUnitAttribute:eq:true").subscribe((attrdata:any) => {
        this.organisationUnit = data;
        this.loading = false;
        let attributeValues = [];
        attrdata.attributes.forEach((attribute) => {
          attributeValues.push({value: "", attribute: attribute})
        })
        attributeValues.forEach(basicAttributeValue => {
          let found = false;
          this.organisationUnit.attributeValues.forEach((attributeValue) => {
            if (basicAttributeValue.attribute.name == attributeValue.attribute.name) {
              found = true;
            }
          })
          if (!found) {
            this.organisationUnit.attributeValues.push(basicAttributeValue);
          }
        })
      }, (error) => {
        this.loading = false;
        this.loadingError = error;
      });
    }, (error) => {
      this.loading = false;
      this.loadingError = error;
    });
  }

  validate = {}

  save() {
    let validated = true;
    this.loading = true;
    this.saveTriggered = true;
    let newAttributeValues = [];
    this.organisationUnit.attributeValues.forEach((attributeValue) => {
      if (attributeValue.attribute.name != "Old Code") {
        if (attributeValue.value == "") {
          validated = false;
        }
      }
      if (attributeValue.value != "") {
        newAttributeValues.push(attributeValue);
      }
    })
    if (validated) {
      this.organisationUnit.attributeValues = newAttributeValues;
      this.loadingError = false;
      var attributes = "";
      this.organisationUnit.attributeValues.forEach((attribute,index)=>{
        if(index > 0){
          attributes += "-_"
        }
        attributes += attribute.attribute.id + "_-" + attribute.value;
      })
      console.log(this.organisationUnit);
      this.http.get("sqlViews/FRUcnTzKfzm/data.json?var=name:" + this.organisationUnit.name + "&var=parent:" + this.organisationUnit.parent.id + "&var=userid:" +
        this.organisationUnit.parent.id + "&var=attributes:" + attributes +"&var=waterpointid:" + this.organisationUnit.id +"&var=coordinates:" +
        this.organisationUnit.coordinates.split(".").join("dot").replace("[","").replace("]","").replace(",","comma")).subscribe((data:any) => {
        if(data.rows[0][0].length != 11){
          this.loading = false;
          this.loadingError = {httpStatusCode: 409,message:"SQL Error",response:{errorReports:[{message:data.rows[0][0]}]}};
        }else{
          this.saveTriggered = false;
          this.editing = false;
          this.loading = false;
          if(!this.organisationUnit.id){
            this.http.get("organisationUnits/" +  data.rows[0][0]).subscribe((orgUnit:any) => {
              this.addOrganisationUnit(orgUnit);
            }, (error) => {

            });
            this.router.navigate(['/data-entry', 'orgUnit', this.organisationUnit.parent.id, 'waterPoint', data.rows[0][0]]);
          }
        }
      }, (error) => {
        this.loading = false;
        this.loadingError = error;
      });
    } else {
      this.loading = false;
    }


  }

  showMap;

  showModal() {
    this.showMap = true;
    let marker = [-6.3690, 34.8888];
  }
}
