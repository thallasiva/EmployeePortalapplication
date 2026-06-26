import React, { useEffect, useState, useMemo, useRef } from "react";
import { Search, ZoomIn, ZoomOut, RotateCcw, Network, ChevronUp } from "lucide-react";
import apiClient, { unwrap } from "../../../api/client";
import { getCurrentUser } from "../../../api/auth.api";
import "./orgChart.css";

/* ── helpers ─────────────────────────────────────────────────────────────── */
function fullName(e) {
  return [e.first_name, e.last_name].filter(Boolean).join(" ") || e.emp_code || "—";
}
function initials(name) {
  const p = (name || "?").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

const BRAND   = "#f18200";
const PALETTE = [
  "#f18200","#6366f1","#a855f7","#ec4899",
  "#10b981","#ef4444","#3b82f6","#84cc16",
  "#f59e0b","#06b6d4","#8b5cf6","#14b8a6",
];
function deptColor(deptId) {
  if (deptId == null) return "#94a3b8";
  return PALETTE[Number(deptId) % PALETTE.length];
}

/* ── EmpCard ─────────────────────────────────────────────────────────────── */
function EmpCard({ emp, isSelf, badge, search }) {
  const color   = deptColor(emp.department_id);
  const name    = fullName(emp);
  const matched = search && name.toLowerCase().includes(search.toLowerCase().trim());

  return (
    <div className={`org-card${matched ? " org-card--highlight" : ""}`}
      style={{
        outline:       isSelf ? `2px solid ${color}` : undefined,
        outlineOffset: 2,
        position:      "relative",
      }}>
      {/* Avatar */}
      <div className="org-avatar" style={{ background: `${color}1a`, color }}>
        {emp.profile_photo
          ? <img src={emp.profile_photo} alt={name}
              style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />
          : initials(name)}
      </div>

      <p className="org-name">{name}</p>
      <p className="org-title">{emp.emp_job_title || emp.designation_name || "—"}</p>

      <div style={{ display:"flex", gap:4, justifyContent:"center", flexWrap:"wrap", marginTop:4 }}>
        {emp.department_name && (
          <span className="org-badge" style={{ background:`${color}18`, color }}>
            {emp.department_name}
          </span>
        )}
        {isSelf && (
          <span style={{ fontSize:9, fontWeight:700, background:"#fff8f0", color:BRAND,
            border:`1px solid ${BRAND}`, borderRadius:4, padding:"1px 5px" }}>YOU</span>
        )}
        {badge && !isSelf && (
          <span style={{ fontSize:9, fontWeight:700, background:"#f5f3ff", color:"#7c3aed",
            border:"1px solid #c4b5fd", borderRadius:4, padding:"1px 5px" }}>{badge}</span>
        )}
      </div>
    </div>
  );
}

/* ── VLine ───────────────────────────────────────────────────────────────── */
function VLine({ height = 36 }) {
  return <div style={{ width:2, height, background:"#cbd5e1", margin:"0 auto" }} />;
}

/* ── AncestorChain ───────────────────────────────────────────────────────── */
/* ancestors = [CEO, ..., Director, GrandManager]  (most-senior first)       */
function AncestorChain({ ancestors, canExpandMore, onExpand, onCollapse, search }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      {/* Controls above the topmost visible ancestor */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        {canExpandMore && (
          <button onClick={onExpand}
            title="Expand one more level up"
            style={{ width:26, height:26, borderRadius:"50%",
              border:"1.5px solid #6366f1", background:"#f5f3ff",
              color:"#6366f1", fontSize:16, fontWeight:700, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>+</button>
        )}
        <button onClick={onCollapse}
          title="Collapse this level"
          style={{ width:26, height:26, borderRadius:"50%",
            border:"1.5px solid #e2e8f0", background:"#fff",
            color:"#64748b", fontSize:18, fontWeight:700, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>−</button>
      </div>

      {ancestors.map((anc, idx) => (
        <React.Fragment key={anc.employee_id}>
          <EmpCard emp={anc} search={search} />
          <VLine height={32} />
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── TeamRow ─────────────────────────────────────────────────────────────── */
/* Renders the manager → direct-reports branch using org-tree CSS              */
function TeamRow({ manager, team, selfId, search }) {
  return (
    <div className="org-tree" style={{ marginTop:0 }}>
      <ul>
        <li>
          <div style={{ position:"relative", display:"inline-block" }}>
            <EmpCard emp={manager} search={search} badge="Manager" />
          </div>

          {team.length > 0 && (
            <ul>
              {team.map(emp => (
                <li key={emp.employee_id}>
                  <EmpCard
                    emp={emp}
                    isSelf={emp.employee_id === selfId}
                    search={search}
                  />
                </li>
              ))}
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}

/* ── Self-as-root view ───────────────────────────────────────────────────── */
function SelfRootView({ self, directReports, search }) {
  return (
    <div className="org-tree">
      <ul>
        <li>
          <EmpCard emp={self} isSelf search={search} />
          {directReports.length > 0 && (
            <ul>
              {directReports.map(emp => (
                <li key={emp.employee_id}>
                  <EmpCard emp={emp} search={search} />
                </li>
              ))}
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}

/* ── Legend ──────────────────────────────────────────────────────────────── */
function Legend({ depts }) {
  if (!depts.length) return null;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"8px 18px", margin:"8px 0" }}>
      {depts.map(d => (
        <span key={d.id} style={{ display:"flex", alignItems:"center", gap:5,
          fontSize:11, color:"#64748b" }}>
          <span style={{ width:9, height:9, borderRadius:"50%",
            background:d.color, display:"inline-block", flexShrink:0 }} />
          {d.label}
        </span>
      ))}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function OrganizationChart() {
  const [flat,           setFlat]           = useState([]);
  const [selfId,         setSelfId]         = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [search,         setSearch]         = useState("");
  const [zoom,           setZoom]           = useState(100);
  const [expandedLevels, setExpandedLevels] = useState(0);

  useEffect(() => {
    Promise.all([
      apiClient.get("/employees/org-chart").then(unwrap),
      getCurrentUser().catch(() => null),
    ])
      .then(([rows, me]) => {
        setFlat(rows);
        setSelfId(me?.employeeId || me?.employee_id || null);
      })
      .catch(e => setError(e?.response?.data?.message || "Failed to load org chart"))
      .finally(() => setLoading(false));
  }, []);

  /* ── derived ── */
  const selfEmp = useMemo(
    () => flat.find(e => e.employee_id === selfId) ?? null,
    [flat, selfId]
  );

  const managerId = selfEmp?.reporting_to ?? null;

  const manager = useMemo(
    () => (managerId ? flat.find(e => e.employee_id === managerId) ?? null : null),
    [flat, managerId]
  );

  /* All direct reports of manager (includes self) */
  const team = useMemo(
    () => (managerId ? flat.filter(e => e.reporting_to === managerId) : []),
    [flat, managerId]
  );

  /* Ancestor chain above manager: [CEO, …, Director, GrandManager] */
  const ancestorChain = useMemo(() => {
    if (!manager?.reporting_to) return [];
    const chain = [];
    let currentId = manager.reporting_to;
    const visited = new Set([managerId]);
    while (currentId) {
      if (visited.has(currentId)) break;
      visited.add(currentId);
      const emp = flat.find(e => e.employee_id === currentId);
      if (!emp) break;
      chain.unshift(emp);          // prepend → chain[0] = most senior
      currentId = emp.reporting_to;
    }
    return chain;
  }, [flat, manager, managerId]);

  /* Slice from bottom: expandedLevels=1 → show last 1 → [GrandManager] */
  const visibleAncestors = ancestorChain.slice(
    Math.max(0, ancestorChain.length - expandedLevels)
  );

  const canExpandMore = expandedLevels < ancestorChain.length;

  /* Dept legend */
  const depts = useMemo(() => {
    const m = new Map();
    flat.forEach(e => {
      if (e.department_id && !m.has(e.department_id)) {
        m.set(e.department_id, {
          id:    e.department_id,
          label: e.department_name || `Dept ${e.department_id}`,
          color: deptColor(e.department_id),
        });
      }
    });
    return [...m.values()];
  }, [flat]);

  /* Direct reports of self (when user has no manager) */
  const selfDirectReports = useMemo(
    () => (selfEmp ? flat.filter(e => e.reporting_to === selfEmp.employee_id) : []),
    [flat, selfEmp]
  );

  /* ── render ── */
  return (
    <div style={{
      height:"calc(100vh - 4.25rem)", background:"#f5f7fb",
      display:"flex", flexDirection:"column", padding:"12px 16px 8px",
      overflow:"hidden",
    }}>

      {/* Header */}
      <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between",
        alignItems:"center", gap:10, marginBottom:8, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Network size={20} color={BRAND} />
          <div>
            <h1 style={{ fontSize:17, fontWeight:700, color:"#1f2937", margin:0 }}>
              Organization Chart
            </h1>
            <p style={{ fontSize:12, color:"#64748b", margin:0 }}>
              {manager
                ? `Your reporting structure under ${fullName(manager)}`
                : "Your reporting structure"}
            </p>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Search */}
          <div style={{ position:"relative" }}>
            <Search size={13} style={{ position:"absolute", left:9, top:"50%",
              transform:"translateY(-50%)", color:"#94a3b8" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search people…"
              style={{ height:32, width:190, paddingLeft:28, paddingRight:10,
                border:"1px solid #dbe2ea", borderRadius:8, fontSize:12,
                outline:"none", background:"#fff" }} />
          </div>

          {/* Zoom */}
          <div style={{ display:"flex", alignItems:"center", gap:2, background:"#fff",
            border:"1px solid #dbe2ea", borderRadius:8, height:32, padding:"0 4px" }}>
            <button onClick={() => setZoom(z => Math.max(40, z - 10))}
              style={{ background:"none", border:"none", cursor:"pointer",
                padding:4, color:"#64748b", display:"flex" }}>
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize:11, color:"#475569", minWidth:34, textAlign:"center" }}>
              {zoom}%
            </span>
            <button onClick={() => setZoom(z => Math.min(160, z + 10))}
              style={{ background:"none", border:"none", cursor:"pointer",
                padding:4, color:"#64748b", display:"flex" }}>
              <ZoomIn size={14} />
            </button>
            <button onClick={() => setZoom(100)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4,
                color:"#64748b", borderLeft:"1px solid #e2e8f0", marginLeft:2, display:"flex" }}>
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      {!loading && !error && <Legend depts={depts} />}

      {/* Chart canvas */}
      <div style={{
        flex:1, background:"#fff", border:"1px solid #e2e8f0", borderRadius:12,
        boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"auto", minHeight:0,
      }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:60,
            fontSize:14, color:"#94a3b8" }}>Loading hierarchy…</div>
        ) : error ? (
          <div style={{ display:"flex", justifyContent:"center", padding:60,
            fontSize:14, color:"#ef4444" }}>{error}</div>
        ) : !selfEmp ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
            padding:60, gap:12 }}>
            <Network size={40} strokeWidth={1.2} color="#cbd5e1" />
            <p style={{ fontSize:13, color:"#94a3b8" }}>No employee data found.</p>
          </div>
        ) : (
          <div style={{
            transform:`scale(${zoom / 100})`,
            transformOrigin:"top center",
            transition:"transform 0.15s ease",
            padding:"32px 20px 48px",
            display:"flex", flexDirection:"column", alignItems:"center",
          }}>

            {/* ── CASE A: user has no reporting manager (they ARE a root) ── */}
            {!manager ? (
              <SelfRootView
                self={selfEmp}
                directReports={selfDirectReports}
                search={search}
              />
            ) : (
              <>
                {/* ── CASE B: user has a reporting manager ── */}

                {/* 1) Ancestor chain (shown only when expanded) */}
                {visibleAncestors.length > 0 && (
                  <AncestorChain
                    ancestors={visibleAncestors}
                    canExpandMore={canExpandMore}
                    onExpand={()  => setExpandedLevels(l => Math.min(l + 1, ancestorChain.length))}
                    onCollapse={() => setExpandedLevels(l => Math.max(0, l - 1))}
                    search={search}
                  />
                )}

                {/* 2) "View Reporting Manager" button when no ancestors visible */}
                {visibleAncestors.length === 0 && ancestorChain.length > 0 && (
                  <button
                    onClick={() => setExpandedLevels(1)}
                    style={{
                      marginBottom: 12,
                      display:"flex", alignItems:"center", gap:6,
                      padding:"5px 16px", borderRadius:20,
                      border:`1.5px solid ${BRAND}`,
                      background:"#fff8f0", color:BRAND,
                      fontSize:12, fontWeight:700, cursor:"pointer",
                      boxShadow:"0 1px 3px rgba(0,0,0,0.07)",
                    }}>
                    <ChevronUp size={13} />
                    View {fullName(manager)}'s Reporting Manager
                  </button>
                )}

                {/* 3) Manager + team (always visible) */}
                <TeamRow
                  manager={manager}
                  team={team}
                  selfId={selfId}
                  search={search}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <p style={{ fontSize:10, color:"#94a3b8", textAlign:"center",
        margin:"6px 0 0", flexShrink:0 }}>
        {manager
          ? <>
              Click <strong>View Reporting Manager</strong> to navigate up ·
              Use <strong>+</strong> / <strong>−</strong> to expand or collapse the upper hierarchy
            </>
          : <>Your team is shown below your card</>}
      </p>
    </div>
  );
}
