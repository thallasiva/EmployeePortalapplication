import React from "react";
import { Type, Hash, Calendar, List, CheckSquare, Circle, AlignLeft, Upload, Star, ToggleLeft } from "lucide-react";
const FIELD_TYPES = [{
  type: "text",
  label: "Text Input",
  icon: <Type size={14} />,
  desc: "Single line text"
}, {
  type: "number",
  label: "Number",
  icon: <Hash size={14} />,
  desc: "Numeric input"
}, {
  type: "date",
  label: "Date",
  icon: <Calendar size={14} />,
  desc: "Date picker"
}, {
  type: "select",
  label: "Dropdown",
  icon: <List size={14} />,
  desc: "Select from list"
}, {
  type: "checkbox",
  label: "Checkbox",
  icon: <CheckSquare size={14} />,
  desc: "Multiple choice"
}, {
  type: "radio",
  label: "Radio Group",
  icon: <Circle size={14} />,
  desc: "Single choice"
}, {
  type: "textarea",
  label: "Long Text",
  icon: <AlignLeft size={14} />,
  desc: "Multi-line text"
}, {
  type: "file",
  label: "File Upload",
  icon: <Upload size={14} />,
  desc: "Upload files"
}, {
  type: "rating",
  label: "Rating",
  icon: <Star size={14} />,
  desc: "1–5 star rating"
}, {
  type: "toggle",
  label: "Yes/No",
  icon: <ToggleLeft size={14} />,
  desc: "Boolean toggle"
}];
export { FIELD_TYPES };
