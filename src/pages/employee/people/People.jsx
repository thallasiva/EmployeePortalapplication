import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter, Star, Mail, Phone, Briefcase, Users, MapPin, User } from "lucide-react";
import { getEmployeeDirectory } from "../../../api/employee.api";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const STARRED_KEY = "people-starred-ids";

function loadStarred() {
  try { return JSON.parse(localStorage.getItem(STARRED_KEY) || "[]"); }
  catch { return []; }
}

function saveStarred(ids) {
  localStorage.setItem(STARRED_KEY, JSON.stringify(ids));
}

function fullName(emp) {
  return [emp.first_name, emp.last_name ?? emp.lasst_name].filter(Boolean).join(" ") || emp.emp_code || "—";
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

const AVATAR_COLORS = [
  ["#dbeafe","#1d4ed8"], ["#dcfce7","#15803d"], ["#fef9c3","#a16207"],
  ["#fce7f3","#be185d"], ["#ede9fe","#6d28d9"], ["#ffedd5","#c2410c"],
  ["#e0f2fe","#0369a1"], ["#f0fdf4","#166534"],
];

function avatarStyle(idx) {
  const [bg, color] = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  return { background: bg, color };
}

function Avatar({ name, idx, size = 40 }) {
  const style = avatarStyle(idx);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: style.background, color: style.color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700, flexShrink: 0, userSelect: "none",
    }}>
      {initials(name).toUpperCase()}
    </div>
  );
}

/* ─── normalize API employee → UI person ─────────────────────────────────── */

function normalize(emp, idx) {
  return {
    id:           emp.employee_id,
    empCode:      emp.emp_code || `EMP${String(emp.employee_id).padStart(3,"0")}`,
    name:         fullName(emp),
    email:        emp.email || "—",
    mobile:       emp.mobile || emp.phone || "—",
    jobTitle:     emp.emp_job_title || emp.designation || emp.job_title || "—",
    reportingTo:  emp.reporting_manager_name || emp.reporting_to || "—",
    departmentId: emp.department_id,
    departmentName: emp.department_name || "—",
    status:       emp.employee_status || emp.status || "Active",
    bloodGroup:   emp.blood_group || "—",
    gender:       emp.gender || "—",
    dob:          emp.dob || "—",
    joiningDate:  emp.emp_joining_date || emp.joining_date || "—",
    location:     emp.location || emp.branch || "—",
    avatarIdx:    idx,
  };
}

/* ─── sub-components ──────────────────────────────────────────────────────── */

