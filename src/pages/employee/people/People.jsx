import React, { useEffect, useState, useMemo } from "react";
import {
  Mail, Phone, Briefcase, MapPin, Users, Crown,
  Calendar, Building2, UserCheck, ChevronRight, Star
} from "lucide-react";
import apiClient, { unwrap } from "../../../api/client";
import { getCurrentUser } from "../../../api/auth.api";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
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

function fullName(emp) {
  return [emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.emp_code || "—";
}

function initials(name) {
  const p = (name || "?").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

function fmtDate(d) {
  if (!d || d === "—") return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

function normalize(emp) {
  return {
    id: emp.employee_id,
    empCode: emp.emp_code || `EMP${String(emp.employee_id).padStart(3, "0")}`,
    name: fullName(emp),
    email: emp.email || "—",
    mobile: emp.mobile || emp.phone || "—",
    jobTitle: emp.emp_job_title || emp.designation_name || "—",
    reportingToId: emp.reporting_to || null,
    departmentId: emp.department_id,
    departmentName: emp.department_name || "—",
    status: emp.employee_status || "Active",
    gender: emp.gender || "—",
    dob: emp.dob || "—",
    bloodGroup: emp.blood_group || "—",
    joiningDate: emp.emp_joining_date || emp.joining_date || "—",
    location: emp.location || "—",
    color: deptColor(emp.department_id),
  };
}

/* ─── Avatar ──────────────────────────────────────────────────────────────── */
function Avatar({ name, color, size = 40 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `${color}22`, color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.34, fontWeight: 700, flexShrink: 0, userSelect: "none",
        border: `2px solid ${color}33`,
      }}
    >
      {initials(name)}
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function Skeleton({ w = "100%", h = 14, r = 6, mb = 0 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "#f1f5f9", marginBottom: mb, flexShrink: 0,
    }} />
  );
}

/* ─── Section Label ──────────────────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
      color: BRAND, textTransform: "uppercase", marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

/* ─── Info chip row ──────────────────────────────────────────────────────── */
function InfoChip({ icon: Icon, label, value }) {
  if (!value || value === "—") return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, background: "#f8fafc",
        border: "1px solid #e8eef5", display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={14} color="#94a3b8" />
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

/* ─── Colleague card ─────────────────────────────────────────────────────── */
function ColleagueCard({ person, isManager, isDirectReport }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px", background: "#fff",
      border: "1px solid #e8eef5", borderRadius: 12,
      borderLeft: `3px solid ${person.color}`,
    }}>
      <Avatar name={person.name} color={person.color} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", whiteSpace: "nowrap" }}>
            {person.name}
          </span>
          {isManager && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
              background: "#fff8f0", color: BRAND, border: `1px solid ${BRAND}44`,
            }}>MANAGER</span>
          )}
          {isDirectReport && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
              background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0",
            }}>REPORTS TO YOU</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{person.jobTitle}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{person.departmentName}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        {person.email !== "—" && (
          <a href={`mailto:${person.email}`} style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 11, color: BRAND, textDecoration: "none",
          }}>
            <Mail size={11} /> Mail
          </a>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function People() {
  const [allEmployees, setAllEmployees] = useState([]);
  const [selfId, setSelfId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.get("/employees/org-chart").then(unwrap),
      getCurrentUser().catch(() => null),
    ])
      .then(([rows, me]) => {
        const nameMap = {};
        rows.forEach((e) => { nameMap[e.employee_id] = fullName(e); });
        const normalized = rows.map((emp) => ({
          ...normalize(emp),
          reportingToName: emp.reporting_to ? nameMap[emp.reporting_to] || "—" : "—",
        }));
        setAllEmployees(normalized);
        setSelfId(me?.employeeId || me?.employee_id || null);
      })
      .catch((e) => setError(e?.response?.data?.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  /* derived ----------------------------------------------------------------- */
  const self = useMemo(() => allEmployees.find((e) => e.id === selfId) ?? null, [allEmployees, selfId]);

  const manager = useMemo(
    () => self?.reportingToId ? allEmployees.find((e) => e.id === self.reportingToId) ?? null : null,
    [allEmployees, self]
  );

  const directReports = useMemo(
    () => allEmployees.filter((e) => e.reportingToId === selfId),
    [allEmployees, selfId]
  );

  const peers = useMemo(
    () => allEmployees.filter(
      (e) => e.id !== selfId &&
             e.reportingToId === self?.reportingToId &&
             e.reportingToId != null
    ),
    [allEmployees, self, selfId]
  );

  const deptTeam = useMemo(
    () => allEmployees.filter(
      (e) => e.id !== selfId &&
             e.departmentId === self?.departmentId &&
             e.reportingToId !== selfId &&
             e.reportingToId !== self?.reportingToId
    ),
    [allEmployees, self, selfId]
  );

  /* ── loading skeleton ─────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <Skeleton w={200} h={20} r={8} mb={24} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8eef5", padding: 20 }}>
              <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                <Skeleton w={64} h={64} r="50%" />
                <div style={{ flex: 1 }}>
                  <Skeleton w="60%" h={14} mb={8} />
                  <Skeleton w="40%" h={11} mb={6} />
                  <Skeleton w="30%" h={11} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#ef4444", fontSize: 14 }}>{error}</div>
    );
  }

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", padding: "20px 24px" }}>

      {/* Page title */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1f2937" }}>My Team</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
          Your position, manager, and team at a glance
        </p>
      </div>

      {/* ── Top row: My Profile + Manager ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* My Profile */}
        <div style={{
          background: "#fff", borderRadius: 14,
          border: "1px solid #e8eef5",
          overflow: "hidden",
        }}>
          {/* Orange accent bar */}
          <div style={{ height: 4, background: `linear-gradient(90deg, ${BRAND}, #ffb347)` }} />
          <div style={{ padding: 20 }}>
            <SectionLabel>My Profile</SectionLabel>
            {self ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <Avatar name={self.name} color={self.color} size={64} />
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#1f2937" }}>{self.name}</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{self.jobTitle}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
                        background: "#dcfce7", color: "#16a34a",
                      }}>{self.status}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999,
                        background: "#fff8f0", color: BRAND,
                      }}>{self.empCode}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <InfoChip icon={Building2}  label="Department"   value={self.departmentName} />
                  <InfoChip icon={MapPin}     label="Location"     value={self.location} />
                  <InfoChip icon={Calendar}   label="Joined"       value={fmtDate(self.joiningDate)} />
                  <InfoChip icon={Mail}       label="Email"        value={self.email} />
                  <InfoChip icon={Phone}      label="Mobile"       value={self.mobile} />
                  {self.bloodGroup !== "—" &&
                    <InfoChip icon={UserCheck} label="Blood Group" value={self.bloodGroup} />
                  }
                </div>
              </>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 13 }}>Profile not available.</div>
            )}
          </div>
        </div>

        {/* Manager + dept stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Manager card */}
          <div style={{
            background: "#fff", borderRadius: 14,
            border: "1px solid #e8eef5", padding: 20, flex: 1,
          }}>
            <SectionLabel>Reporting Manager</SectionLabel>
            {manager ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ position: "relative" }}>
                  <Avatar name={manager.name} color={manager.color} size={56} />
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 18, height: 18, borderRadius: "50%",
                    background: BRAND, display: "flex", alignItems: "center",
                    justifyContent: "center", border: "2px solid #fff",
                  }}>
                    <Crown size={9} color="#fff" />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1f2937" }}>{manager.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{manager.jobTitle}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{manager.departmentName}</div>
                  {manager.email !== "—" && (
                    <a href={`mailto:${manager.email}`} style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      marginTop: 8, fontSize: 12, color: BRAND,
                      textDecoration: "none", fontWeight: 600,
                    }}>
                      <Mail size={12} /> {manager.email}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "16px 0", color: "#94a3b8",
              }}>
                <Crown size={32} strokeWidth={1} style={{ marginBottom: 8, color: "#e2e8f0" }} />
                <span style={{ fontSize: 13 }}>No manager assigned</span>
              </div>
            )}
          </div>

          {/* Dept & team quick stats */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10,
          }}>
            {[
              {
                label: "Department",
                value: self?.departmentName || "—",
                icon: Building2, color: "#6366f1", bg: "#eef2ff",
              },
              {
                label: "Direct Reports",
                value: directReports.length,
                icon: UserCheck, color: "#10b981", bg: "#ecfdf5",
              },
              {
                label: "Team Size",
                value: peers.length + directReports.length + 1,
                icon: Users, color: BRAND, bg: "#fff8f0",
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} style={{
                background: "#fff", borderRadius: 12,
                border: "1px solid #e8eef5", padding: "14px 12px",
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: bg, display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={15} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginTop: 2 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Direct Reports ──────────────────────────────────────────────────── */}
      {directReports.length > 0 && (
        <div style={{
          background: "#fff", borderRadius: 14,
          border: "1px solid #e8eef5", padding: 20, marginBottom: 16,
        }}>
          <SectionLabel>Direct Reports ({directReports.length})</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {directReports.map((p) => (
              <ColleagueCard key={p.id} person={p} isDirectReport />
            ))}
          </div>
        </div>
      )}

      {/* ── Peers (same manager) ────────────────────────────────────────────── */}
      {peers.length > 0 && (
        <div style={{
          background: "#fff", borderRadius: 14,
          border: "1px solid #e8eef5", padding: 20, marginBottom: 16,
        }}>
          <SectionLabel>Teammates — same manager ({peers.length})</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {peers.map((p) => (
              <ColleagueCard key={p.id} person={p} />
            ))}
          </div>
        </div>
      )}

      {/* ── Others in dept ──────────────────────────────────────────────────── */}
      {deptTeam.length > 0 && (
        <div style={{
          background: "#fff", borderRadius: 14,
          border: "1px solid #e8eef5", padding: 20,
        }}>
          <SectionLabel>Others in {self?.departmentName || "Department"} ({deptTeam.length})</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {deptTeam.map((p) => (
              <ColleagueCard key={p.id} person={p} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!self && !loading && (
        <div style={{
          background: "#fff", borderRadius: 14, border: "1px solid #e8eef5",
          padding: 48, textAlign: "center",
        }}>
          <Users size={48} strokeWidth={1} style={{ color: "#e2e8f0", marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: "#94a3b8" }}>No team information available.</p>
        </div>
      )}
    </div>
  );
}
