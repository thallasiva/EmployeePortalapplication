import React, { useEffect, useState } from "react";
import { Search, ZoomIn, ZoomOut, RotateCcw, Network, Crown } from "lucide-react";
import { getMyTeam } from "../../../api/employee.api";
import { getLoggedInUser } from "../../../lib/dateUtils";
import "./orgChart.css";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function fullName(emp) {
  return [emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.emp_code || "—";
}

function getInitials(name) {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

// Stable color per department id (or index fallback)
const PALETTE = [
  "#6366f1", "#a855f7", "#ec4899", "#f97316",
  "#10b981", "#ef4444", "#3b82f6", "#84cc16",
  "#f59e0b", "#06b6d4",
];

function deptColor(deptId, deptIdx) {
  const idx = deptId != null ? Number(deptId) % PALETTE.length : deptIdx % PALETTE.length;
  return PALETTE[idx];
}

/* ─── OrgCard ───────────────────────────────────────────────────────────────── */
function OrgCard({ node, matched, isSelf, isManager }) {
  const color = node.color || "#94a3b8";

  return (
    <div
      className={`org-card ${matched ? "org-card--highlight" : ""}`}
      style={isSelf ? { outline: `2px solid ${color}`, outlineOffset: 2 } : undefined}
    >
      {isManager && (
        <div style={{ position: "absolute", top: 6, right: 8 }}>
          <Crown size={12} style={{ color: "#d97706" }} />
        </div>
      )}
      <div className="org-avatar" style={{ backgroundColor: `${color}1a`, color, position: "relative" }}>
        {getInitials(node.name)}
      </div>
      <p className="org-name">{node.name}</p>
      <p className="org-title">{node.title || "—"}</p>
      <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginTop: 2 }}>
        <span className="org-badge" style={{ backgroundColor: `${color}1a`, color }}>
          {node.department || "—"}
        </span>
        {isSelf && (
          <span style={{
            fontSize: 9, fontWeight: 700, background: "#dbeafe", color: "#1d4ed8",
            borderRadius: 4, padding: "1px 5px",
          }}>
            YOU
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── OrgNode ───────────────────────────────────────────────────────────────── */
function OrgNode({ node, search, selfId }) {
  const matched = !!search && node.name.toLowerCase().includes(search.trim().toLowerCase());

  return (
    <li>
      <OrgCard
        node={node}
        matched={matched}
        isSelf={node.employeeId === selfId}
        isManager={!!node.isManager}
      />
      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <OrgNode key={child.employeeId} node={child} search={search} selfId={selfId} />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ─── Legend ────────────────────────────────────────────────────────────────── */
function Legend({ items }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-4 mt-4 mb-5">
      {items.map((d) => (
        <span key={d.id} className="flex items-center gap-1.5 text-xs text-[#64748b]">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
          {d.label}
        </span>
      ))}
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────────── */
export default function OrganizationChart() {
  const currentUser = getLoggedInUser();
  const selfId = currentUser?.employeeId ?? currentUser?.employee_id;

  const [orgTree, setOrgTree]   = useState(null);
  const [legend, setLegend]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");
  const [zoom, setZoom]         = useState(100);

  useEffect(() => {
    setLoading(true);
    getMyTeam()
      .then(({ manager, teammates }) => {
        // Build a dept color map from actual dept IDs
        const deptMap = new Map(); // deptId → { label, color, idx }
        const allPeople = [...(manager ? [manager] : []), ...(teammates || [])];
        let deptIdx = 0;
        allPeople.forEach((emp) => {
          if (emp.department_id != null && !deptMap.has(emp.department_id)) {
            deptMap.set(emp.department_id, {
              label: emp.department_name || `Dept ${emp.department_id}`,
              color: deptColor(emp.department_id, deptIdx++),
            });
          }
        });

        // Build legend items
        const legendItems = [...deptMap.entries()].map(([id, v]) => ({
          id,
          label: v.label,
          color: v.color,
        }));

        // Build org tree nodes
        function toNode(emp, isManager = false) {
          const dc = deptMap.get(emp.department_id) || { color: "#94a3b8", label: emp.department_name || "—" };
          return {
            employeeId: emp.employee_id,
            name: fullName(emp),
            title: emp.emp_job_title || emp.designation_name || "—",
            department: dc.label,
            color: dc.color,
            isManager,
            children: [],
          };
        }

        if (!manager && (!teammates || teammates.length === 0)) {
          setOrgTree(null);
          setLegend(legendItems);
          return;
        }

        // Root = manager (or a placeholder if no manager)
        const root = manager
          ? toNode(manager, true)
          : {
              employeeId: null,
              name: "No Manager",
              title: "—",
              department: "—",
              color: "#94a3b8",
              isManager: true,
              children: [],
            };

        root.children = (teammates || []).map((emp) => toNode(emp));

        setOrgTree(root);
        setLegend(legendItems);
      })
      .catch((err) => setError(err?.message || "Failed to load organization chart"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-2">
          <Network size={22} className="text-[#2ea7ff]" />
          <div>
            <h1 className="text-[22px] font-semibold text-[#1f2937]">Organization Chart</h1>
            <p className="text-sm text-[#64748b]">Your team hierarchy.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              className="h-[38px] w-[220px] pl-9 pr-3 rounded-lg border border-[#dbe2ea] bg-white text-sm outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>

          <div className="flex items-center gap-1 bg-white border border-[#dbe2ea] rounded-lg h-[38px] px-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-1.5 text-[#64748b] hover:text-[#1f2937] rounded"
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-medium text-[#475569] w-10 text-center select-none">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              className="p-1.5 text-[#64748b] hover:text-[#1f2937] rounded"
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="p-1.5 text-[#64748b] hover:text-[#1f2937] rounded border-l border-[#e2e8f0] ml-1"
              aria-label="Reset zoom"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      <Legend items={legend} />

      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-auto p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#94a3b8]">
            Loading chart…
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-sm text-red-500">
            {error}
          </div>
        ) : !orgTree ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Network size={40} strokeWidth={1.2} className="text-[#cbd5e1]" />
            <p className="text-sm text-[#94a3b8]">
              No team data found. Make sure your employee profile has a reporting manager set.
            </p>
          </div>
        ) : (
          <div
            className="org-tree"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center", transition: "transform 0.15s ease" }}
          >
            <ul>
              <OrgNode node={orgTree} search={search} selfId={selfId} />
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
