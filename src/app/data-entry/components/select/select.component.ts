import { Component, OnInit,Input,Output,EventEmitter,ContentChild,TemplateRef } from '@angular/core';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.css']
})
export class SelectComponent implements OnInit {

  @Input() selected:any;
  @Input() options;
  @Input() isOpen;
  @Input() settings:any = {
    valueField:"value",
    textField:"text",
    multipleSelection:false
  };
  @Input() template: TemplateRef<any>;

  searchOptions;
  @Output() valueSelected = new EventEmitter();
  constructor() { }

  ngOnInit() {
    this.searchOptions={
      shouldSort: true,
      tokenize: true,
      findAllMatches: true,
      threshold: 0,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [
        this.settings.textField
      ]
    }
  }

  onBlur(){
    this.searchText = "";
  }
  searchText
  select(option){
    this.searchText = "";
    this.selected = option[this.settings.valueField];
    this.valueSelected.emit(option[this.settings.valueField]);
  }
}
