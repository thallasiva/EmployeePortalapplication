import React from "react";
import { BarChart2, PieChart, Table2 } from "lucide-react";
const FORMATS = [{
  id: "table",
  label: "Table",
  icon: <Table2 size={14} />
}, {
  id: "bar",
  label: "Bar Chart",
  icon: <BarChart2 size={14} />
}, {
  id: "pie",
  label: "Pie Chart",
  icon: <PieChart size={14} />
}];
export { FORMATS };
