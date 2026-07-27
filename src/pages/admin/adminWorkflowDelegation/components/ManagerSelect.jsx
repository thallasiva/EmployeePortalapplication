import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BL } from "../constants/tabs";

const ManagerSelect = React.memo(function ManagerSelect({
  managers,
  value,
  onChange,
  placeholder = "Search manager…",
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = managers.find((m) => m.employee_id === value);
  const filtered = useMemo(
    () =>
      managers.filter(
        (m) =>
          !q ||
          m.full_name?.toLowerCase().includes(q.toLowerCase()) ||
          m.designation_name?.toLowerCase().includes(q.toLowerCase())
      ),
    [managers, q]
  );

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={cssClass({ position: "relative" })}>
      <div
        onClick={() => setOpen((o) => !o)}
        className={cssClass({
          border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px",
          cursor: "pointer", background: "#fff", fontSize: 13,
          color: selected ? "#111827" : "#9ca3af",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        })}
      >
        <span>{selected ? selected.full_name : placeholder}</span>
        <ChevronDown size={14} color="#9ca3af" />
      </div>

      {open && (
        <div className={cssClass({
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: "#fff", border: "1px solid #d1d5db", borderRadius: 8,
          boxShadow: "0 4px 20px #0002", maxHeight: 260, overflow: "hidden",
        })}>
          <div className={cssClass({ padding: "8px 10px", borderBottom: "1px solid #f3f4f6" })}>
            <div className={cssClass({
              display: "flex", alignItems: "center", gap: 8,
              background: "#f9fafb", borderRadius: 6, padding: "6px 10px",
            })}>
              <Search size={13} color="#9ca3af" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className={cssClass({ border: "none", background: "none", outline: "none", fontSize: 13, flex: 1 })}
              />
            </div>
          </div>
          <div className={cssClass({ overflowY: "auto", maxHeight: 200 })}>
            {filtered.length === 0 ? (
              <div className={cssClass({ padding: "12px", textAlign: "center", color: "#9ca3af", fontSize: 13 })}>
                No results
              </div>
            ) : (
              filtered.map((m) => (
                <div
                  key={m.employee_id}
                  onClick={() => { onChange(m.employee_id); setOpen(false); setQ(""); }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = m.employee_id === value ? BL : "#fff")}
                  className={cssClass({
                    padding: "9px 12px", cursor: "pointer",
                    borderBottom: "1px solid #f9fafb",
                    background: m.employee_id === value ? BL : "#fff",
                  })}
                >
                  <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#111827" })}>{m.full_name}</div>
                  <div className={cssClass({ fontSize: 11, color: "#6b7280" })}>
                    {m.designation_name || "—"} {m.team_count != null ? `· ${m.team_count} reports` : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default ManagerSelect;
