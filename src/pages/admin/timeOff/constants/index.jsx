import React from "react";
import { Sun, Moon, Sunset } from "lucide-react";
export const B = "#e87500";
export const BD = "#d97000";
export const BL = "#fff8f0";
export const SHIFTS = [
  { key: "general", label: "General Shift", icon: <Sun size={15} />, color: "#e87500", bg: "#fff8f0", border: "#fed7aa" },
  { key: "mid",     label: "Mid Shift",     icon: <Sunset size={15} />, color: "#e87500", bg: "#fff7ed", border: "#fed7aa" },
  { key: "night",   label: "Night Shift",   icon: <Moon size={15} />, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
];
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const CURRENT_YEAR = new Date().getFullYear();
export const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];
export const EMPTY_FORM = {
  holiday_name: "",
  holiday_date: "",
  shift: "general",
  location: "",
  is_restricted: false,
};
