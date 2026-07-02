import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getOrgStats, getOrgTree, getUnassigned, getManagers,
  getManagerDetails, searchOrg, assignManager, bulkAssign,
  transferManager, listDelegations, createDelegation,
  cancelDelegation, getReportingHistory } from
"../../api/orgHierarchy.api";
import { errorToast, successToast } from "../../utils/ToastControllers";
import {
  Users, GitBranch, AlertTriangle, Search, RefreshCw,
  ChevronRight, ChevronDown, UserCheck, ArrowRight,
  Calendar, Clock, X, Check, Info, BarChart2,
  Building, Briefcase, Mail, Phone, Eye, UserPlus,
  ArrowRightLeft, Shield, History, Filter, Download } from
"lucide-react";import { cssClass, joinClasses } from "../../utils/classStyles";

const BRAND = "#f18200";
const BL = "#fff8f0";
const TABS = [
{ key: "overview", label: "Overview", icon: BarChart2 },
{ key: "hierarchy", label: "Org Hierarchy", icon: GitBranch },
{ key: "unassigned", label: "Unassigned", icon: AlertTriangle },
{ key: "transfer", label: "Manager Transfer", icon: ArrowRightLeft },
{ key: "delegation", label: "Delegation", icon: Shield },
{ key: "history", label: "Audit History", icon: History }];


/* ── helpers ── */
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const statusColor = (s) => {
  if (!s) return { bg: "#f3f4f6", color: "#6b7280" };
  const m = { Active: { bg: "#dcfce7", color: "#16a34a" }, Inactive: { bg: "#fee2e2", color: "#dc2626" },
    Resigned: { bg: "#fef3c7", color: "#d97706" }, Terminated: { bg: "#fee2e2", color: "#dc2626" } };
  return m[s] || { bg: "#f3f4f6", color: "#6b7280" };
};
const nodeColor = (node) => {
  if (node.status === "Inactive" || node.status === "Resigned") return "#6b7280";
  if (node.delegate_name) return "#d97706";
  if (node.direct_count > 0) return "#16a34a";
  return "#3b82f6";
};

/* ── Summary Card ── */
function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px",
      display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 160 })}>
      <div className={cssClass({ width: 44, height: 44, borderRadius: 10, background: color + "18",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 })}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div className={cssClass({ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1 })}>{value ?? "—"}</div>
        <div className={cssClass({ fontSize: 12, color: "#6b7280", marginTop: 3 })}>{label}</div>
        {sub && <div className={cssClass({ fontSize: 11, color: color, marginTop: 2, fontWeight: 600 })}>{sub}</div>}
      </div>
    </div>);

}

/* ── Org Tree Node ── */
function TreeNode({ node, depth = 0, onSelect }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const color = nodeColor(node);

  return (
    <div className={cssClass({ marginLeft: depth === 0 ? 0 : 20 })}>
      <div



        onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"} className={cssClass({ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: "transparent", transition: "background .15s" })}>
        
        {/* expand/collapse */}
        <button



          onClick={() => hasChildren && setOpen((o) => !o)} className={cssClass({ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", cursor: hasChildren ? "pointer" : "default", color: hasChildren ? "#6b7280" : "transparent", padding: 0, flexShrink: 0 })}>
          
          {hasChildren ? open ? <ChevronDown size={14} /> : <ChevronRight size={14} /> : null}
        </button>

        {/* avatar */}
        <div className={cssClass({ width: 30, height: 30, borderRadius: "50%", background: color + "20",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color, flexShrink: 0 })}>
          {node.name?.[0] || "?"}
        </div>

        {/* info */}
        <div className={cssClass({ flex: 1, minWidth: 0 })}>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 6 })}>
            <span className={cssClass({ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 })}>{node.name}</span>
            {node.delegate_name &&
            <span className={cssClass({ fontSize: 10, background: "#fef3c7", color: "#92400e", borderRadius: 4,
              padding: "1px 5px", fontWeight: 600, whiteSpace: "nowrap" })}>
                🟡 Delegated → {node.delegate_name}
              </span>
            }
            {node.status === "Inactive" &&
            <span className={cssClass({ fontSize: 10, background: "#f3f4f6", color: "#6b7280", borderRadius: 4, padding: "1px 5px" })}>⚫ Inactive</span>
            }
          </div>
          <div className={cssClass({ fontSize: 11, color: "#6b7280", marginTop: 1 })}>
            {node.designation} {node.department ? `· ${node.department}` : ""}
            {node.direct_count > 0 && <span className={cssClass({ marginLeft: 6, color: "#16a34a", fontWeight: 600 })}>({node.direct_count} reports)</span>}
          </div>
        </div>

        {/* view button */}
        <button
          onClick={() => onSelect(node)} className={cssClass(
            { flexShrink: 0, background: "none", border: "1px solid #e5e7eb", borderRadius: 6,
              padding: "3px 8px", cursor: "pointer", fontSize: 11, color: "#6b7280",
              display: "flex", alignItems: "center", gap: 4 })}>
          
          <Eye size={12} /> View
        </button>
      </div>

      {hasChildren && open &&
      <div className={cssClass({ borderLeft: "2px solid #e5e7eb", marginLeft: 26, paddingLeft: 4 })}>
          {node.children.map((child) =>
        <TreeNode key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
        )}
        </div>
      }
    </div>);

}

/* ── SVG Org Chart ── */
const CHART = { NW: 172, NH: 60, HGAP: 60, VGAP: 16 };
const TOGGLE_R = 10; // radius of the expand/collapse badge

function placeNodes(node, depth, counter, flat, edges) {
  const item = {
    id: node.id, name: node.name, designation: node.designation,
    department: node.department, status: node.status,
    direct_count: node.direct_count || 0,
    delegate_name: node.delegate_name || null,
    depth, y: 0
  };
  flat.push(item);
  const kids = node.children || [];
  if (kids.length === 0) {
    item.y = counter.v;
    counter.v += CHART.NH + CHART.VGAP;
  } else {
    const startY = counter.v;
    kids.forEach((child) => {
      edges.push({ fromId: node.id, toId: child.id });
      placeNodes(child, depth + 1, counter, flat, edges);
    });
    item.y = (startY + counter.v - CHART.VGAP - CHART.NH) / 2;
  }
}

/* Collect all node IDs that have children in the full (unfiltered) tree */
function collectHasChildren(node, map = {}) {
  const kids = node.children || [];
  map[node.id] = kids.length > 0;
  kids.forEach((c) => collectHasChildren(c, map));
  return map;
}

/* Clone tree, removing children of collapsed nodes */
function applyCollapse(node, collapsed) {
  const kids = collapsed.has(node.id) ? [] : (node.children || []).map((c) => applyCollapse(c, collapsed));
  return { ...node, children: kids };
}

