import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'search'
})
export class SearchPipe implements PipeTransform {

  transform(items:any, searchText?:any, keys?):any {
    if (searchText != "") {
      let foundItems = [];
      items.forEach((item) => {

        keys.some((key) => {
          let found = false;
          if (typeof key == "string") {
            if (item[key]) {
              if (item[key].toLowerCase().indexOf(searchText.toLowerCase()) > -1) {
                foundItems.push(item);
                return true;
              }
            }
          } else if (key['attribute']) {
            item.attributeValues.some((attributeValue) => {
              if (attributeValue.value)
                if (attributeValue.value.toLowerCase().indexOf(searchText.toLowerCase()) > -1) {
                  foundItems.push(item);
                  found = true;
                  return true;
                }
            })
          }
          return found;
        })
      })
      return foundItems
    }
    return items;
  }

}
