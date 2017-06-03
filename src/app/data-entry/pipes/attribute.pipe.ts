import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'attribute'
})
export class AttributePipe implements PipeTransform {

  transform(value: any, args?: any): any {
    let returnValue = "";
    value.attributeValues.forEach((attributeValue) =>{
      if(attributeValue.attribute.name == args){
        returnValue = attributeValue.value;
      }
    })
    return returnValue;
  }

}
