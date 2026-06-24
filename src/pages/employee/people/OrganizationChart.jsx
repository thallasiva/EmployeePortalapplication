import React, { useEffect, useState, useRef } from "react";
import { Search, ZoomIn, ZoomOut, RotateCcw, Network, Crown } from "lucide-react";
import apiClient, { unwrap } from "../../../api/client";
import { getCurrentUser } from "../../../api/auth.api";
import "./orgChart.css";

/* ── helpers ──────────────────────────────────────────────────────────── */
function fullName(e) {
  return [e.first_name, e.last_name].filter(Boolean).join(" ") || e.emp_code || "—";
}
function initials(name) {
  const p = (name || "?").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

const PALETTE = [
  "#f18200","#6366f1","#a855f7","#ec4899",
  "#10b981","#ef4444","#3b82f6","#84cc16",
  "#f59e0b","#06b6d4","#8b5cf6","#14b8a6",
];
function deptColor(deptId) {
  if (deptId == null) return "#94a3b8";
  return PALETTE[Number(deptId) % PALETTE.length];
}

/** Convert flat employee array → nested tree.
 *  Roots = employees whose reporting_to is null OR points to an unknown id. */
function buildTree(flat) {
  const map = {};
  flat.forEach(e => {
    map[e.employee_id] = {
      ...e,
      name:       fullName(e),
      color:      deptColor(e.department_id),
      children:   [],
    };
  });

  const roots = [];
  flat.forEach(e => {
    const node = map[e.employee_id];
    if (e.reporting_to && map[e.reporting_to]) {
      map[e.reporting_to].children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort children alphabetically
  function sort(node) {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sort);
  }
  roots.forEach(sort);
  roots.sort((a, b) => a.name.localeCompare(b.name));

  // If single root, return it; if multiple, wrap in a virtual root
  if (roots.length === 1) return roots[0];
  if (roots.length === 0) return null;
  return { employee_id: "__root__", name: "Organisation", title: "", color: "#94a3b8",
           department_name: "", children: roots };
}

/* ── OrgCard ──────────────────────────────────────────────────────────── */
function OrgCard({ node, isSelf, search }) {
  const color   = node.color || "#94a3b8";
  const matched = search && node.name.toLowerCase().includes(search.toLowerCase().trim());
  const isRoot  = !node.reporting_to;
  const hasKids = node.children?.length > 0;

  return (
    <div className={`org-card${matched ? " org-card--highlight" : ""}`}
      style={{ outline: isSelf ? `2px solid ${color}` : undefined, outlineOffset: 2 }}>
      {isRoot && hasKids && (
        <div style={{ position:"absolute", top:6, right:8 }}>
          <Crown size={12} color="#d97706" />
        </div>
      )}

      {/* Avatar */}
      <div className="org-avatar" style={{ background:`${color}1a`, color }}>
        {node.profile_photo
          ? <img src={node.profile_photo} alt={node.name}
              style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />
          : initials(node.name)}
      </div>

      <p className="org-name">{node.name}</p>
      <p className="org-title">{node.emp_job_title || node.designation_name || "—"}</p>

      <div style={{ display:"flex", gap:4, justifyContent:"center", flexWrap:"wrap", marginTop:4 }}>
        {node.department_name && (
          <span className="org-badge" style={{ background:`${color}18`, color }}>
            {node.department_name}
          </span>
        )}
        {isSelf && (
          <span style={{ fontSize:9, fontWeight:700, background:"#fff8f0", color:"#f18200",
            border:"1px solid #f18200", borderRadius:4, padding:"1px 5px" }}>YOU</span>
        )}
      </div>
    </div>
  );
}

/* ── OrgNode ──────────────────────────────────────────────────────────── */
function OrgNode({ node, search, selfId }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasKids = node.children?.length > 0;
  const isSelf  = node.employee_id === selfId;

  return (
    <li>
      <div style={{ position:"relative", display:"inline-block" }}>
        <OrgCard node={node} isSelf={isSelf} search={search} />
        {hasKids && (
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Expand" : "Collapse"}
            style={{
              position:"absolute", bottom:-10, left:"50%", transform:"translateX(-50%)",
              width:20, height:20, borderRadius:"50%", border:"1px solid #e2e8f0",
              background:"#fff", color:"#94a3b8", fontSize:12, lineHeight:"18px",
              cursor:"pointer", zIndex:10, display:"flex", alignItems:"center",
              justifyContent:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.1)",
            }}>
            {collapsed ? "+" : "−"}
          </button>
        )}
      </div>

      {hasKids && !collapsed && (
        <ul>
          {node.children.map(child => (
            <OrgNode key={child.employee_id} node={child} search={search} selfId={selfId} />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ── Legend ───────────────────────────────────────────────────────────── */
function Legend({ depts }) {
  if (!depts.length) return null;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"10px 20px", margin:"12px 0 20px" }}>
      {depts.map(d => (
        <span key={d.id} style={{ display:"flex", alignItems:"center", gap:6,
          fontSize:12, color:"#64748b" }}>
          <span style={{ width:10, height:10, borderRadius:"50%",
            background:d.color, display:"inline-block" }} />
          {d.label}
        </span>
      ))}
    </div>
  );
}

/* ── Stats bar ────────────────────────────────────────────────────────── */
function StatsBar({ flat }) {
  const depts = new Set(flat.map(e => e.department_name).filter(Boolean)).size;
  const maxDepth = (() => {
    const map = {};
    flat.forEach(e => { map[e.employee_id] = e; });
    function depth(id, visited = new Set()) {
      if (!id || visited.has(id)) return 0;
      visited.add(id);
      const emp = map[id];
      return 1 + (emp?.reporting_to ? depth(emp.reporting_to, visited) : 0);
    }
    return Math.max(0, ...flat.map(e => depth(e.employee_id)));
  })();

  return (
    <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
      {[
        { label:"Total Employees", value: flat.length, color:"#f18200" },
        { label:"Departments",     value: depts,       color:"#6366f1" },
        { label:"Hierarchy Levels",value: maxDepth,    color:"#10b981" },
      ].map(s => (
        <div key={s.label} style={{ background:"#fff", border:"1px solid #e2e8f0",
          borderRadius:10, padding:"10px 18px", minWidth:130, textAlign:"center",
          boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value}</div>
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function OrganizationChart() {
  const [flat,    setFlat]    = useState([]);
  const [tree,    setTree]    = useState(null);
  const [depts,   setDepts]   = useState([]);
  const [selfId,  setSelfId]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState("");
  const [zoom,    setZoom]    = useState(100);
  const containerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      apiClient.get("/employees/org-chart").then(unwrap),
      getCurrentUser().catch(() => null),
    ]).then(([rows, me]) => {
      setFlat(rows);
      setSelfId(me?.employeeId || me?.employee_id || null);

      // Build dept legend
      const deptMap = new Map();
      rows.forEach(e => {
        if (e.department_id && !deptMap.has(e.department_id)) {
          deptMap.set(e.department_id, {
            id:    e.department_id,
            label: e.department_name || `Dept ${e.department_id}`,
            color: deptColor(e.department_id),
          });
        }
      });
      setDepts([...deptMap.values()]);
      setTree(buildTree(rows));
    })
    .catch(e => setError(e?.response?.data?.message || "Failed to load org chart"))
    .finally(() => setLoading(false));
  }, []);

  // Filter: highlight search matches (collapse unmatched branches)
  const matchedIds = search.trim()
    ? new Set(flat.filter(e => fullName(e).toLowerCase().includes(search.toLowerCase())).map(e => e.employee_id))
    : null;

  return (
    <div style={{ minHeight:"100vh", background:"#f5f7fb", padding:24 }}>
      {/* Header */}
      <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between",
        alignItems:"center", gap:16, marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Network size={22} color="#f18200" />
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, color:"#1f2937", margin:0 }}>Organization Chart</h1>
            <p style={{ fontSize:13, color:"#64748b", margin:0 }}>Full company reporting hierarchy</p>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {/* Search */}
          <div style={{ position:"relative" }}>
            <Search size={14} style={{ position:"absolute", left:10, top:"50%",
              transform:"translateY(-50%)", color:"#94a3b8" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search people…"
              style={{ height:36, width:210, paddingLeft:30, paddingRight:12,
                border:"1px solid #dbe2ea", borderRadius:8, fontSize:13,
                outline:"none", background:"#fff" }} />
          </div>

          {/* Zoom controls */}
          <div style={{ display:"flex", alignItems:"center", gap:2, background:"#fff",
            border:"1px solid #dbe2ea", borderRadius:8, height:36, padding:"0 6px" }}>
            <button onClick={() => setZoom(z => Math.max(40, z - 10))}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4,
                color:"#64748b", display:"flex" }}>
              <ZoomOut size={15} />
            </button>
            <span style={{ fontSize:12, color:"#475569", minWidth:36, textAlign:"center" }}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(160, z + 10))}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4,
                color:"#64748b", display:"flex" }}>
              <ZoomIn size={15} />
            </button>
            <button onClick={() => setZoom(100)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:4,
                color:"#64748b", borderLeft:"1px solid #e2e8f0", marginLeft:2, display:"flex" }}>
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>

      {!loading && !error && flat.length > 0 && <StatsBar flat={flat} />}
      <Legend depts={depts} />

      {/* Chart canvas */}
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12,
        boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"auto", padding:32 }}
        ref={containerRef}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:60,
            fontSize:14, color:"#94a3b8" }}>Loading hierarchy…</div>
        ) : error ? (
          <div style={{ display:"flex", justifyContent:"center", padding:60,
            fontSize:14, color:"#ef4444" }}>{error}</div>
        ) : !tree ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
            padding:60, gap:12 }}>
            <Network size={40} strokeWidth={1.2} color="#cbd5e1" />
            <p style={{ fontSize:13, color:"#94a3b8" }}>
              No employees found. Make sure employees have reporting managers set.
            </p>
          </div>
        ) : (
          <div className="org-tree"
            style={{ transform:`scale(${zoom/100})`, transformOrigin:"top center",
              transition:"transform 0.15s ease" }}>
            <ul>
              <OrgNode node={tree} search={search} selfId={selfId} />
            </ul>
          </div>
        )}
      </div>

      <p style={{ fontSize:11, color:"#94a3b8", textAlign:"center", marginTop:12 }}>
        Click <strong>−</strong> on any card to collapse that branch · <strong>+</strong> to expand
      </p>
    </div>
  );
}
