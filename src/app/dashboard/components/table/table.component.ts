import {Component, OnInit, Input} from '@angular/core';
import {Visualization} from "../../model/visualization";
import {TableService} from "../../providers/table.service";
import {VisualizationObjectService} from "../../providers/visualization-object.service";

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit {

  @Input() initialTableData: Visualization;
  @Input() customFilters: any[] = [];
  tableData: any;
  loading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = 'Unknown error has occurred';
  tableObjects: any[];
  constructor(
    private tableService: TableService,
    private visualizationObjectService: VisualizationObjectService
  ) { }

  ngOnInit() {
    this.loadTable(this.initialTableData);
  }

  loadTable(initialTableData) {
    this.loading = true;
    if(initialTableData) {
      this.tableData = initialTableData;
      this.visualizationObjectService.getSanitizedVisualizationObject(initialTableData).subscribe(sanitizedTableData => {
        if(sanitizedTableData) {
          this.tableData = sanitizedTableData;
          if(sanitizedTableData.details.loaded) {
            this.loading = false;
            if(!sanitizedTableData.details.hasError) {
              this.tableObjects = this.tableService.getTableObjects(sanitizedTableData);
              this.hasError = false;
            } else {
              this.hasError = true;
              this.errorMessage = sanitizedTableData.details.errorMessage;
            }
          }
        }
      })
    }
  }

}
