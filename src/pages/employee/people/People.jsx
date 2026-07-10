import React, { useEffect, useState, useMemo } from "react";
import
{
  Mail, Phone, Briefcase, MapPin, Users, Crown,
  Calendar, Building2, UserCheck, ChevronRight, Star
} from "lucide-react";
import apiClient, { unwrap } from "../../../api/client";
import { getCurrentUser } from "../../../api/auth.api";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const BRAND = "#f18200";

const PALETTE = [
  "#f18200", "#6366f1", "#a855f7", "#ec4899",
  "#10b981", "#ef4444", "#3b82f6", "#84cc16",
  "#f59e0b", "#06b6d4", "#8b5cf6", "#14b8a6",
];

function deptColor(deptId)
{
  if (deptId == null) return "#94a3b8";
  return PALETTE[Number(deptId) % PALETTE.length];
}

function fullName(emp)
{
  return [emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.emp_code || "—";
}

function initials(name)
{
  const p = (name || "?").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

function fmtDate(d)
{
  if (!d || d === "—") return "—";
  try
  {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

function normalize(emp)
{
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
function Avatar({ name, color, size = 40 })
{
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
function Skeleton({ w = "100%", h = 14, r = 6, mb = 0 })
{
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "#f1f5f9", marginBottom: mb, flexShrink: 0,
    }} />
  );
}

/* ─── Section Label ──────────────────────────────────────────────────────── */
function SectionLabel({ children })
{
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
function InfoChip({ icon: Icon, label, value })
{
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
function ColleagueCard({ person, isManager, isDirectReport })
{
  return (
    <div
      // style={{
      //   display: "flex", alignItems: "center", gap: 12,
      //   padding: "12px 14px", background: "#fff",
      //   border: "1px solid #e8eef5", borderRadius: 12,
      //   borderLeft: `3px solid ${person.color}`,
      // }}
      // className="flex items-center gap-3 px-3.5 py-3 bg-white border border-slate-200 rounded-xl"

      className="flex items-center gap-3 px-3.5 py-3 bg-white border border-slate-200 border-l-[3px] rounded-xl"
      style={{ borderLeftColor: person.color }}

    >
      <Avatar name={person.name} color={person.color} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[13px] font-bold text-slate-800 whitespace-nowrap">
            {person.name}
          </span>

          {isManager && (
            <span
              className="text-[9px] font-bold px-1.5 py-px rounded"
              style={{
                backgroundColor: "#fff8f0",
                color: BRAND,
                border: `1px solid ${BRAND}44`,
              }}
            >
              MANAGER
            </span>
          )}

          {isDirectReport && (
            <span
              className="text-[9px] font-bold px-1.5 py-px rounded bg-green-50 text-green-600 border border-green-200"
            >
              REPORTS TO YOU
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-400 mt-0.5">
          {person.jobTitle}
        </div>

        <div className="text-[11px] text-slate-500 mt-px">
          {person.departmentName}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        {person.email !== "—" && (
          <a
            href={`mailto:${person.email}`}
            className="flex items-center gap-1 text-[11px] no-underline"
            style={{ color: BRAND }}
          >
            <Mail size={11} /> Mail
          </a>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function People()
{
  const [allEmployees, setAllEmployees] = useState([]);
  const [selfId, setSelfId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() =>
  {
    setLoading(true);
    Promise.all([
      apiClient.get("/employees/org-chart").then(unwrap),
      getCurrentUser().catch(() => null),
    ])
      .then(([rows, me]) =>
      {
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
  if (loading)
  {
    return (
      <div className="px-6 max-w-[900px] mx-auto">
        <Skeleton w={200} h={20} r={8} mb={24} />

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-[14px] border border-slate-200 p-5"
            >
              <div className="flex gap-3.5 mb-3.5">
                <Skeleton w={64} h={64} r="50%" />

                <div className="flex-1">
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

  if (error)
  {
    return (
      <div className="p-10 text-center text-red-500 text-sm">
        {error}
      </div>
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
      <div className="grid grid-cols-2 gap-4 mb-4">

        {/* My Profile */}
        <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden">

          {/* Orange accent bar */}
          <div
            className="h-1"
            style={{
              background: `linear-gradient(90deg, ${BRAND}, #ffb347)`,
            }}
          />

          <div className="p-5">
            <SectionLabel>My Profile</SectionLabel>

            {self ? (
              <>
                <div className="flex items-center gap-3.5 mb-[18px]">
                  <Avatar name={self.name} color={self.color} size={64} />

                  <div>
                    <div className="text-[17px] font-extrabold text-slate-800">
                      {self.name}
                    </div>

                    <div className="text-[13px] text-slate-500 mt-0.5">
                      {self.jobTitle}
                    </div>

                    <div className="flex gap-1.5 mt-1.5 flex-wrap">

                      <span
                        className="text-[11px] font-bold px-[9px] py-0.5 rounded-full bg-green-100 text-green-600"
                      >
                        {self.status}
                      </span>

                      <span
                        className="text-[11px] font-bold px-[9px] py-0.5 rounded-full"
                        style={{
                          backgroundColor: "#fff8f0",
                          color: BRAND,
                        }}
                      >
                        {self.empCode}
                      </span>

                    </div>
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-3">

                  <InfoChip
                    icon={Building2}
                    label="Department"
                    value={self.departmentName}
                  />

                  <InfoChip
                    icon={MapPin}
                    label="Location"
                    value={self.location}
                  />

                  <InfoChip
                    icon={Calendar}
                    label="Joined"
                    value={fmtDate(self.joiningDate)}
                  />

                  <InfoChip
                    icon={Mail}
                    label="Email"
                    value={self.email}
                  />

                  <InfoChip
                    icon={Phone}
                    label="Mobile"
                    value={self.mobile}
                  />

                  {self.bloodGroup !== "—" && (
                    <InfoChip
                      icon={UserCheck}
                      label="Blood Group"
                      value={self.bloodGroup}
                    />
                  )}

                </div>

              </>
            ) : (

              <div className="text-[13px] text-slate-400">
                Profile not available.
              </div>

            )}

          </div>
        </div>


        {/* Manager + dept stats */}

        <div className="flex flex-col gap-4">


          {/* Manager card */}

          <div className="bg-white rounded-[14px] border border-slate-200 p-5 flex-1">

            <SectionLabel>
              Reporting Manager
            </SectionLabel>


            {manager ? (

              <div className="flex items-center gap-3.5">

                <div className="relative">

                  <Avatar
                    name={manager.name}
                    color={manager.color}
                    size={56}
                  />


                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white"
                    style={{
                      backgroundColor: BRAND,
                    }}
                  >
                    <Crown size={9} color="#fff" />
                  </div>


                </div>


                <div className="flex-1">

                  <div className="text-[15px] font-bold text-slate-800">
                    {manager.name}
                  </div>


                  <div className="text-[12px] text-slate-500 mt-0.5">
                    {manager.jobTitle}
                  </div>


                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {manager.departmentName}
                  </div>


                  {manager.email !== "—" && (

                    <a
                      href={`mailto:${manager.email}`}
                      className="inline-flex items-center gap-1 mt-2 text-[12px] font-semibold no-underline"
                      style={{
                        color: BRAND,
                      }}
                    >
                      <Mail size={12} />
                      {manager.email}
                    </a>

                  )}

                </div>

              </div>


            ) : (

              <div className="flex flex-col items-center justify-center py-4 text-slate-400">

                <Crown
                  size={32}
                  strokeWidth={1}
                  className="mb-2 text-slate-200"
                />

                <span className="text-[13px]">
                  No manager assigned
                </span>

              </div>

            )}

          </div>



          {/* Department statistics */}

          <div className="grid grid-cols-3 gap-2.5">

            {[
              {
                label: "Department",
                value: self?.departmentName || "—",
                icon: Building2,
                color: "#6366f1",
                bg: "#eef2ff",
              },
              {
                label: "Direct Reports",
                value: directReports.length,
                icon: UserCheck,
                color: "#10b981",
                bg: "#ecfdf5",
              },
              {
                label: "Team Size",
                value: peers.length + directReports.length + 1,
                icon: Users,
                color: BRAND,
                bg: "#fff8f0",
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (

              <div
                key={label}
                className="bg-white rounded-xl border border-slate-200 px-3 py-3.5 flex flex-col gap-2"
              >

                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: bg,
                  }}
                >
                  <Icon
                    size={15}
                    color={color}
                  />
                </div>


                <div>

                  <div
                    className="text-lg font-extrabold"
                    style={{
                      color,
                    }}
                  >
                    {value}
                  </div>


                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {label}
                  </div>

                </div>


              </div>

            ))}

          </div>


        </div>

      </div>

      {/* ── Direct Reports ──────────────────────────────────────────────────── */}
      {directReports.length > 0 && (
        <div className="bg-white rounded-[14px] border border-slate-200 p-5 mb-4">
          <SectionLabel>
            Direct Reports ({directReports.length})
          </SectionLabel>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2.5">
            {directReports.map((p) => (
              <ColleagueCard
                key={p.id}
                person={p}
                isDirectReport
              />
            ))}
          </div>
        </div>
      )}


      {/* ── Peers (same manager) ────────────────────────────────────────────── */}
      {peers.length > 0 && (
        <div className="bg-white rounded-[14px] border border-slate-200 p-5 mb-4">
          <SectionLabel>
            Teammates — same manager ({peers.length})
          </SectionLabel>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2.5">
            {peers.map((p) => (
              <ColleagueCard
                key={p.id}
                person={p}
              />
            ))}
          </div>
        </div>
      )}


      {/* ── Others in dept ──────────────────────────────────────────────────── */}
      {deptTeam.length > 0 && (
        <div className="bg-white rounded-[14px] border border-slate-200 p-5">
          <SectionLabel>
            Others in {self?.departmentName || "Department"} ({deptTeam.length})
          </SectionLabel>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2.5">
            {deptTeam.map((p) => (
              <ColleagueCard
                key={p.id}
                person={p}
              />
            ))}
          </div>
        </div>
      )}


      {/* Empty state */}
      {!self && !loading && (
        <div className="bg-white rounded-[14px] border border-slate-200 p-12 text-center">
          <Users
            size={48}
            strokeWidth={1}
            className="text-slate-200 mb-3 mx-auto"
          />

          <p className="text-sm text-slate-400">
            No team information available.
          </p>
        </div>
      )
      }

    </div>
  );
}
