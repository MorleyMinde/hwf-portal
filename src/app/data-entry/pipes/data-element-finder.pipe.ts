import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dataElementFinder'
})
export class DataElementFinderPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if(value.sections){
      if(value.sections.length > 0){
        return value.sections[0].dataElements;
      }
    }else if(value.dataElements){
      return value.dataElements;
    }
    return [];
  }

}
