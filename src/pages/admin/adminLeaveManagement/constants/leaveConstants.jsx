import React from "react";
import { Sun, Sunset, Moon, Calendar, List, BarChart2, LayoutGrid } from "lucide-react";
export const CALENDAR_SHIFTS = [
  { key: "general", label: "General", icon: <Sun size={13} />, color: "#e87500", bg: "#fff8f0", border: "#fed7aa" },
  { key: "mid",     label: "Mid",     icon: <Sunset size={13} />, color: "#e87500", bg: "#fff7ed", border: "#fed7aa" },
  { key: "night",   label: "Night",   icon: <Moon size={13} />,   color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
];
export const B  = "#e87500";
export const BD = "#d97000";
export const BL = "#fff8f0";
export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];
export const MON  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const LEAVE_COLORS = [
  { bg: "#fff8f0", border: "#e87500", text: "#92400e" },
  { bg: "#f0fdf4", border: "#16a34a", text: "#14532d" },
  { bg: "#fff7ed", border: "#e87500", text: "#7c3d00" },
  { bg: "#f5f3ff", border: "#7c3aed", text: "#3b0764" },
  { bg: "#fff1f2", border: "#e11d48", text: "#881337" },
  { bg: "#fffbeb", border: "#d97706", text: "#78350f" },
];
export const TABS = [
  { key: "calendar", label: "Leave Calendar",  icon: <Calendar   size={15} /> },
  { key: "requests", label: "Leave Requests",  icon: <List       size={15} /> },
  { key: "balances", label: "Leave Balances",  icon: <BarChart2  size={15} /> },
  { key: "types",    label: "Leave Types",     icon: <LayoutGrid size={15} /> },
];