function InfoRow({ label, value }) {
  return (
    <>
      <span style={{ fontSize: 13, color: "#64748b", paddingRight: 8 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{value || "—"}</span>
    </>
  );
}

function SectionHead({ title }) {
  return (
    <div style={{ paddingTop: 18, paddingBottom: 8 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#38bdf8", textTransform: "uppercase", margin: 0 }}>
        {title}
      </p>
      <div style={{ borderTop: "1px solid #e8edf2", marginTop: 6 }} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f1f5f9" }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 11, width: "60%", background: "#f1f5f9", borderRadius: 4, marginBottom: 6 }} />
        <div style={{ height: 10, width: "40%", background: "#f1f5f9", borderRadius: 4 }} />
      </div>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────────── */

export default function People() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [tab, setTab]             = useState("everyone");
  const [query, setQuery]         = useState("");
  const [starredIds, setStarredIds] = useState(loadStarred);
  const [selectedId, setSelectedId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [deptFilter, setDeptFilter] = useState("all");

  /* fetch ------------------------------------------------------------------- */
  useEffect(() => {
    setLoading(true);
    Promise.resolve(getEmployeeDirectory())
      .then((res) => {
        // getEmployeeDirectory uses unwrap → returns the array directly
        const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setEmployees(arr.map(normalize));
      })
      .catch((err) => setError(err?.message || "Failed to load employees"))
      .finally(() => setLoading(false));
  }, []);

  /* departments for filter -------------------------------------------------- */
  const departments = useMemo(() => {
    const seen = new Map();
    employees.forEach((e) => {
      if (e.departmentId && !seen.has(e.departmentId)) {
        seen.set(e.departmentId, e.departmentName);
      }
    });
    return [{ value: "all", label: "All Departments" },
      ...[...seen.entries()].map(([id, name]) => ({ value: String(id), label: name }))];
  }, [employees]);

  /* filtered list ----------------------------------------------------------- */
  const filteredList = useMemo(() => {
    let list = tab === "starred"
      ? employees.filter((p) => starredIds.includes(p.id))
      : employees;

    if (deptFilter !== "all") {
      list = list.filter((p) => String(p.departmentId) === deptFilter);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.empCode.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [employees, tab, starredIds, deptFilter, query]);

  /* auto-select first -------------------------------------------------------- */
  useEffect(() => {
    if (!filteredList.length) { setSelectedId(null); return; }
    if (!filteredList.some((p) => p.id === selectedId)) {
      setSelectedId(filteredList[0].id);
    }
  }, [filteredList, selectedId]);

  const selected = filteredList.find((p) => p.id === selectedId) ?? null;

  const toggleStar = (id) => {
    setStarredIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveStarred(next);
      return next;
    });
  };

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      minHeight: "calc(100vh - 5.5rem)",
      background: "#fff", borderRadius: 10,
      border: "1px solid #e2e8f0",
      overflow: "hidden", position: "relative",
      margin: "-0.5rem -0.25rem",
    }}>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "0 16px" }}>
        {[{ key: "starred", label: "⭐ Starred" }, { key: "everyone", label: "Everyone" }].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              position: "relative", padding: "12px 16px",
              fontSize: 13, fontWeight: tab === key ? 700 : 400,
              color: tab === key ? "#1e293b" : "#94a3b8",
              background: "none", border: "none", cursor: "pointer",
              transition: "color 0.15s",
            }}
          >
            {label}
            {tab === key && (
              <span style={{
                position: "absolute", left: 0, right: 0, bottom: 0,
                height: 2, background: "#38bdf8", borderRadius: "2px 2px 0 0",
              }} />
            )}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* ── Left list ── */}
        <div style={{
          width: 300, flexShrink: 0,
          borderRight: "1px solid #e2e8f0",
          display: "flex", flexDirection: "column",
        }}>
          {/* Search + filter bar */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 8 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, code, email…"
                style={{
                  width: "100%", border: "1px solid #e2e8f0", borderRadius: 8,
                  padding: "8px 36px 8px 12px", fontSize: 13, color: "#334155",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#38bdf8"; }}
                onBlur={(e)  => { e.target.style.borderColor = "#e2e8f0"; }}
              />
              <Search size={15} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              style={{
                width: 38, height: 38, flexShrink: 0,
                border: filterOpen || deptFilter !== "all" ? "1px solid #38bdf8" : "1px solid #e2e8f0",
                borderRadius: 8, background: filterOpen || deptFilter !== "all" ? "#e0f2fe" : "#fff",
                color: filterOpen || deptFilter !== "all" ? "#0369a1" : "#64748b",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Filter size={16} />
            </button>
          </div>

          {/* Dept filter dropdown (inline) */}
          {filterOpen && (
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
              <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                Filter by Department
              </label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={{
                  width: "100%", border: "1px solid #e2e8f0", borderRadius: 7,
                  padding: "7px 10px", fontSize: 13, color: "#334155",
                  background: "#fff", outline: "none",
                }}
              >
                {departments.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              {deptFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setDeptFilter("all")}
                  style={{ fontSize: 11, color: "#38bdf8", background: "none", border: "none", cursor: "pointer", marginTop: 6, padding: 0 }}
                >
                  Clear filter
                </button>
              )}
            </div>
          )}

          {/* Count */}
          {!loading && (
            <div style={{ padding: "6px 14px", fontSize: 11, color: "#94a3b8", borderBottom: "1px solid #f8fafc" }}>
              {filteredList.length} of {employees.length} employee{employees.length !== 1 ? "s" : ""}
            </div>
          )}

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              [1,2,3,4,5].map((i) => <SkeletonCard key={i} />)
            ) : error ? (
              <div style={{ padding: 24, textAlign: "center", color: "#ef4444", fontSize: 13 }}>{error}</div>
            ) : filteredList.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <Users size={40} strokeWidth={1.2} style={{ color: "#cbd5e1", marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: "#94a3b8" }}>
                  {tab === "starred" ? "No starred employees yet." : "No employees found."}
                </p>
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {filteredList.map((person) => {
                  const active = person.id === selectedId;
                  return (
                    <li key={person.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(person.id)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center",
                          gap: 10, padding: "10px 14px", textAlign: "left",
                          background: active ? "#f0f9ff" : "transparent",
                          border: "none", borderBottom: "1px solid #f8fafc",
                          borderLeft: active ? "3px solid #38bdf8" : "3px solid transparent",
                          cursor: "pointer", transition: "background 0.12s",
                        }}
                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f8fafc"; }}
                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                      >
                        <Avatar name={person.name} idx={person.avatarIdx} size={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: "#1e293b", margin: 0, truncate: true, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {person.name}
                          </p>
                          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                            {person.empCode} · {person.departmentName}
                          </p>
                        </div>
                        {starredIds.includes(person.id) && (
                          <Star size={13} style={{ color: "#fbbf24", fill: "#fbbf24", flexShrink: 0 }} />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── Right detail ── */}
        <div style={{ flex: 1, minWidth: 0, background: "#fafbfc", overflowY: "auto" }}>
          {tab === "starred" && starredIds.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 40 }}>
              <Star size={64} strokeWidth={1} style={{ color: "#fcd34d", marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: "#94a3b8" }}>Star your colleagues to find them quickly.</p>
            </div>
          ) : !selected ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 40 }}>
              <User size={48} strokeWidth={1} style={{ color: "#cbd5e1", marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: "#94a3b8" }}>Select an employee to view details.</p>
            </div>
          ) : (
            <div style={{ padding: "24px 28px", maxWidth: 600 }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 18, paddingBottom: 20, borderBottom: "1px solid #e8edf2" }}>
                <Avatar name={selected.name} idx={selected.avatarIdx} size={80} />
                <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                      {selected.name}
                    </h2>
                    <button
                      type="button"
                      onClick={() => toggleStar(selected.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                      title={starredIds.includes(selected.id) ? "Remove star" : "Star this person"}
                    >
                      <Star
                        size={20}
                        style={{
                          color: starredIds.includes(selected.id) ? "#fbbf24" : "#cbd5e1",
                          fill:  starredIds.includes(selected.id) ? "#fbbf24" : "none",
                        }}
                      />
                    </button>
                  </div>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                    {selected.jobTitle}
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 10px",
                      borderRadius: 999, background: "#dcfce7", color: "#15803d",
                    }}>
                      {selected.status}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 10px",
                      borderRadius: 999, background: "#e0f2fe", color: "#0369a1",
                    }}>
                      {selected.empCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <SectionHead title="Contact Details" />
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 12, columnGap: 12 }}>
                <InfoRow label="Email" value={
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Mail size={12} style={{ color: "#94a3b8" }} />{selected.email}
                  </span>
                } />
                <InfoRow label="Mobile" value={
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Phone size={12} style={{ color: "#94a3b8" }} />{selected.mobile}
                  </span>
                } />
              </div>

              {/* Work Info */}
              <SectionHead title="Work Information" />
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 12, columnGap: 12 }}>
                <InfoRow label="Department" value={
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Briefcase size={12} style={{ color: "#94a3b8" }} />{selected.departmentName}
                  </span>
                } />
                <InfoRow label="Job Title"    value={selected.jobTitle} />
                <InfoRow label="Reporting To" value={selected.reportingTo} />
                {selected.location !== "—" && (
                  <InfoRow label="Location" value={
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={12} style={{ color: "#94a3b8" }} />{selected.location}
                    </span>
                  } />
                )}
                {selected.joiningDate !== "—" && (
                  <InfoRow label="Joining Date" value={selected.joiningDate} />
                )}
              </div>

              {/* Personal */}
              <SectionHead title="Personal Information" />
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 12, columnGap: 12 }}>
                {selected.gender    !== "—" && <InfoRow label="Gender"      value={selected.gender} />}
                {selected.dob       !== "—" && <InfoRow label="Date of Birth" value={selected.dob} />}
                {selected.bloodGroup !== "—" && <InfoRow label="Blood Group" value={selected.bloodGroup} />}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
