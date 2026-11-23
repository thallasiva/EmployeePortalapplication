import { Calendar, LayoutGrid, BarChart2 } from "lucide-react";
const VIEW_BUTTONS = [{
  key: "month",
  icon: <Calendar size={14} />,
  label: "Month"
}, {
  key: "week",
  icon: <LayoutGrid size={14} />,
  label: "Week"
}, {
  key: "year",
  icon: <BarChart2 size={14} />,
  label: "Year"
}];
/** Toolbar: view-switcher, prev/next navigation, employee filter, and legend */
export { VIEW_BUTTONS };
