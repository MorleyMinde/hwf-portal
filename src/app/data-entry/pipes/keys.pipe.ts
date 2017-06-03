import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'keys'
})
export class KeysPipe implements PipeTransform {
  transform(value, action) : any {
    if(action){
      if(action == 'sum'){
        let retValue = 0;
        Object.keys(value).forEach((key) =>{
          retValue += value[key];
        })
        return retValue;
      }
    }else{
      return Object.keys(value);
    }
  }

}
