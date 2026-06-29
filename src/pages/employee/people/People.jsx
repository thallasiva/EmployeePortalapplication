import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter, Star, Mail, Phone, Briefcase, Users, MapPin, User, Crown, ChevronDown, ChevronRight } from "lucide-react";
import apiClient, { unwrap } from "../../../api/client";
import { getCurrentUser } from "../../../api/auth.api";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const STARRED_KEY = "people-starred-ids";
function loadStarred() {
  try { return JSON.parse(localStorage.getItem(STARRED_KEY) || "[]"); }
  catch { return []; }
}
function saveStarred(ids) { localStorage.setItem(STARRED_KEY, JSON.stringify(ids)); }

function fullName(emp) {
  return [emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.emp_code || "—";
}
function initials(name) {
  const p = (name || "?").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

const BRAND = "#f18200";
const PALETTE = [
  "#f18200","#6366f1","#a855f7","#ec4899",
  "#10b981","#ef4444","#3b82f6","#84cc16",
  "#f59e0b","#06b6d4","#8b5cf6","#14b8a6",
];
function deptColor(deptId) {
  if (deptId == null) return "#94a3b8";
  return PALETTE[Number(deptId) % PALETTE.length];
}

function normalize(emp, idx) {
  return {
    id:             emp.employee_id,
    empCode:        emp.emp_code || `EMP${String(emp.employee_id).padStart(3,"0")}`,
    name:           fullName(emp),
    email:          emp.email || "—",
    mobile:         emp.mobile || emp.phone || "—",
    jobTitle:       emp.emp_job_title || emp.designation_name || "—",
    reportingTo:    emp.reporting_to_name || "—",
    reportingToId:  emp.reporting_to || null,
    departmentId:   emp.department_id,
    departmentName: emp.department_name || "—",
    status:         emp.employee_status || "Active",
    gender:         emp.gender || "—",
    dob:            emp.dob || "—",
    bloodGroup:     emp.blood_group || "—",
    joiningDate:    emp.emp_joining_date || emp.joining_date || "—",
    location:       emp.location || "—",
    avatarIdx:      idx,
    color:          deptColor(emp.department_id),
  };
}

/* ─── Avatar ──────────────────────────────────────────────────────────────── */
function Avatar({ name, color, photo, size = 40 }) {
  if (photo) {
    return (
      <img src={photo} alt={name} style={{ width:size, height:size, borderRadius:"50%",
        objectFit:"cover", flexShrink:0 }} />
    );
  }
  return (
    <div style={{ width:size, height:size, borderRadius:"50%",
      background:`${color}1a`, color,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.34, fontWeight:700, flexShrink:0, userSelect:"none" }}>
      {initials(name)}
    </div>
  );
}

/* ─── sub-components ──────────────────────────────────────────────────────── */
function InfoRow({ label, value }) {
  return (
    <>
      <span style={{ fontSize:13, color:"#64748b", paddingRight:8 }}>{label}</span>
      <span style={{ fontSize:13, color:"#1e293b", fontWeight:500 }}>{value || "—"}</span>
    </>
  );
}

function SectionHead({ title }) {
  return (
    <div style={{ paddingTop:18, paddingBottom:8 }}>
      <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", color:BRAND,
        textTransform:"uppercase", margin:0 }}>{title}</p>
      <div style={{ borderTop:"1px solid #e8edf2", marginTop:6 }} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ padding:"12px 14px", borderBottom:"1px solid #f1f5f9",
      display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:36, height:36, borderRadius:"50%", background:"#f1f5f9" }} />
      <div style={{ flex:1 }}>
        <div style={{ height:11, width:"60%", background:"#f1f5f9", borderRadius:4, marginBottom:6 }} />
        <div style={{ height:10, width:"40%", background:"#f1f5f9", borderRadius:4 }} />
      </div>
    </div>
  );
}

/* ─── Department group header ─────────────────────────────────────────────── */
function DeptGroupHeader({ name, count, color, collapsed, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      style={{ width:"100%", display:"flex", alignItems:"center", gap:8,
        padding:"8px 14px", background:"#f8fafc", border:"none",
        borderBottom:"1px solid #e2e8f0", cursor:"pointer", textAlign:"left" }}>
      <span style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }} />
      <span style={{ fontSize:12, fontWeight:700, color:"#374151", flex:1 }}>{name}</span>
      <span style={{ fontSize:11, color:"#94a3b8" }}>{count}</span>
      {collapsed
        ? <ChevronRight size={13} style={{ color:"#94a3b8" }} />
        : <ChevronDown  size={13} style={{ color:"#94a3b8" }} />}
    </button>
  );
}