function OrgChart({ nodes, onSelect, highlightIds = new Set() }) {
  const [collapsed, setCollapsed] = React.useState(new Set());

  /* Which nodes originally have children — must be before any early return */
  const hasKids = React.useMemo(() => {
    const map = {};
    (nodes || []).forEach((root) => collectHasChildren(root, map));
    return map;
  }, [nodes]);

  /* Early return AFTER all hooks */
  if (!nodes || nodes.length === 0) return null;

  const toggle = (e, id) => {
    e.stopPropagation();
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* Build filtered tree & layout */
  const filtered = nodes.map((r) => applyCollapse(r, collapsed));
  const flat = [],edges = [],counter = { v: 0 };
  filtered.forEach((root) => placeNodes(root, 0, counter, flat, edges));

  const byId = {};
  flat.forEach((n) => {byId[n.id] = n;});

  const maxDepth = Math.max(...flat.map((n) => n.depth), 0);
  const svgW = (maxDepth + 1) * (CHART.NW + CHART.HGAP) + 30;
  const svgH = counter.v + TOGGLE_R * 2 + 20;

  const nx = (d) => d * (CHART.NW + CHART.HGAP) + 14;
  const ny = (item) => item.y + 14;
  const ncx = (item) => nx(item.depth) + CHART.NW / 2;
  const ncy = (item) => ny(item) + CHART.NH;

  const boxColor = (item) => {
    if (item.status === 'Inactive') return '#9ca3af';
    if (item.depth === 0) return '#1e40af';
    if (item.direct_count > 0) return '#0284c7';
    if (item.delegate_name) return '#d97706';
    return '#38bdf8';
  };

  return (
    <div className={cssClass({ overflowX: 'auto', overflowY: 'visible' })}>
      <svg width={svgW} height={svgH} className={cssClass({ display: 'block', minWidth: svgW })}>

        {/* ── Connector lines ── */}
        {edges.map((e, i) => {
          const f = byId[e.fromId];const t = byId[e.toId];
          if (!f || !t) return null;
          /* line starts from right-centre of parent box */
          const x1 = nx(f.depth) + CHART.NW;
          const y1 = ny(f) + CHART.NH / 2;
          const x2 = nx(t.depth);
          const y2 = ny(t) + CHART.NH / 2;
          const mx = (x1 + x2) / 2;
          return (
            <path key={i} d={`M${x1},${y1} H${mx} V${y2} H${x2}`}
            fill="none" stroke="#93c5fd" strokeWidth={1.5} strokeLinecap="round" />);

        })}

        {/* ── Node boxes ── */}
        {flat.map((item, i) => {
          const x = nx(item.depth);
          const y = ny(item);
          const bg = boxColor(item);
          const isCollapsed = collapsed.has(item.id);
          const showToggle = hasKids[item.id];
          const isHighlighted = highlightIds.has(item.id);
          const label = item.name.length > 20 ? item.name.slice(0, 19) + '…' : item.name;
          const desig = (item.designation || '').length > 23 ?
          item.designation.slice(0, 22) + '…' : item.designation || '—';

          return (
            <g key={item.id}>
              {/* Highlight glow ring (orange) */}
              {isHighlighted &&
              <rect x={x - 4} y={y - 4} width={CHART.NW + 8} height={CHART.NH + 8}
              rx={11} fill="none" stroke="#f18200" strokeWidth={3} opacity={0.9} />
              }
              {/* Clickable box → open detail modal */}
              <g onClick={() => onSelect && onSelect(item)} className={cssClass({ cursor: 'pointer' })}>
                {/* Drop shadow */}
                <rect x={x + 2} y={y + 2} width={CHART.NW} height={CHART.NH} rx={8} fill="#00000015" />
                {/* Main box */}
                <rect x={x} y={y} width={CHART.NW} height={CHART.NH} rx={8}
                fill={isHighlighted ? '#f18200' : bg} />
                {/* Name */}
                <text x={x + CHART.NW / 2} y={y + 24}
                textAnchor="middle" fill="white" fontSize={12} fontWeight="700" className={cssClass(
                  { fontFamily: 'system-ui,sans-serif', pointerEvents: 'none' })}>
                  {label}
                </text>
                {/* Designation */}
                <text x={x + CHART.NW / 2} y={y + 40}
                textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={10} className={cssClass(
                  { fontFamily: 'system-ui,sans-serif', pointerEvents: 'none' })}>
                  {desig}
                </text>
                {/* Report count chip */}
                {item.direct_count > 0 &&
                <>
                    <rect x={x + CHART.NW - 34} y={y + CHART.NH - 18} width={30} height={14}
                  rx={7} fill="rgba(255,255,255,0.22)" />
                    <text x={x + CHART.NW - 19} y={y + CHART.NH - 7}
                  textAnchor="middle" fill="white" fontSize={9} className={cssClass(
                    { fontFamily: 'system-ui,sans-serif', pointerEvents: 'none' })}>
                      {item.direct_count} rpts
                    </text>
                  </>
                }
              </g>

              {/* ── Toggle button (brand orange #f18200) ── */}
              {showToggle &&
              <g onClick={(e) => toggle(e, item.id)} className={cssClass({ cursor: 'pointer' })}>
                  {/* Orange circle badge at bottom-centre of box */}
                  <circle cx={ncx(item)} cy={ncy(item) + TOGGLE_R} r={TOGGLE_R}
                fill="#f18200" stroke="white" strokeWidth={1.5} />
                  <text x={ncx(item)} y={ncy(item) + TOGGLE_R + 4}
                textAnchor="middle" fill="white" fontSize={13} fontWeight="900" className={cssClass(
                  { fontFamily: 'system-ui,sans-serif', pointerEvents: 'none', userSelect: 'none' })}>
                    {isCollapsed ? '+' : '−'}
                  </text>
                </g>
              }
            </g>);

        })}
      </svg>
    </div>);

}

/* ── Searchable Dropdown ── */
function ManagerSelect({ managers, value, onChange, placeholder = "Search manager…" }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = managers.find((m) => m.employee_id === value);
  const filtered = useMemo(() =>
  managers.filter((m) => !q || m.full_name?.toLowerCase().includes(q.toLowerCase()) ||
  m.designation_name?.toLowerCase().includes(q.toLowerCase())), [managers, q]);

  useEffect(() => {
    const handler = (e) => {if (ref.current && !ref.current.contains(e.target)) setOpen(false);};
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={cssClass({ position: "relative" })}>
      <div
        onClick={() => setOpen((o) => !o)} className={cssClass(
          { border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", cursor: "pointer",
            background: "#fff", fontSize: 13, color: selected ? "#111827" : "#9ca3af",
            display: "flex", alignItems: "center", justifyContent: "space-between" })}>
        
        <span>{selected ? selected.full_name : placeholder}</span>
        <ChevronDown size={14} color="#9ca3af" />
      </div>
      {open &&
      <div className={cssClass({ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
        background: "#fff", border: "1px solid #d1d5db", borderRadius: 8, boxShadow: "0 4px 20px #0002", maxHeight: 260, overflow: "hidden" })}>
          <div className={cssClass({ padding: "8px 10px", borderBottom: "1px solid #f3f4f6" })}>
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb",
            borderRadius: 6, padding: "6px 10px" })}>
              <Search size={13} color="#9ca3af" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}

            placeholder="Search…" className={cssClass({ border: "none", background: "none", outline: "none", fontSize: 13, flex: 1 })} />
            </div>
          </div>
          <div className={cssClass({ overflowY: "auto", maxHeight: 200 })}>
            {filtered.length === 0 ?
          <div className={cssClass({ padding: "12px", textAlign: "center", color: "#9ca3af", fontSize: 13 })}>No results</div> :
          filtered.map((m) =>
          <div key={m.employee_id}
          onClick={() => {onChange(m.employee_id);setOpen(false);setQ("");}}


          onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
          onMouseLeave={(e) => e.currentTarget.style.background = m.employee_id === value ? BL : "#fff"} className={cssClass({ padding: "9px 12px", cursor: "pointer", borderBottom: "1px solid #f9fafb", background: m.employee_id === value ? BL : "#fff" })}>
            
                <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#111827" })}>{m.full_name}</div>
                <div className={cssClass({ fontSize: 11, color: "#6b7280" })}>
                  {m.designation_name || "—"} {m.team_count != null ? `· ${m.team_count} reports` : ""}
                </div>
              </div>
          )}
          </div>
        </div>
      }
    </div>);

}

