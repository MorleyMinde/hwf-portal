import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterLevel',
  pure: false
})
export class FilterLevelPipe implements PipeTransform {

  transform(input: any, orgUnitTree?,selectedOrganisatioUnit?): any {
    console.log(input,orgUnitTree,selectedOrganisatioUnit);
    let output = [];
    input.forEach((orgUnit)=>{
      if(selectedOrganisatioUnit.length > 0){
        console.log(selectedOrganisatioUnit[0],orgUnit);
        if(selectedOrganisatioUnit[0].level < orgUnit.level){
          output.push(orgUnit);
        }
      }else{
        if(orgUnit.level > orgUnitTree.level){
          output.push(orgUnit);
        }
      }
    })
    console.log(output);
    return output;
  }

}
