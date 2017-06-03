import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterOrgUnitAttributes'
})
export class FilterOrgUnitAttributesPipe implements PipeTransform {

  transform(programStageDataElements: any, organisationUnit: any): any {
    let output = [];
    programStageDataElements.forEach((programStageDataElement)=>{
      let found = false;
      programStageDataElement.dataElement.attributeValues.forEach((attributeValue)=>{
        if(attributeValue.attribute.name == "Organisation Unit Field"){
          if(attributeValue.value){
            found = true;
          }
        }
      })
      if(!found){
        output.push(programStageDataElement);
      }
    })
    return output;
  }

}
