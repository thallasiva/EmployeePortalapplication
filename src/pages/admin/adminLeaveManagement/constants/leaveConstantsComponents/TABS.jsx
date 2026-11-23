import React from "react";
import { Calendar, List, BarChart2, LayoutGrid } from "lucide-react";
const TABS = [{
  key: "calendar",
  label: "Leave Calendar",
  icon: <Calendar size={15} />
}, {
  key: "requests",
  label: "Leave Requests",
  icon: <List size={15} />
}, {
  key: "balances",
  label: "Leave Balances",
  icon: <BarChart2 size={15} />
}, {
  key: "types",
  label: "Leave Types",
  icon: <LayoutGrid size={15} />
}];
export { TABS };
