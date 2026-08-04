import React, { useState, useCallback } from "react";

// ─── Colour tokens ────────────────────────────────────────────────────────────
const NAVY        = "#1e3a5f";
const AMBER       = "#d97706";
const AMBER_INACT = "#fbcd97";

const STORAGE_KEY = "salaryStructureTemplate";

function getStored() {
  try { return localStorage.getItem(STORAGE_KEY) || "1"; } catch { return "1"; }
}

// ─── Preview icon SVGs ────────────────────────────────────────────────────────
function IconTabbed({ active }) {
  const col = active ? NAVY : "#9ca3af";
  return (
    <svg width={36} height={28} viewBox="0 0 36 28" fill="none">
      {/* Tab bar */}
      <rect x={1} y={1} width={34} height={5} rx={1.5} fill={active ? AMBER : AMBER_INACT} />
      <rect x={1} y={1} width={10} height={5} rx={1.5} fill={active ? NAVY : "#d1d5db"} />
      {/* 2-column content */}
      <rect x={1} y={8} width={16} height={10} rx={1.5} fill={active ? "#e0e7f0" : "#f3f4f6"} />
      <rect x={19} y={8} width={16} height={10} rx={1.5} fill={active ? "#e0e7f0" : "#f3f4f6"} />
      {/* Summary sidebar */}
      <rect x={28} y={8} width={7} height={18} rx={1.5} fill={active ? AMBER + "55" : "#e5e7eb"} />
      {/* Lines */}
      <rect x={2} y={10} width={13} height={1} rx={0.5} fill={col} />
      <rect x={2} y={12} width={10} height={1} rx={0.5} fill={col} />
      <rect x={2} y={14} width={12} height={1} rx={0.5} fill={col} />
      <rect x={20} y={10} width={6} height={1} rx={0.5} fill={col} />
      <rect x={20} y={12} width={8} height={1} rx={0.5} fill={col} />
    </svg>
  );
}

function IconGrid({ active }) {
  const col = active ? NAVY : "#9ca3af";
  return (
    <svg width={36} height={28} viewBox="0 0 36 28" fill="none">
      {/* Header strip */}
      <rect x={1} y={1} width={34} height={4} rx={1.5} fill={active ? NAVY : "#d1d5db"} />
      {/* 5 columns */}
      {[0, 1, 2, 3, 4].map(i => (
        <rect key={i} x={1 + i * 7} y={7} width={6} height={19} rx={1} fill={active ? "#e0e7f0" : "#f3f4f6"} />
      ))}
      {/* Lines in each column */}
      {[0, 1, 2, 3, 4].map(i => (
        <React.Fragment key={i}>
          <rect x={2 + i * 7} y={9} width={4} height={1} rx={0.4} fill={col} />
          <rect x={2 + i * 7} y={11} width={3} height={1} rx={0.4} fill={col} />
          <rect x={2 + i * 7} y={13} width={4} height={1} rx={0.4} fill={col} />
        </React.Fragment>
      ))}
      {/* Summary on far right (overlap last col) */}
      <rect x={29} y={7} width={6} height={19} rx={1} fill={active ? AMBER + "55" : "#e5e7eb"} />
    </svg>
  );
}

function IconWizard({ active }) {
  const col = active ? NAVY : "#9ca3af";
  return (
    <svg width={36} height={28} viewBox="0 0 36 28" fill="none">
      {/* Step circles */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <circle key={i} cx={3 + i * 6} cy={4} r={2}
          fill={i === 0 ? AMBER : i < 2 ? "#22c55e" : (active ? "#e0e7f0" : "#e5e7eb")} />
      ))}
      {/* Connectors */}
      {[0, 1, 2, 3, 4].map(i => (
        <rect key={i} x={5 + i * 6} y={3.5} width={2} height={1} rx={0.3}
          fill={i < 1 ? "#22c55e" : (active ? "#d1d5db" : "#e5e7eb")} />
      ))}
      {/* Left sidebar */}
      <rect x={1} y={8} width={7} height={18} rx={1.5} fill={active ? "#e0e7f0" : "#f3f4f6"} />
      <rect x={2} y={10} width={5} height={1} rx={0.4} fill={col} />
      <rect x={2} y={12} width={4} height={1} rx={0.4} fill={col} />
      <rect x={2} y={14} width={5} height={1} rx={0.4} fill={col} />
      {/* Main content */}
      <rect x={10} y={8} width={16} height={18} rx={1.5} fill={active ? "#e0e7f0" : "#f3f4f6"} />
      <rect x={11} y={10} width={14} height={2} rx={0.5} fill={active ? NAVY + "33" : "#e5e7eb"} />
      <rect x={11} y={13} width={12} height={1} rx={0.4} fill={col} />
      <rect x={11} y={15} width={10} height={1} rx={0.4} fill={col} />
      <rect x={11} y={17} width={11} height={1} rx={0.4} fill={col} />
      {/* Right sidebar */}
      <rect x={28} y={8} width={7} height={18} rx={1.5} fill={active ? AMBER + "55" : "#e5e7eb"} />
    </svg>
  );
}

const TEMPLATES = [
  { id: "1", label: "Tabbed",      Icon: IconTabbed  },
  { id: "2", label: "Grid",        Icon: IconGrid    },
  { id: "3", label: "Wizard",      Icon: IconWizard  },
];

// ─── TemplateToggle component ─────────────────────────────────────────────────
const TemplateToggle = React.memo(function TemplateToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
      {TEMPLATES.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            title={`Template ${id}: ${label}`}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md transition-all"
            style={active
              ? { backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: `1.5px solid ${AMBER}` }
              : { border: "1.5px solid transparent" }}
          >
            <Icon active={active} />
            <span className="text-[9px] font-semibold leading-none"
              style={{ color: active ? NAVY : "#9ca3af" }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
});

// ─── Hook for reading/writing template preference ─────────────────────────────
export function useTemplatePreference() {
  const [template, setTemplateState] = useState(getStored);

  const setTemplate = useCallback((id) => {
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
    setTemplateState(id);
  }, []);

  return [template, setTemplate];
}

export default TemplateToggle;