/* ── Manager Detail Modal ── */
function ManagerDetailModal({ managerId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!managerId) return;
    setLoading(true);
    getManagerDetails(managerId).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [managerId]);

  if (!managerId) return null;

  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "#0006", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20 })}>
      <div className={cssClass({ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 700,
        maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px #0003" })}>
        <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid #e5e7eb" })}>
          <div className={cssClass({ fontSize: 18, fontWeight: 700, color: "#111827" })}>Manager Details</div>
          <button onClick={onClose} className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#6b7280" })}>
            <X size={20} />
          </button>
        </div>

        <div className={cssClass({ padding: "24px" })}>
          {loading ?
          <div className={cssClass({ textAlign: "center", padding: 40, color: "#9ca3af" })}>Loading…</div> :
          !data ?
          <div className={cssClass({ textAlign: "center", padding: 40, color: "#9ca3af" })}>Not found</div> :

          <>
              {/* Profile header */}
              <div className={cssClass({ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 24 })}>
                <div className={cssClass({ width: 56, height: 56, borderRadius: "50%", background: BRAND + "20",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 800, color: BRAND, flexShrink: 0 })}>
                  {data.full_name?.[0] || "?"}
                </div>
                <div className={cssClass({ flex: 1 })}>
                  <div className={cssClass({ fontSize: 20, fontWeight: 700, color: "#111827" })}>{data.full_name}</div>
                  <div className={cssClass({ fontSize: 13, color: "#6b7280", marginTop: 2 })}>{data.designation_name} · {data.department_name}</div>
                  <div className={cssClass({ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" })}>
                    <span className={cssClass({ ...statusColor(data.employee_status), borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 })}>
                      {data.employee_status}
                    </span>
                    <span className={cssClass({ background: "#eff6ff", color: "#2563eb", borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 })}>
                      {data.direct_reports?.length || 0} Direct · {data.indirect_reports?.length || 0} Indirect
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className={cssClass({ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" })}>
                <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" })}>
                  <Mail size={14} color={BRAND} /> {data.email || "—"}
                </div>
                <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" })}>
                  <Calendar size={14} color={BRAND} /> Joined {fmtDate(data.emp_joining_date)}
                </div>
              </div>

              {/* Team */}
              {data.direct_reports?.length > 0 &&
            <div>
                  <div className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 })}>
                    Direct Reports ({data.direct_reports.length})
                  </div>
                  <div className={cssClass({ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" })}>
                    <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
                      <thead>
                        <tr className={cssClass({ background: "#f9fafb" })}>
                          <th className={cssClass({ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 11, textTransform: "uppercase" })}>Name</th>
                          <th className={cssClass({ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 11, textTransform: "uppercase" })}>Designation</th>
                          <th className={cssClass({ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 11, textTransform: "uppercase" })}>Joined</th>
                          <th className={cssClass({ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 11, textTransform: "uppercase" })}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.direct_reports.map((e, i) =>
                    <tr key={e.employee_id} className={cssClass({ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" })}>
                            <td className={cssClass({ padding: "10px 14px", fontWeight: 600, color: "#111827" })}>{e.full_name}</td>
                            <td className={cssClass({ padding: "10px 14px", color: "#6b7280" })}>{e.designation_name || "—"}</td>
                            <td className={cssClass({ padding: "10px 14px", color: "#6b7280" })}>{fmtDate(e.emp_joining_date)}</td>
                            <td className={cssClass({ padding: "10px 14px" })}>
                              <span className={cssClass({ ...statusColor(e.employee_status), borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>
                                {e.employee_status}
                              </span>
                            </td>
                          </tr>
                    )}
                      </tbody>
                    </table>
                  </div>
                </div>
            }
            </>
          }
        </div>
      </div>
    </div>);

}

/* ══════════════════════════════════════════
   Main Page
══════════════════════════════════════════ */
export default function AdminWorkflowDelegation() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [tree, setTree] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [managers, setManagers] = useState([]);
  const [delegations, setDelegations] = useState([]);
  const [history, setHistory] = useState([]);
  const [histTotal, setHistTotal] = useState(0);
  const [histPage, setHistPage] = useState(1);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [treeSearch, setTreeSearch] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightIds, setHighlightIds] = useState(new Set());
  const [focusedPath, setFocusedPath] = useState(null); // { main, manager, employee } — focused mini-view
  const [loading, setLoading] = useState(false);

  // Unassigned assignment state
  const [assignMap, setAssignMap] = useState({}); // { empId: managerId }
  const [saving, setSaving] = useState({});

  // Bulk assign
  const [bulkSelected, setBulkSelected] = useState([]);
  const [bulkManager, setBulkManager] = useState(null);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Transfer
  const [xferOldMgr, setXferOldMgr] = useState(null);
  const [xferNewMgr, setXferNewMgr] = useState(null);
  const [xferReason, setXferReason] = useState("");
  const [xferTeam, setXferTeam] = useState([]);
  const [xferSaving, setXferSaving] = useState(false);

  // Delegation
  const [delForm, setDelForm] = useState({
    employee_id: null, delegate_employee_id: null,
    module: "all", from_date: "", to_date: "", reason: ""
  });
  const [delSaving, setDelSaving] = useState(false);

  // Dept filter for tree
  const [deptFilter, setDeptFilter] = useState("");

  // Load everything
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, u, d] = await Promise.all([
      getOrgStats(), getManagers(), getUnassigned(), listDelegations()]
      );
      setStats(s);
      setManagers(Array.isArray(m) ? m : []);
      setUnassigned(Array.isArray(u) ? u : []);
      setDelegations(Array.isArray(d) ? d : []);
    } catch {/* ignore */}
    setLoading(false);
  }, []);

  const loadTree = useCallback(async () => {
    try {
      const t = await getOrgTree(deptFilter ? { department_id: deptFilter } : {});
      setTree(Array.isArray(t) ? t : []);
    } catch (e) {
      errorToast("Could not load hierarchy: " + (e?.response?.data?.message || e.message));
      setTree([]);
    }
  }, [deptFilter]);

  const loadHistory = useCallback(async () => {
    const r = await getReportingHistory({ page: histPage, limit: 50 });
    setHistory(Array.isArray(r) ? r : []);
  }, [histPage]);

  useEffect(() => {loadAll();}, [loadAll]);
  // Load tree for both overview and hierarchy tabs
  useEffect(() => {
    if (activeTab === "overview" || activeTab === "hierarchy") loadTree();
  }, [activeTab, loadTree]);
  useEffect(() => {if (activeTab === "history") loadHistory();}, [activeTab, loadHistory]);

  // Search
  useEffect(() => {
    if (!searchQ.trim()) {setSearchResults([]);return;}
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await searchOrg({ q: searchQ });
        setSearchResults(Array.isArray(r) ? r : []);
      } catch {/**/}
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQ]);

  // When old manager changes in transfer tab, load their team
  useEffect(() => {
    if (!xferOldMgr) {setXferTeam([]);return;}
    getManagerDetails(xferOldMgr).then((d) => setXferTeam(d?.direct_reports || [])).catch(() => setXferTeam([]));
  }, [xferOldMgr]);

  /* Handlers */
  const handleAssign = async (empId) => {
    const mgr = assignMap[empId];
    if (!mgr) return;
    setSaving((s) => ({ ...s, [empId]: true }));
    try {
      await assignManager({ employee_id: empId, new_manager_id: mgr });
      successToast("Manager assigned successfully");
      setUnassigned((u) => u.filter((e) => e.employee_id !== empId));
      setStats((s) => s ? { ...s, without_manager: Math.max(0, s.without_manager - 1) } : s);
      await loadAll();
    } catch (e) {
      errorToast(e?.response?.data?.message || "Assignment failed");
    }
    setSaving((s) => {const n = { ...s };delete n[empId];return n;});
  };

  const handleBulkAssign = async () => {
    if (!bulkSelected.length || !bulkManager) return;
    setBulkSaving(true);
    try {
      const r = await bulkAssign({ employee_ids: bulkSelected, new_manager_id: bulkManager });
      successToast(`${r.transferred} employees assigned`);
      setBulkSelected([]);setBulkManager(null);
      await loadAll();
    } catch (e) {
      errorToast(e?.response?.data?.message || "Bulk assign failed");
    }
    setBulkSaving(false);
  };

  const handleTransfer = async () => {
    if (!xferOldMgr || !xferNewMgr) return;
    setXferSaving(true);
    try {
      const r = await transferManager({ old_manager_id: xferOldMgr, new_manager_id: xferNewMgr, reason: xferReason });
      successToast(`${r.transferred} employees transferred`);
      setXferOldMgr(null);setXferNewMgr(null);setXferReason("");setXferTeam([]);
      await loadAll();
    } catch (e) {
      errorToast(e?.response?.data?.message || "Transfer failed");
    }
    setXferSaving(false);
  };

  const handleCreateDelegation = async () => {
    const { employee_id, delegate_employee_id, from_date, to_date } = delForm;
    if (!employee_id || !delegate_employee_id || !from_date || !to_date) {
      errorToast("All required fields must be filled");return;
    }
    setDelSaving(true);
    try {
      await createDelegation(delForm);
      successToast("Delegation created");
      setDelForm({ employee_id: null, delegate_employee_id: null, module: "all", from_date: "", to_date: "", reason: "" });
      const d = await listDelegations();
      setDelegations(Array.isArray(d) ? d : []);
    } catch (e) {
      errorToast(e?.response?.data?.message || "Delegation failed");
    }
    setDelSaving(false);
  };

  const handleCancelDelegation = async (id) => {
    try {
      await cancelDelegation(id);
      successToast("Delegation cancelled");
      const d = await listDelegations();
      setDelegations(Array.isArray(d) ? d : []);
    } catch {
      errorToast("Could not cancel delegation");
    }
  };

  // Filter tree by search
  const filterTree = (nodes, q) => {
    if (!q) return nodes;
    const low = q.toLowerCase();
    const filterNode = (node) => {
      const match = node.name?.toLowerCase().includes(low) || node.designation?.toLowerCase().includes(low);
      const filteredChildren = (node.children || []).map(filterNode).filter(Boolean);
      if (match || filteredChildren.length > 0) return { ...node, children: filteredChildren };
      return null;
    };
    return nodes.map(filterNode).filter(Boolean);
  };

  const visibleTree = useMemo(() => filterTree(tree, treeSearch), [tree, treeSearch]);

  /* ── Legend dot ── */
  const Dot = ({ color, label }) =>
  <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" })}>
      <div className={cssClass({ width: 10, height: 10, borderRadius: "50%", background: color })} />
      {label}
    </div>;


  const SectionHead = ({ children }) =>
  <div className={cssClass({ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16 })}>{children}</div>;


  const Input = ({ style, ...props }) =>
  <input
    {...props} className={cssClass({ border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", ...style })} />;


  const Btn = ({ children, onClick, disabled, variant = "primary", style: s = {} }) =>
  <button onClick={onClick} disabled={disabled} className={cssClass(
    {
      background: variant === "primary" ? BRAND : variant === "danger" ? "#ef4444" : "#fff",
      color: variant === "ghost" ? "#374151" : "#fff",
      border: variant === "ghost" ? "1px solid #d1d5db" : "none",
      borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
      display: "flex", alignItems: "center", gap: 6, ...s
    })}>
      {children}
    </button>;


  /* ─────────────────── RENDER TABS ─────────────────── */

  /* Shared org-chart panel */
  const renderChartPanel = (searchVal, onSearchChange, hlIds = highlightIds) =>
  <div className={cssClass({ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" })}>
      {/* Header */}
      <div className={cssClass({ padding: "14px 16px", borderBottom: "1px solid #f3f4f6",
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 })}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
          <GitBranch size={16} color={BRAND} />
          <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827" })}>Organisation Chart</span>
        </div>
        <div className={cssClass({ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" })}>
          {/* Legend */}
          <div className={cssClass({ display: "flex", gap: 10 })}>
            {[["#0369a1", "Top Level"], ["#0284c7", "Manager"], ["#38bdf8", "Employee"], ["#d97706", "Delegated"], ["#9ca3af", "Inactive"]].map(([c, l]) =>
          <div key={l} className={cssClass({ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" })}>
                <div className={cssClass({ width: 10, height: 10, borderRadius: 2, background: c })} />{l}
              </div>
          )}
          </div>
          {/* Search */}
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, background: "#f9fafb",
          border: "1px solid #e5e7eb", borderRadius: 7, padding: "5px 10px" })}>
            <Search size={12} color="#9ca3af" />
            <input value={searchVal} onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search…" className={cssClass(
            { border: "none", background: "none", outline: "none", fontSize: 12, width: 120 })} />
            {searchVal &&
          <button onClick={() => onSearchChange("")} className={cssClass(
            { background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 })}>
                <X size={11} />
              </button>
          }
          </div>
        </div>
      </div>

      {/* Chart body */}
      <div className={cssClass({ padding: "16px", background: "#f8fafc", minHeight: 300 })}>
        {loading ?
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#9ca3af" })}>
            <RefreshCw size={20} className={cssClass({ animation: "spin 1s linear infinite" })} />
            <div className={cssClass({ marginTop: 8, fontSize: 13 })}>Loading chart…</div>
          </div> :
      visibleTree.length === 0 ?
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#9ca3af", fontSize: 13 })}>
            {searchVal ? "No matching employees" : "No data — restart the backend to auto-seed hierarchy"}
          </div> :

      <OrgChart nodes={visibleTree} onSelect={setSelectedNode} highlightIds={hlIds} />
      }
      </div>
    </div>;


  /* OVERVIEW */
  const renderOverview = () =>
  <div>
      {/* Stat cards */}
      <div className={cssClass({ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 })}>
        <StatCard icon={Users} label="Total Employees" value={stats?.total_employees} color="#3b82f6" />
        <StatCard icon={UserCheck} label="Total Managers" value={stats?.total_managers} color="#16a34a" />
        <StatCard icon={AlertTriangle} label="Without Manager" value={stats?.without_manager} color="#f59e0b"
      sub={stats?.without_manager > 0 ? "Needs attention" : undefined} />
        <StatCard icon={Shield} label="Active Delegations" value={stats?.delegated_workflows} color={BRAND} />
      </div>

      {/* Single full-width card: chart + Find Employee sidebar inside */}
      <div className={cssClass({ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
      overflow: "hidden", marginBottom: 16 })}>

        {/* Card header */}
        <div className={cssClass({ padding: "14px 16px", borderBottom: "1px solid #f3f4f6",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 })}>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
            <GitBranch size={16} color={BRAND} />
            <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827" })}>Organisation Chart</span>
          </div>
          <div className={cssClass({ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" })}>
            {[["#0369a1", "Top Level"], ["#0284c7", "Manager"], ["#38bdf8", "Employee"], ["#d97706", "Delegated"], ["#9ca3af", "Inactive"]].map(([c, l]) =>
          <div key={l} className={cssClass({ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" })}>
                <div className={cssClass({ width: 10, height: 10, borderRadius: 2, background: c })} />{l}
              </div>
          )}
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, background: "#f9fafb",
            border: "1px solid #e5e7eb", borderRadius: 7, padding: "5px 10px" })}>
              <Search size={12} color="#9ca3af" />
              <input value={treeSearch} onChange={(e) => setTreeSearch(e.target.value)}
            placeholder="Filter chart…" className={cssClass(
              { border: "none", background: "none", outline: "none", fontSize: 12, width: 100 })} />
              {treeSearch &&
            <button onClick={() => setTreeSearch("")} className={cssClass(
              { background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 })}>
                  <X size={11} />
                </button>
            }
            </div>
          </div>
        </div>

        {/* Card body: chart (scrollable) | Find Employee sidebar */}
        <div className={cssClass({ display: "flex", background: "#f8fafc", minHeight: 360 })}>

          {/* Chart area — flex:1 with overflow scroll, minWidth:0 prevents grid blowout */}
          <div className={cssClass({ flex: 1, minWidth: 0, overflowX: "auto", overflowY: "auto",
          maxHeight: "65vh", padding: 16 })}>
            {loading ?
          <div className={cssClass({ textAlign: "center", padding: 60, color: "#9ca3af" })}>
                <RefreshCw size={20} className={cssClass({ animation: "spin 1s linear infinite" })} />
                <div className={cssClass({ marginTop: 8, fontSize: 13 })}>Loading chart…</div>
              </div> :
          focusedPath ? (
          /* Focused path mini-view */
          <div>
                <div className={cssClass({ display: "flex", justifyContent: "flex-end", marginBottom: 12 })}>
                  <button onClick={() => setFocusedPath(null)} className={cssClass(
                { background: "none", border: "1px solid #e5e7eb", borderRadius: 7,
                  padding: "4px 10px", fontSize: 12, color: "#6b7280", cursor: "pointer" })}>
                    ✕ Show full chart
                  </button>
                </div>
                {(() => {
              const NW = 180,NH = 64,GAP = 70;
              const nodes3 = [
              focusedPath.main && focusedPath.main.id !== focusedPath.manager?.id && focusedPath.main.id !== focusedPath.employee?.id ?
              { ...focusedPath.main, role: "Main", color: "#1e40af" } : null,
              focusedPath.manager && focusedPath.manager.id !== focusedPath.employee?.id ?
              { ...focusedPath.manager, role: "Reporting Manager", color: "#0284c7" } : null,
              focusedPath.employee ?
              { ...focusedPath.employee, role: "Selected Employee", color: "#f18200" } : null].
              filter(Boolean);
              const svgW = nodes3.length * (NW + GAP) - GAP + 20;
              const svgH = NH + 80;
              return (
                <svg width={svgW} height={svgH} className={cssClass({ overflow: "visible" })}>
                      {nodes3.slice(0, -1).map((_, i) => {
                    const x1 = 10 + i * (NW + GAP) + NW;
                    const x2 = 10 + (i + 1) * (NW + GAP);
                    const y = NH / 2 + 10;
                    return (
                      <g key={i}>
                            <line x1={x1} y1={y} x2={x2} y2={y} stroke="#93c5fd" strokeWidth={2} />
                            <polygon points={`${x2},${y} ${x2 - 8},${y - 5} ${x2 - 8},${y + 5}`} fill="#93c5fd" />
                          </g>);

                  })}
                      {nodes3.map((node, i) => {
                    const x = 10 + i * (NW + GAP);
                    const y = 10;
                    const isEmployee = node.color === "#f18200";
                    return (
                      <g key={node.id}>
                            {isEmployee &&
                        <rect x={x - 4} y={y - 4} width={NW + 8} height={NH + 8} rx={11}
                        fill="none" stroke="#f18200" strokeWidth={2.5} />
                        }
                            <rect x={x + 2} y={y + 2} width={NW} height={NH} rx={8} fill="#00000012" />
                            <rect x={x} y={y} width={NW} height={NH} rx={8} fill={node.color} />
                            <text x={x + NW / 2} y={y + 26} textAnchor="middle" fill="white" fontSize={13} fontWeight="700" className={cssClass(
                          { fontFamily: "system-ui,sans-serif", pointerEvents: "none" })}>
                              {(node.name || "").length > 20 ? node.name.slice(0, 19) + "…" : node.name}
                            </text>
                            <text x={x + NW / 2} y={y + 44} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={10} className={cssClass(
                          { fontFamily: "system-ui,sans-serif", pointerEvents: "none" })}>
                              {node.role}
                            </text>
                            <text x={x + NW / 2} y={y + NH + 18} textAnchor="middle"
                        fill={isEmployee ? BRAND : "#6b7280"} fontSize={11} fontWeight={isEmployee ? 700 : 400} className={cssClass(
                          { fontFamily: "system-ui,sans-serif" })}>
                              {node.name}
                            </text>
                          </g>);

                  })}
                    </svg>);

            })()}
                {focusedPath.raw &&
            <div className={cssClass({ marginTop: 16, padding: "12px 14px", background: "#fff",
              border: "1px solid #e5e7eb", borderRadius: 10 })}>
                    <div className={cssClass({ fontSize: 13, fontWeight: 700, color: "#111827" })}>{focusedPath.raw.full_name}</div>
                    <div className={cssClass({ fontSize: 12, color: "#6b7280", marginTop: 2 })}>
                      {focusedPath.raw.designation_name || "—"} · {focusedPath.raw.department_name || "—"}
                    </div>
                    {focusedPath.manager &&
              <div className={cssClass({ marginTop: 6, fontSize: 12, color: "#374151" })}>
                        <span className={cssClass({ color: "#9ca3af" })}>Reporting to: </span>
                        <span className={cssClass({ fontWeight: 600, color: BRAND })}>{focusedPath.manager.name}</span>
                      </div>
              }
                  </div>
            }
              </div>) :
          visibleTree.length === 0 ?
          <div className={cssClass({ textAlign: "center", padding: 60, color: "#9ca3af", fontSize: 13 })}>
                {treeSearch ? "No matching employees" : "No data — restart the backend to auto-seed hierarchy"}
              </div> :

          <OrgChart nodes={visibleTree} onSelect={setSelectedNode} highlightIds={highlightIds} />
          }
          </div>

          {/* Find Employee sidebar — fixed 280px inside the same card */}
          <div className={cssClass({ width: 280, flexShrink: 0, borderLeft: "1px solid #e5e7eb",
          padding: 16, background: "#fff", display: "flex", flexDirection: "column", gap: 10 })}>
            <div className={cssClass({ fontSize: 13, fontWeight: 700, color: "#111827",
            display: "flex", alignItems: "center", gap: 8 })}>
              <Search size={15} color={BRAND} /> Find Employee
            </div>

            {/* Search input */}
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb",
            border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px" })}>
              <Search size={13} color="#9ca3af" className={cssClass({ flexShrink: 0 })} />
              <input
              value={searchQ}
              onChange={(e) => {setSearchQ(e.target.value);if (!e.target.value) {setFocusedPath(null);setSearchResults([]);}}}
              placeholder="Name, code, email…" className={cssClass(
                { border: "none", background: "none", outline: "none", fontSize: 12,
                  flex: 1, minWidth: 0 })} />
            
              {searching && <RefreshCw size={13} color={BRAND} className={cssClass({ animation: "spin 1s linear infinite", flexShrink: 0 })} />}
              {searchQ && !searching &&
            <button onClick={() => {setSearchQ("");setSearchResults([]);setFocusedPath(null);}} className={cssClass(
              { background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 })}>
                  <X size={13} />
                </button>
            }
            </div>

            {/* Results */}
            <div className={cssClass({ flex: 1, overflowY: "auto" })}>
              {searchResults.length > 0 ?
            <div className={cssClass({ display: "flex", flexDirection: "column", gap: 8 })}>
                  {searchResults.map((r) =>
              <div key={r.employee_id}
              onClick={() => {
                const path = r.hierarchy_path || [];
                setFocusedPath({
                  main: path[0] || null,
                  manager: path.length >= 2 ? path[path.length - 2] : null,
                  employee: path[path.length - 1] || { id: r.employee_id, name: r.full_name },
                  raw: r
                });
                setHighlightIds(new Set());
              }} className={cssClass(
                {
                  border: `2px solid ${focusedPath?.raw?.employee_id === r.employee_id ? BRAND : "#e5e7eb"}`,
                  borderRadius: 10, padding: "10px 12px", cursor: "pointer",
                  background: focusedPath?.raw?.employee_id === r.employee_id ? "#fff8f0" : "#fff",
                  transition: "all .15s"
                })}>
                      <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 })}>
                        <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#111827",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                          {r.full_name}
                        </div>
                        <span className={cssClass({ ...statusColor(r.employee_status), borderRadius: 5,
                    padding: "1px 6px", fontSize: 10, fontWeight: 600, flexShrink: 0 })}>
                          {r.employee_status}
                        </span>
                      </div>
                      <div className={cssClass({ fontSize: 10, color: "#6b7280", marginTop: 2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                        {r.designation_name || "—"} · {r.department_name || "—"}
                      </div>
                      <div className={cssClass({ marginTop: 4, fontSize: 10, color: BRAND, fontWeight: 600 })}>
                        Click to view hierarchy →
                      </div>
                    </div>
              )}
                </div> :
            searchQ && !searching ?
            <div className={cssClass({ textAlign: "center", padding: "14px 0", color: "#9ca3af", fontSize: 12 })}>
                  No results found
                </div> :

            <div className={cssClass({ textAlign: "center", padding: "24px 0", color: "#d1d5db" })}>
                  <Search size={28} className={cssClass({ margin: "0 auto 8px", display: "block", opacity: 0.4 })} />
                  <div className={cssClass({ fontSize: 12 })}>Search to find an employee<br />and view their hierarchy</div>
                </div>
            }
            </div>
          </div>
        </div>
      </div>

      {/* Alerts row below the chart card */}
      <div className={cssClass({ display: "flex", gap: 14, flexWrap: "wrap" })}>
        {stats?.without_manager > 0 &&
      <div className={cssClass({ flex: 1, minWidth: 240, background: "#fffbeb", border: "1px solid #fde68a",
        borderRadius: 12, padding: 14 })}>
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 })}>
              <AlertTriangle size={15} color="#f59e0b" />
              <span className={cssClass({ fontSize: 13, fontWeight: 700, color: "#92400e" })}>
                {stats.without_manager} employees without a manager
              </span>
            </div>
            <button onClick={() => setActiveTab("unassigned")} className={cssClass(
          { background: BRAND, color: "#fff", border: "none", borderRadius: 7,
            padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" })}>
              Assign Now →
            </button>
          </div>
      }

        {delegations.filter((d) => d.status === "Active").length > 0 &&
      <div className={cssClass({ flex: 1, minWidth: 240, background: "#fff8f0", border: "1px solid #fed7aa",
        borderRadius: 12, padding: 14 })}>
            <div className={cssClass({ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 10,
          display: "flex", alignItems: "center", gap: 6 })}>
              <Shield size={14} color="#d97706" /> Active Delegations
            </div>
            <div className={cssClass({ display: "flex", flexDirection: "column", gap: 8 })}>
              {delegations.filter((d) => d.status === "Active").slice(0, 4).map((d) =>
          <div key={d.id} className={cssClass({ fontSize: 12, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" })}>
                  <span className={cssClass({ fontWeight: 600, color: "#111827" })}>{d.employee_name}</span>
                  <ArrowRight size={11} color="#d97706" />
                  <span className={cssClass({ color: "#92400e" })}>{d.delegate_name}</span>
                  <span className={cssClass({ marginLeft: "auto", color: "#9ca3af", fontSize: 11, whiteSpace: "nowrap" })}>
                    until {fmtDate(d.to_date)}
                  </span>
                </div>
          )}
            </div>
          </div>
      }
      </div>
    </div>;


  /* HIERARCHY */
  const renderHierarchy = () =>
  <div>
      <div className={cssClass({ display: "flex", justifyContent: "flex-end", marginBottom: 12 })}>
        <Btn onClick={loadTree} variant="ghost" className={cssClass({ padding: "7px 14px" })}>
          <RefreshCw size={14} /> Refresh Chart
        </Btn>
      </div>
      {renderChartPanel(treeSearch, setTreeSearch)}
    </div>;


  /* UNASSIGNED */
  const renderUnassigned = () =>
  <div>
      {/* Bulk assign */}
      {unassigned.length > 0 &&
    <div className={cssClass({ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: 18, marginBottom: 20 })}>
          <div className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1d4ed8", marginBottom: 12 })}>
            Bulk Assignment
          </div>
          <div className={cssClass({ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" })}>
            <div className={cssClass({ fontSize: 13, color: "#374151" })}>
              {bulkSelected.length} selected
            </div>
            <div className={cssClass({ flex: 1, minWidth: 240 })}>
              <ManagerSelect managers={managers} value={bulkManager} onChange={setBulkManager}
          placeholder="Select manager for bulk assign…" />
            </div>
            <Btn onClick={handleBulkAssign} disabled={!bulkSelected.length || !bulkManager || bulkSaving}>
              <UserCheck size={14} /> Assign All
            </Btn>
          </div>
        </div>
    }

      <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 })}>
        <AlertTriangle size={18} color="#f59e0b" />
        <div className={cssClass({ fontSize: 16, fontWeight: 700, color: "#111827" })}>
          Employees Without Reporting Manager ({unassigned.length})
        </div>
      </div>

      {unassigned.length === 0 ?
    <div className={cssClass({ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 32, textAlign: "center" })}>
          <Check size={32} color="#16a34a" className={cssClass({ margin: "0 auto 10px" })} />
          <div className={cssClass({ fontSize: 15, fontWeight: 600, color: "#16a34a" })}>All employees have reporting managers</div>
        </div> :

    <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
          {unassigned.map((emp) =>
      <div key={emp.employee_id} className={cssClass({ background: "#fff", border: "1px solid #e5e7eb",
        borderRadius: 12, padding: "16px 18px", display: "flex", gap: 16,
        alignItems: "center", flexWrap: "wrap" })}>
              {/* Bulk select */}
              <input type="checkbox" checked={bulkSelected.includes(emp.employee_id)}
        onChange={(e) => setBulkSelected((sel) =>
        e.target.checked ? [...sel, emp.employee_id] : sel.filter((id) => id !== emp.employee_id)
        )} className={cssClass(
          { width: 16, height: 16, flexShrink: 0, cursor: "pointer" })} />

              {/* Avatar */}
              <div className={cssClass({ width: 40, height: 40, borderRadius: "50%", background: "#fee2e2",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 700, color: "#dc2626", flexShrink: 0 })}>
                {emp.full_name?.[0] || "?"}
              </div>

              <div className={cssClass({ flex: 1, minWidth: 140 })}>
                <div className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827" })}>{emp.full_name}</div>
                <div className={cssClass({ fontSize: 12, color: "#6b7280", marginTop: 2 })}>
                  {emp.designation_name || "—"} · {emp.department_name || "—"}
                </div>
                <div className={cssClass({ fontSize: 11, color: "#dc2626", marginTop: 3 })}>🔴 No reporting manager</div>
              </div>

              {/* Assign */}
              <div className={cssClass({ display: "flex", gap: 10, alignItems: "center", minWidth: 280 })}>
                <div className={cssClass({ flex: 1 })}>
                  <ManagerSelect managers={managers} value={assignMap[emp.employee_id] || null}
            onChange={(val) => setAssignMap((m) => ({ ...m, [emp.employee_id]: val }))}
            placeholder="Select manager…" />
                </div>
                <Btn onClick={() => handleAssign(emp.employee_id)}
          disabled={!assignMap[emp.employee_id] || saving[emp.employee_id]} className={cssClass(
            { padding: "9px 14px", whiteSpace: "nowrap" })}>
                  <Check size={14} /> Save
                </Btn>
              </div>
            </div>
      )}
        </div>
    }
    </div>;


  /* TRANSFER */
  const renderTransfer = () =>
  <div>
      <SectionHead>Manager Transfer</SectionHead>
      <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 })}>
        <div>
          <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
            Old Reporting Manager
          </label>
          <ManagerSelect managers={managers} value={xferOldMgr} onChange={setXferOldMgr} placeholder="Select old manager…" />
          {xferOldMgr && xferTeam.length === 0 &&
        <div className={cssClass({ fontSize: 12, color: "#9ca3af", marginTop: 6 })}>This manager has no active team members.</div>
        }
        </div>
        <div>
          <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
            New Reporting Manager
          </label>
          <ManagerSelect managers={managers.filter((m) => m.employee_id !== xferOldMgr)}
        value={xferNewMgr} onChange={setXferNewMgr} placeholder="Select new manager…" />
        </div>
      </div>

      <div className={cssClass({ marginBottom: 20 })}>
        <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>Reason</label>
        <Input value={xferReason} onChange={(e) => setXferReason(e.target.value)} placeholder="e.g. Manager resigned, restructuring…" />
      </div>

      {/* Team preview */}
      {xferTeam.length > 0 &&
    <div className={cssClass({ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18, marginBottom: 20 })}>
          <div className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 })}>
            Employees to transfer ({xferTeam.length})
          </div>
          <div className={cssClass({ display: "flex", flexDirection: "column", gap: 8 })}>
            {xferTeam.map((e) =>
        <div key={e.employee_id} className={cssClass({ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
          background: "#f9fafb", borderRadius: 8 })}>
                <div className={cssClass({ width: 30, height: 30, borderRadius: "50%", background: BRAND + "20",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: BRAND, flexShrink: 0 })}>
                  {e.full_name?.[0]}
                </div>
                <div className={cssClass({ flex: 1 })}>
                  <div className={cssClass({ fontSize: 13, fontWeight: 600, color: "#111827" })}>{e.full_name}</div>
                  <div className={cssClass({ fontSize: 11, color: "#6b7280" })}>{e.designation_name || "—"}</div>
                </div>
              </div>
        )}
          </div>
        </div>
    }

      {xferOldMgr && xferNewMgr && xferTeam.length > 0 &&
    <div className={cssClass({ background: BL, border: "1px solid #fed7aa", borderRadius: 10, padding: "14px 16px", marginBottom: 16 })}>
          <div className={cssClass({ fontSize: 13, color: "#92400e" })}>
            <strong>{xferTeam.length} employee{xferTeam.length !== 1 ? "s" : ""}</strong> will be transferred from{" "}
            <strong>{managers.find((m) => m.employee_id === xferOldMgr)?.full_name}</strong> to{" "}
            <strong>{managers.find((m) => m.employee_id === xferNewMgr)?.full_name}</strong>.
          </div>
        </div>
    }

      <Btn onClick={handleTransfer} disabled={!xferOldMgr || !xferNewMgr || !xferTeam.length || xferSaving}>
        <ArrowRightLeft size={14} />
        {xferSaving ? "Transferring…" : `Transfer ${xferTeam.length ? xferTeam.length + " " : ""}Employee${xferTeam.length !== 1 ? "s" : ""}`}
      </Btn>
    </div>;


  /* DELEGATION */
  const renderDelegation = () =>
  <div>
      {/* Create form */}
      <div className={cssClass({ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 24 })}>
        <SectionHead>Create Workflow Delegation</SectionHead>
        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 })}>
          <div>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              Delegating Employee
            </label>
            <ManagerSelect managers={managers} value={delForm.employee_id}
          onChange={(v) => setDelForm((f) => ({ ...f, employee_id: v }))} placeholder="Who is delegating?" />
          </div>
          <div>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              Delegate To
            </label>
            <ManagerSelect managers={managers.filter((m) => m.employee_id !== delForm.employee_id)}
          value={delForm.delegate_employee_id}
          onChange={(v) => setDelForm((f) => ({ ...f, delegate_employee_id: v }))} placeholder="Who will handle approvals?" />
          </div>
          <div>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>Start Date</label>
            <Input type="date" value={delForm.from_date}
          onChange={(e) => setDelForm((f) => ({ ...f, from_date: e.target.value }))} />
          </div>
          <div>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>End Date</label>
            <Input type="date" value={delForm.to_date} min={delForm.from_date}
          onChange={(e) => setDelForm((f) => ({ ...f, to_date: e.target.value }))} />
          </div>
          <div>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>Module</label>
            <select value={delForm.module} onChange={(e) => setDelForm((f) => ({ ...f, module: e.target.value }))} className={cssClass(
            { border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", fontSize: 13,
              width: "100%", outline: "none", background: "#fff" })}>
              <option value="all">All Modules</option>
              <option value="leave">Leave Approvals</option>
              <option value="timesheet">Timesheet</option>
              <option value="helpdesk">Helpdesk</option>
              <option value="appraisal">Appraisal</option>
            </select>
          </div>
          <div>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>Reason</label>
            <Input value={delForm.reason} onChange={(e) => setDelForm((f) => ({ ...f, reason: e.target.value }))}
          placeholder="e.g. Annual leave, Training…" />
          </div>
        </div>
        <Btn onClick={handleCreateDelegation} disabled={delSaving}>
          <Shield size={14} /> {delSaving ? "Creating…" : "Create Delegation"}
        </Btn>
      </div>

      {/* List */}
      <SectionHead>Active & Recent Delegations</SectionHead>
      {delegations.length === 0 ?
    <div className={cssClass({ textAlign: "center", padding: 32, color: "#9ca3af", background: "#f9fafb", borderRadius: 12 })}>
          No delegations yet
        </div> :

    <div className={cssClass({ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
            <thead>
              <tr className={cssClass({ background: "#f9fafb" })}>
                {["Employee", "Delegate To", "Module", "From", "To", "Status", ""].map((h) =>
            <th key={h} className={cssClass({ padding: "10px 14px", textAlign: "left", fontWeight: 600,
              color: "#6b7280", fontSize: 11, textTransform: "uppercase" })}>{h}</th>
            )}
              </tr>
            </thead>
            <tbody>
              {delegations.map((d, i) => {
            const sc = { Active: { bg: "#dcfce7", color: "#16a34a" },
              Expired: { bg: "#f3f4f6", color: "#6b7280" }, Cancelled: { bg: "#fee2e2", color: "#dc2626" } };
            return (
              <tr key={d.id} className={cssClass({ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" })}>
                    <td className={cssClass({ padding: "10px 14px" })}>
                      <div className={cssClass({ fontWeight: 600, color: "#111827" })}>{d.employee_name}</div>
                      <div className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{d.employee_designation}</div>
                    </td>
                    <td className={cssClass({ padding: "10px 14px", color: "#374151" })}>{d.delegate_name}</td>
                    <td className={cssClass({ padding: "10px 14px" })}>
                      <span className={cssClass({ background: "#eff6ff", color: "#2563eb", borderRadius: 5, padding: "2px 8px", fontSize: 11 })}>
                        {d.module}
                      </span>
                    </td>
                    <td className={cssClass({ padding: "10px 14px", color: "#6b7280" })}>{fmtDate(d.from_date)}</td>
                    <td className={cssClass({ padding: "10px 14px", color: "#6b7280" })}>{fmtDate(d.to_date)}</td>
                    <td className={cssClass({ padding: "10px 14px" })}>
                      <span className={cssClass({ ...(sc[d.status] || sc.Expired), borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 })}>
                        {d.status}
                      </span>
                    </td>
                    <td className={cssClass({ padding: "10px 14px" })}>
                      {d.status === "Active" &&
                  <button onClick={() => handleCancelDelegation(d.id)} className={cssClass(
                    { background: "none", border: "1px solid #d1d5db", borderRadius: 6,
                      padding: "4px 10px", cursor: "pointer", fontSize: 12, color: "#6b7280",
                      display: "flex", alignItems: "center", gap: 4 })}>
                          <X size={12} /> Cancel
                        </button>
                  }
                    </td>
                  </tr>);

          })}
            </tbody>
          </table>
        </div>
    }
    </div>;


  /* HISTORY */
  const renderHistory = () =>
  <div>
      <SectionHead>Reporting Change Audit History</SectionHead>
      {history.length === 0 ?
    <div className={cssClass({ textAlign: "center", padding: 32, color: "#9ca3af", background: "#f9fafb", borderRadius: 12 })}>
          No history yet. Changes will appear here as they happen.
        </div> :

    <div className={cssClass({ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
            <thead>
              <tr className={cssClass({ background: "#f9fafb" })}>
                {["Date", "Employee", "Old Manager", "New Manager", "Type", "Reason", "Changed By"].map((h) =>
            <th key={h} className={cssClass({ padding: "10px 14px", textAlign: "left", fontWeight: 600,
              color: "#6b7280", fontSize: 11, textTransform: "uppercase", whiteSpace: "nowrap" })}>{h}</th>
            )}
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => {
            const typeColors = {
              assign: { bg: "#dcfce7", color: "#16a34a" },
              transfer: { bg: "#dbeafe", color: "#2563eb" },
              bulk_transfer: { bg: "#ede9fe", color: "#7c3aed" },
              delegation: { bg: "#fef3c7", color: "#d97706" }
            };
            const tc = typeColors[h.change_type] || { bg: "#f3f4f6", color: "#6b7280" };
            return (
              <tr key={h.id} className={cssClass({ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" })}>
                    <td className={cssClass({ padding: "10px 14px", color: "#6b7280", whiteSpace: "nowrap" })}>
                      {fmtDate(h.created_at)}
                    </td>
                    <td className={cssClass({ padding: "10px 14px", fontWeight: 600, color: "#111827" })}>
                      {h.employee_name || "—"}
                    </td>
                    <td className={cssClass({ padding: "10px 14px", color: "#374151" })}>{h.old_manager_name || "—"}</td>
                    <td className={cssClass({ padding: "10px 14px", color: "#374151" })}>{h.new_manager_name || "—"}</td>
                    <td className={cssClass({ padding: "10px 14px" })}>
                      <span className={cssClass({ ...tc, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" })}>
                        {h.change_type?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className={cssClass({ padding: "10px 14px", color: "#6b7280", maxWidth: 180,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                      {h.reason || "—"}
                    </td>
                    <td className={cssClass({ padding: "10px 14px", color: "#374151" })}>{h.changed_by_name || "—"}</td>
                  </tr>);

          })}
            </tbody>
          </table>
        </div>
    }
    </div>;


  /* ─────────────────── MAIN RENDER ─────────────────── */
  return (
    <div className={cssClass({ padding: "24px", maxWidth: 1200, margin: "0 auto", fontFamily: "inherit" })}>
      {/* Header */}
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24, flexWrap: "wrap", gap: 12 })}>
        <div>
          <div className={cssClass({ fontSize: 22, fontWeight: 800, color: "#111827", display: "flex", alignItems: "center", gap: 10 })}>
            <GitBranch size={22} color={BRAND} />
            Workflow Delegation & Reporting Hierarchy
          </div>
          <div className={cssClass({ fontSize: 13, color: "#6b7280", marginTop: 4 })}>
            Manage reporting relationships, org hierarchy, and approval delegation
          </div>
        </div>
        <button onClick={loadAll} disabled={loading} className={cssClass(
          { display: "flex", alignItems: "center", gap: 6, background: "#fff",
            border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px",
            cursor: "pointer", fontSize: 13, color: "#374151" })}>
          <RefreshCw size={14} className={cssClass({ animation: loading ? "spin 1s linear infinite" : "none" })} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className={cssClass({ display: "flex", gap: 2, background: "#f3f4f6", borderRadius: 10, padding: 4,
        marginBottom: 24, flexWrap: "wrap" })}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          const badge = tab.key === "unassigned" && stats?.without_manager > 0 ? stats.without_manager : null;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cssClass(
              { display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 500,
                background: active ? "#fff" : "transparent",
                color: active ? BRAND : "#6b7280",
                boxShadow: active ? "0 1px 4px #0001" : "none",
                transition: "all .15s", position: "relative" })}>
              <Icon size={15} />
              {tab.label}
              {badge != null &&
              <span className={cssClass({ background: "#ef4444", color: "#fff", borderRadius: 10,
                fontSize: 10, fontWeight: 700, padding: "1px 5px", minWidth: 18, textAlign: "center" })}>
                  {badge}
                </span>
              }
            </button>);

        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "hierarchy" && renderHierarchy()}
        {activeTab === "unassigned" && renderUnassigned()}
        {activeTab === "transfer" && renderTransfer()}
        {activeTab === "delegation" && renderDelegation()}
        {activeTab === "history" && renderHistory()}
      </div>

      {/* Manager Detail Modal */}
      {selectedNode &&
      <ManagerDetailModal
        managerId={selectedNode.id}
        onClose={() => setSelectedNode(null)} />

      }

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>);

}
