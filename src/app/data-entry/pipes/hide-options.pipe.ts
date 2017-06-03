import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hideOptions'
})
export class HideOptionsPipe implements PipeTransform {

  transform(value: any, hiddenOptions: any): any {
    if(hiddenOptions){
      let options = [];
      value.forEach((option)=>{
        if(hiddenOptions.indexOf(option.code) == -1){
          options.push(option);
        }
      })
      return options;
    }else{
      return value;
    }
  }

}
