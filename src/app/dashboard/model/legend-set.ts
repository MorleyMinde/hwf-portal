import {LegendClass} from "./legend-class";
export interface LegendSet {
  id: string;
  name: string;
  description: string;
  opened: boolean;
  pinned: boolean;
  useIcons: boolean;
  opacity: number;
  classes: Array<LegendClass>;
  change: Array<Object>;
}
