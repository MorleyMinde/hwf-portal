import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderBy'
})
export class OrderByPipe implements PipeTransform {

  static _orderByComparator(a:any, b:any):number {
    if(a && b){
      if ((isNaN(parseFloat(a)) || !isFinite(a)) || (isNaN(parseFloat(b)) || !isFinite(b))) {
        //Isn't a number so lowercase the string to properly compare
        if (a.toLowerCase() < b.toLowerCase()) return -1;
        if (a.toLowerCase() > b.toLowerCase()) return 1;
      }
      else {
        //Parse strings as numbers to compare properly
        if (parseFloat(a) < parseFloat(b)) return -1;
        if (parseFloat(a) > parseFloat(b)) return 1;
      }
    }else if(!a || !b){
      return a;
    }

    return 0; //equal each other
  }

  getValue(object,comperator){
    let tree = comperator.split(".");
    let value;
    tree.forEach((v)=>{
      if(value){
        value = value[v]
      }else{
        value = object[v]
      }
    })
    return value
  }
  transform(input:any, [config = '+']:any):any {
    if (!Array.isArray(input)) return input;

    let comperator = arguments[1];
    if (!Array.isArray(config) || (Array.isArray(config) && config.length == 1)) {
      var propertyToCheck:string = !Array.isArray(config) ? config : config[0];
      var desc = propertyToCheck.substr(0, 1) == '-';

      //Basic array
      if (!propertyToCheck || propertyToCheck == '-' || propertyToCheck == '+') {
        return !desc ? input.sort() : input.sort().reverse();
      }
      else {

        var property:string = propertyToCheck.substr(0, 1) == '+' || propertyToCheck.substr(0, 1) == '-'
          ? propertyToCheck.substr(1)
          : propertyToCheck;

        return input.sort((a:any, b:any) =>{
          /*return !desc
            ? OrderByPipe._orderByComparator(a[comperator], b[comperator])
            : -OrderByPipe._orderByComparator(a[comperator], b[comperator]);*/
          return !desc
            ? OrderByPipe._orderByComparator(this.getValue(a,comperator), this.getValue(b,comperator))
            : -OrderByPipe._orderByComparator(this.getValue(a,comperator),this.getValue(b,comperator));
        });
      }
    }
    else {
      //Loop over property of the array in order and sort
      return input.sort(function (a:any, b:any) {
        for (var i:number = 0; i < config.length; i++) {
          var desc = config[i].substr(0, 1) == '-';
          var property = config[i].substr(0, 1) == '+' || config[i].substr(0, 1) == '-'
            ? config[i].substr(1)
            : config[i];

          var comparison = !desc
            ? OrderByPipe._orderByComparator(a[property], b[property])
            : -OrderByPipe._orderByComparator(a[property], b[property]);

          //Don't return 0 yet in case of needing to sort by next property
          if (comparison != 0) return comparison;
        }

        return 0; //equal each other
      });
    }
  }

}
