import React from "react";
import { BarChart2, PieChart, TrendingUp, Users, Clock, Calendar, FileText } from "lucide-react";
const WIDGET_CATALOG = [{
  type: "kpi",
  label: "KPI Card",
  icon: <TrendingUp size={16} />,
  desc: "Single metric with trend",
  w: 1,
  h: 1
}, {
  type: "bar",
  label: "Bar Chart",
  icon: <BarChart2 size={16} />,
  desc: "Compare categories",
  w: 2,
  h: 2
}, {
  type: "pie",
  label: "Pie / Donut Chart",
  icon: <PieChart size={16} />,
  desc: "Proportion breakdown",
  w: 1,
  h: 2
}, {
  type: "line",
  label: "Line Chart",
  icon: <TrendingUp size={16} />,
  desc: "Trend over time",
  w: 2,
  h: 2
}, {
  type: "table",
  label: "Data Table",
  icon: <FileText size={16} />,
  desc: "Tabular data view",
  w: 2,
  h: 2
}, {
  type: "headcount",
  label: "Headcount",
  icon: <Users size={16} />,
  desc: "Employee count by dept",
  w: 1,
  h: 1
}, {
  type: "attendance",
  label: "Attendance %",
  icon: <Clock size={16} />,
  desc: "Today's attendance rate",
  w: 1,
  h: 1
}, {
  type: "calendar",
  label: "Event Calendar",
  icon: <Calendar size={16} />,
  desc: "Upcoming events",
  w: 2,
  h: 2
}];
export { WIDGET_CATALOG };
