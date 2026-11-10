import { CalendarDays, ChartColumn, TrendingUp, Trophy } from "lucide-react";
export const BRAND = "#e87500";
export const CYCLE_TYPE_MAP = {
  monthly:    { label: "Monthly",     color: "#7c3aed", bg: "#f3e8ff", icon: <CalendarDays size={13} /> },
  quarterly:  { label: "Quarterly",   color: "#c45f00", bg: "#ffedd5", icon: <ChartColumn size={13} /> },
  half_yearly:{ label: "Half-Yearly", color: "#b45309", bg: "#fef3c7", icon: <TrendingUp size={13} /> },
  yearly:     { label: "Yearly",      color: "#166534", bg: "#dcfce7", icon: <Trophy size={13} /> },
};
