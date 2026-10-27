import { CalendarDays, ChartColumn, TrendingUp, Trophy } from "lucide-react";
export const BRAND = "#f18200";

export const CYCLE_TYPE_MAP = {
  monthly:    { label: "Monthly",     color: "#7c3aed", bg: "#f3e8ff", icon: <CalendarDays size={13} /> },
  quarterly:  { label: "Quarterly",   color: "#0369a1", bg: "#e0f2fe", icon: <ChartColumn size={13} /> },
  half_yearly:{ label: "Half-Yearly", color: "#b45309", bg: "#fef3c7", icon: <TrendingUp size={13} /> },
  yearly:     { label: "Yearly",      color: "#166534", bg: "#dcfce7", icon: <Trophy size={13} /> },
};
