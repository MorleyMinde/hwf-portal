import { Pipe, PipeTransform } from '@angular/core';
declare var Fuse:any;

@Pipe({
  name: 'fuseSearch'
})
export class FuseSearchPipe implements PipeTransform {

  transform(list: any, options?: any, text?: string): any {
    if(text){
      if(text.trim() != ""){
        var fuse = new Fuse(list, options); // "list" is the item array
        return fuse.search(text);
      }else{
        return list;
      }
    }else{
      return list;
    }
  }

}
