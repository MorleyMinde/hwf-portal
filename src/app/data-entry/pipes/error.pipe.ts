import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'error'
})
export class ErrorPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if(value.status == 0){
      return {heading:'Oh Snap!',message:'Failed to load. Please check the your internet connection.'};
    }else{
      return args;
    }
  }

}
