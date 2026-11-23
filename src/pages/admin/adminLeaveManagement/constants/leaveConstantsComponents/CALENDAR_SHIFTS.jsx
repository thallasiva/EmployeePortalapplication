import React from "react";
import { Sun, Sunset, Moon } from "lucide-react";
const CALENDAR_SHIFTS = [{
  key: "general",
  label: "General",
  icon: <Sun size={13} />,
  color: "#e87500",
  bg: "#fff8f0",
  border: "#fed7aa"
}, {
  key: "mid",
  label: "Mid",
  icon: <Sunset size={13} />,
  color: "#e87500",
  bg: "#fff7ed",
  border: "#fed7aa"
}, {
  key: "night",
  label: "Night",
  icon: <Moon size={13} />,
  color: "#7c3aed",
  bg: "#f5f3ff",
  border: "#ddd6fe"
}];
export { CALENDAR_SHIFTS };
