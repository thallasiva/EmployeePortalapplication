import { FIELD_TYPES } from "./FIELD_TYPES";
const CATS = ["HR", "Payroll", "Leave", "Attendance", "Performance", "Recruitment", "General"];
let _nextId = 100;
const newField = type => {
  const def = FIELD_TYPES.find(f => f.type === type) || FIELD_TYPES[0];
  return {
    id: _nextId++,
    type,
    label: def.label,
    placeholder: "",
    required: false,
    options: ["checkbox", "radio", "select"].includes(type) ? ["Option 1", "Option 2"] : []
  };
};
/* ── Field edit panel ── */
export { CATS, _nextId, newField };
