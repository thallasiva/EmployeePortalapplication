import { useState, useCallback } from "react";
// ─── Colour tokens ────────────────────────────────────────────────────────────
import { IconTabbed } from "./IconTabbed";
import { IconGrid } from "./IconGrid";
import { IconWizard } from "./IconWizard";
// ─── Colour tokens ────────────────────────────────────────────────────────────

const STORAGE_KEY = "salaryStructureTemplate";
function getStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "1";
  } catch {
    return "1";
  }
}
// ─── Preview icon SVGs ────────────────────────────────────────────────────────

const TEMPLATES = [{
  id: "1",
  label: "Tabbed",
  Icon: IconTabbed
}, {
  id: "2",
  label: "Grid",
  Icon: IconGrid
}, {
  id: "3",
  label: "Wizard",
  Icon: IconWizard
}];
// ─── TemplateToggle component ─────────────────────────────────────────────────

function useTemplatePreference() {
  const [template, setTemplateState] = useState(getStored);
  const setTemplate = useCallback(id => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
    setTemplateState(id);
  }, []);
  return [template, setTemplate];
}
export { STORAGE_KEY, getStored, TEMPLATES, useTemplatePreference };
export { NAVY, AMBER, AMBER_INACT } from "./tokens";