/* ─── main ────────────────────────────────────────────────────────────────── */
export default function People() {
  const [allEmployees, setAllEmployees] = useState([]);
  const [selfId, setSelfId]             = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const [tab, setTab]               = useState("everyone");
  const [query, setQuery]           = useState("");
  const [starredIds, setStarredIds] = useState(loadStarred);
  const [selectedId, setSelectedId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [deptFilter, setDeptFilter] = useState("all");
  const [collapsedDepts, setCollapsedDepts] = useState({});

  /* fetch ------------------------------------------------------------------- */
  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.get("/employees/org-chart").then(unwrap),
      getCurrentUser().catch(() => null),
    ])
      .then(([rows, me]) => {
        // Build reporting_to name map
        const nameMap = {};
        rows.forEach(e => { nameMap[e.employee_id] = fullName(e); });
        const normalized = rows.map((emp, idx) => ({
          ...normalize(emp, idx),
          reportingTo: emp.reporting_to ? (nameMap[emp.reporting_to] || "—") : "—",
        }));
        setAllEmployees(normalized);
        setSelfId(me?.employeeId || me?.employee_id || null);
      })
      .catch(e => setError(e?.response?.data?.message || "Failed to load employees"))
      .finally(() => setLoading(false));
  }, []);

  /* departments for filter -------------------------------------------------- */
  const departments = useMemo(() => {
    const seen = new Map();
    allEmployees.forEach(e => {
      if (e.departmentId && !seen.has(e.departmentId))
        seen.set(e.departmentId, { name: e.departmentName, color: e.color });
    });
    return [{ value:"all", label:"All Departments" },
      ...[...seen.entries()].map(([id, d]) => ({ value: String(id), label: d.name, color: d.color }))];
  }, [allEmployees]);

  /* filtered list ----------------------------------------------------------- */
  const filteredList = useMemo(() => {
    let list = tab === "starred"
      ? allEmployees.filter(p => starredIds.includes(p.id))
      : allEmployees;

    if (deptFilter !== "all")
      list = list.filter(p => String(p.departmentId) === deptFilter);

    const q = query.trim().toLowerCase();
    if (q) list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.empCode.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.departmentName.toLowerCase().includes(q)
    );

    return list;
  }, [allEmployees, tab, starredIds, deptFilter, query]);

  /* group by department ----------------------------------------------------- */
  const groupedByDept = useMemo(() => {
    const map = new Map();
    filteredList.forEach(p => {
      const key = p.departmentId ?? 0;
      if (!map.has(key)) map.set(key, { name: p.departmentName, color: p.color, people: [] });
      map.get(key).people.push(p);
    });
    // Sort each group: managers first, then alphabetically
    map.forEach(g => g.people.sort((a, b) => a.name.localeCompare(b.name)));
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredList]);

  /* auto-select ------------------------------------------------------------- */
  useEffect(() => {
    if (!filteredList.length) { setSelectedId(null); return; }
    if (!filteredList.some(p => p.id === selectedId)) {
      const self = filteredList.find(p => p.id === selfId);
      setSelectedId(self ? self.id : filteredList[0].id);
    }

  }, [filteredList, selfId, selectedId]);


  const selected = allEmployees.find(p => p.id === selectedId) ?? null;

  const toggleStar = (id) => {
    setStarredIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      saveStarred(next);
      return next;
    });
  };

  const toggleDept = (name) => {
    setCollapsedDepts(prev => ({ ...prev, [name]: !prev[name] }));
  };

  /* ── render ──────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display:"flex", flexDirection:"column",
      minHeight:"calc(100vh - 5.5rem)",
      background:"#fff", borderRadius:10,
      border:"1px solid #e2e8f0",
      overflow:"hidden", position:"relative",
      margin:"-0.5rem -0.25rem" }}>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"1px solid #e2e8f0", padding:"0 16px" }}>
        {[
          { key:"everyone", label:"All Teams" },
          { key:"starred",  label:"⭐ Starred" },
        ].map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            style={{ position:"relative", padding:"12px 16px",
              fontSize:13, fontWeight: tab===key ? 700 : 400,
              color: tab===key ? "#1e293b" : "#94a3b8",
              background:"none", border:"none", cursor:"pointer",
              transition:"color 0.15s" }}>
            {label}
            {tab === key && (
              <span style={{ position:"absolute", left:0, right:0, bottom:0,
                height:2, background:BRAND, borderRadius:"2px 2px 0 0" }} />
            )}
          </button>
        ))}

        {/* Stats */}
        {!loading && (
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:16,
            paddingRight:8, fontSize:12, color:"#94a3b8" }}>
            <span><strong style={{ color:"#1e293b" }}>{allEmployees.length}</strong> employees</span>
            <span><strong style={{ color:"#1e293b" }}>{departments.length - 1}</strong> departments</span>
          </div>
        )}
      </div>

      <div style={{ display:"flex", flex:1, minHeight:0 }}>

        {/* ── Left list ── */}
        <div style={{ width:310, flexShrink:0, borderRight:"1px solid #e2e8f0",
          display:"flex", flexDirection:"column" }}>

          {/* Search + filter */}
          <div style={{ padding:"10px 12px", borderBottom:"1px solid #f1f5f9", display:"flex", gap:8 }}>
            <div style={{ flex:1, position:"relative" }}>
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search name, code, email…"
                style={{ width:"100%", border:"1px solid #e2e8f0", borderRadius:8,
                  padding:"8px 36px 8px 12px", fontSize:13, color:"#334155",
                  outline:"none", boxSizing:"border-box" }}
                onFocus={e => { e.target.style.borderColor = BRAND; }}
                onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; }} />
              <Search size={15} style={{ position:"absolute", right:10, top:"50%",
                transform:"translateY(-50%)", color:"#94a3b8", pointerEvents:"none" }} />
            </div>
            <button type="button" onClick={() => setFilterOpen(!filterOpen)}
              style={{ width:38, height:38, flexShrink:0,
                border: filterOpen || deptFilter!=="all" ? `1px solid ${BRAND}` : "1px solid #e2e8f0",
                borderRadius:8,
                background: filterOpen || deptFilter!=="all" ? "#fff8f0" : "#fff",
                color: filterOpen || deptFilter!=="all" ? BRAND : "#64748b",
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer" }}>
              <Filter size={16} />
            </button>
          </div>

          {/* Dept filter dropdown */}
          {filterOpen && (
            <div style={{ padding:"10px 12px", borderBottom:"1px solid #f1f5f9", background:"#f8fafc" }}>
              <label style={{ fontSize:11, color:"#94a3b8", display:"block", marginBottom:4 }}>
                Filter by Department
              </label>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                style={{ width:"100%", border:"1px solid #e2e8f0", borderRadius:7,
                  padding:"7px 10px", fontSize:13, color:"#334155",
                  background:"#fff", outline:"none" }}>
                {departments.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              {deptFilter !== "all" && (
                <button type="button" onClick={() => setDeptFilter("all")}
                  style={{ fontSize:11, color:BRAND, background:"none", border:"none",
                    cursor:"pointer", marginTop:6, padding:0 }}>
                  Clear filter
                </button>
              )}
            </div>
          )}

          {/* Count */}
          {!loading && (
            <div style={{ padding:"6px 14px", fontSize:11, color:"#94a3b8",
              borderBottom:"1px solid #f8fafc" }}>
              {filteredList.length} employee{filteredList.length !== 1 ? "s" : ""}
              {deptFilter !== "all" ? " in this department" : ""}
            </div>
          )}

          {/* List */}
          <div style={{ flex:1, overflowY:"auto" }}>
            {loading ? (
              [1,2,3,4,5].map(i => <SkeletonCard key={i} />)
            ) : error ? (
              <div style={{ padding:24, textAlign:"center", color:"#ef4444", fontSize:13 }}>{error}</div>
            ) : filteredList.length === 0 ? (
              <div style={{ padding:40, textAlign:"center" }}>
                <Users size={40} strokeWidth={1.2} style={{ color:"#cbd5e1", marginBottom:8 }} />
                <p style={{ fontSize:13, color:"#94a3b8" }}>
                  {tab === "starred" ? "No starred employees yet." : "No employees found."}
                </p>
              </div>
            ) : tab === "starred" || deptFilter !== "all" || query.trim() ? (
              /* Flat list when filtering/searching */
              <ul style={{ listStyle:"none", margin:0, padding:0 }}>
                {filteredList.map(person => {
                  const active = person.id === selectedId;
                  const isSelf = person.id === selfId;
                  return (
                    <li key={person.id}>
                      <button type="button" onClick={() => setSelectedId(person.id)}
                        style={{ width:"100%", display:"flex", alignItems:"center",
                          gap:10, padding:"10px 14px", textAlign:"left",
                          background: active ? "#fff8f0" : "transparent",
                          border:"none", borderBottom:"1px solid #f8fafc",
                          borderLeft: active ? `3px solid ${BRAND}` : "3px solid transparent",
                          cursor:"pointer", transition:"background 0.12s" }}
                        onMouseEnter={e => { if(!active) e.currentTarget.style.background="#f8fafc"; }}
                        onMouseLeave={e => { if(!active) e.currentTarget.style.background="transparent"; }}>
                        <Avatar name={person.name} color={person.color} size={36} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <p style={{ fontSize:13, fontWeight: active ? 700 : 500,
                              color:"#1e293b", margin:0, overflow:"hidden",
                              textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {person.name}
                            </p>
                            {isSelf && (
                              <span style={{ fontSize:9, fontWeight:700,
                                background:"#fff8f0", color:BRAND,
                                border:`1px solid ${BRAND}`,
                                borderRadius:4, padding:"1px 5px", flexShrink:0 }}>YOU</span>
                            )}
                          </div>
                          <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>
                            {person.empCode} · {person.departmentName}
                          </p>
                        </div>
                        {starredIds.includes(person.id) && (
                          <Star size={13} style={{ color:"#fbbf24", fill:"#fbbf24", flexShrink:0 }} />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              /* Grouped by department */
              groupedByDept.map(group => {
                const collapsed = !!collapsedDepts[group.name];
                return (
                  <div key={group.name}>
                    <DeptGroupHeader
                      name={group.name}
                      count={group.people.length}
                      color={group.color}
                      collapsed={collapsed}
                      onToggle={() => toggleDept(group.name)}
                    />
                    {!collapsed && (
                      <ul style={{ listStyle:"none", margin:0, padding:0 }}>
                        {group.people.map(person => {
                          const active = person.id === selectedId;
                          const isSelf = person.id === selfId;
                          return (
                            <li key={person.id}>
                              <button type="button" onClick={() => setSelectedId(person.id)}
                                style={{ width:"100%", display:"flex", alignItems:"center",
                                  gap:10, padding:"8px 14px 8px 18px", textAlign:"left",
                                  background: active ? "#fff8f0" : "transparent",
                                  border:"none", borderBottom:"1px solid #f8fafc",
                                  borderLeft: active ? `3px solid ${BRAND}` : "3px solid transparent",
                                  cursor:"pointer", transition:"background 0.12s" }}
                                onMouseEnter={e => { if(!active) e.currentTarget.style.background="#f8fafc"; }}
                                onMouseLeave={e => { if(!active) e.currentTarget.style.background="transparent"; }}>
                                <Avatar name={person.name} color={person.color} size={32} />
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                    <p style={{ fontSize:12, fontWeight: active ? 700 : 500,
                                      color:"#1e293b", margin:0, overflow:"hidden",
                                      textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                      {person.name}
                                    </p>
                                    {isSelf && (
                                      <span style={{ fontSize:9, fontWeight:700,
                                        background:"#fff8f0", color:BRAND,
                                        border:`1px solid ${BRAND}`,
                                        borderRadius:4, padding:"1px 5px", flexShrink:0 }}>YOU</span>
                                    )}
                                  </div>
                                  <p style={{ fontSize:11, color:"#94a3b8", margin:0,
                                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                    {person.jobTitle}
                                  </p>
                                </div>
                                {starredIds.includes(person.id) && (
                                  <Star size={12} style={{ color:"#fbbf24", fill:"#fbbf24", flexShrink:0 }} />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right detail ── */}
        <div style={{ flex:1, minWidth:0, background:"#fafbfc", overflowY:"auto" }}>
          {tab === "starred" && starredIds.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", height:"100%", padding:40 }}>
              <Star size={64} strokeWidth={1} style={{ color:"#fcd34d", marginBottom:12 }} />
              <p style={{ fontSize:14, color:"#94a3b8" }}>Star employees to find them quickly.</p>
            </div>
          ) : !selected ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", height:"100%", padding:40 }}>
              <User size={48} strokeWidth={1} style={{ color:"#cbd5e1", marginBottom:12 }} />
              <p style={{ fontSize:14, color:"#94a3b8" }}>Select an employee to view details.</p>
            </div>
          ) : (
            <div style={{ padding:"24px 28px", maxWidth:600 }}>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"flex-start", gap:18,
                paddingBottom:20, borderBottom:"1px solid #e8edf2" }}>
                <Avatar name={selected.name} color={selected.color} size={80} />
                <div style={{ flex:1, minWidth:0, paddingTop:4 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <h2 style={{ fontSize:20, fontWeight:700, color:"#1e293b", margin:0 }}>
                      {selected.name}
                    </h2>
                    {selected.id === selfId && (
                      <span style={{ fontSize:11, fontWeight:700,
                        background:"#fff8f0", color:BRAND,
                        border:`1px solid ${BRAND}`,
                        borderRadius:6, padding:"2px 8px" }}>You</span>
                    )}
                    <button type="button" onClick={() => toggleStar(selected.id)}
                      style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}
                      title={starredIds.includes(selected.id) ? "Remove star" : "Star this person"}>
                      <Star size={20} style={{
                        color: starredIds.includes(selected.id) ? "#fbbf24" : "#cbd5e1",
                        fill:  starredIds.includes(selected.id) ? "#fbbf24" : "none" }} />
                    </button>
                  </div>
                  <p style={{ fontSize:13, color:"#64748b", margin:"4px 0 0" }}>
                    {selected.jobTitle}
                  </p>
                  <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, fontWeight:600, padding:"2px 10px",
                      borderRadius:999, background:"#dcfce7", color:"#15803d" }}>
                      {selected.status}
                    </span>
                    <span style={{ fontSize:11, fontWeight:600, padding:"2px 10px",
                      borderRadius:999, background:"#fff8f0", color:BRAND }}>
                      {selected.empCode}
                    </span>
                    <span style={{ fontSize:11, fontWeight:600, padding:"2px 10px",
                      borderRadius:999,
                      background:`${selected.color}18`, color:selected.color }}>
                      {selected.departmentName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <SectionHead title="Contact Details" />
              <div style={{ display:"grid", gridTemplateColumns:"140px 1fr",
                rowGap:12, columnGap:12 }}>
                <InfoRow label="Email" value={
                  <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <Mail size={12} style={{ color:"#94a3b8" }} />{selected.email}
                  </span>
                } />
                <InfoRow label="Mobile" value={
                  <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <Phone size={12} style={{ color:"#94a3b8" }} />{selected.mobile}
                  </span>
                } />
              </div>

              {/* Work Info */}
              <SectionHead title="Work Information" />
              <div style={{ display:"grid", gridTemplateColumns:"140px 1fr",
                rowGap:12, columnGap:12 }}>
                <InfoRow label="Department" value={
                  <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <Briefcase size={12} style={{ color:"#94a3b8" }} />{selected.departmentName}
                  </span>
                } />
                <InfoRow label="Job Title"    value={selected.jobTitle} />
                <InfoRow label="Reporting To" value={selected.reportingTo} />
                {selected.location !== "—" && (
                  <InfoRow label="Location" value={
                    <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <MapPin size={12} style={{ color:"#94a3b8" }} />{selected.location}
                    </span>
                  } />
                )}
                {selected.joiningDate !== "—" && (
                  <InfoRow label="Joining Date" value={selected.joiningDate} />
                )}
              </div>

              {/* Personal */}
              <SectionHead title="Personal Information" />
              <div style={{ display:"grid", gridTemplateColumns:"140px 1fr",
                rowGap:12, columnGap:12 }}>
                {selected.gender    !== "—" && <InfoRow label="Gender"        value={selected.gender} />}
                {selected.dob       !== "—" && <InfoRow label="Date of Birth" value={selected.dob} />}
                {selected.bloodGroup !== "—" && <InfoRow label="Blood Group"  value={selected.bloodGroup} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
