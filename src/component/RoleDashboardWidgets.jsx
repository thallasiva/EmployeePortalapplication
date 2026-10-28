import { useEffect, useState } from "react";
import { dashboardsApi } from "../api/settings.api";

const SOURCE_KEYS = {
  Employees: ["totalEmployees", "totalTeam", "employeeCount", "employees_count", "employees"],
  Attendance: ["attendanceRate", "presentToday", "presentDays", "present_today"],
  Leave: ["pendingLeave", "onLeaveToday", "leaveBalance", "pendingTimesheets"],
  Payroll: ["netPay", "salary", "salariesCount", "salaries_count"],
  Recruitment: ["openJobs", "open_jobs", "my_open_jobs", "total_jobs", "total_candidates", "in_interview", "offers_pending", "active_onboarding"],
  Performance: ["reviewRating", "reviews", "goalsMet"],
  Helpdesk: ["openTickets", "open_tickets", "tickets"],
};
const SOURCE_METRICS = {
  Employees: [["Employees", "totalEmployees"], ["Team", "totalTeam"], ["Employees", "employees_count"]],
  Attendance: [["Present", "presentToday"], ["Absent", "absentToday"], ["Late", "lateToday"], ["Rate", "attendanceRate"]],
  Leave: [["Pending", "pendingLeave"], ["On Leave", "onLeaveToday"], ["Balance", "leaveBalance"]],
  Payroll: [["Net Pay", "netPay"], ["Payroll Records", "salariesCount"], ["Gross", "gross"]],
  Recruitment: [["Open Jobs", "openJobs"], ["Interviews", "in_interview"], ["Candidates", "total_candidates"], ["Offers", "offers_pending"]],
  Performance: [["Reviews", "reviews"], ["Rating", "reviewRating"], ["Goals Met", "goalsMet"]],
  Helpdesk: [["Open Tickets", "openTickets"], ["Tickets", "tickets"]],
};

function getValue(data, widget) {
  const keys = SOURCE_KEYS[widget.source] || [];
  const key = keys.find((candidate) => data[candidate] !== undefined && data[candidate] !== null);
  if (key) return data[key];
  if (widget.valueKey && data[widget.valueKey] !== undefined) return data[widget.valueKey];
  return "—";
}

function getRows(data, source) {
  const key = `${source.toLowerCase()}Rows`;
  const rows = data[key];
  return Array.isArray(rows) ? rows : [];
}

function getChartEntries(data, source) {
  return (SOURCE_METRICS[source] || [])
    .filter(([, key]) => data[key] !== undefined && data[key] !== null && Number.isFinite(Number(data[key])))
    .map(([label, key]) => ({ label, value: Number(data[key]) }));
}

export default function RoleDashboardWidgets({ data = {} }) {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    dashboardsApi.mine()
      .then((result) => {
        if (active) setDashboard(result);
      })
      .catch(() => {
        if (active) setError("Custom dashboard widgets could not be loaded.");
      });
    return () => { active = false; };
  }, []);

  if (error) {
    return <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>;
  }
  if (!dashboard?.widgets?.length) return null;

  return (
    <section className="space-y-3" aria-label={`${dashboard.name} custom widgets`}>
      <h2 className="text-sm font-semibold text-slate-500">{dashboard.name}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.widgets.map((widget, index) => {
          const source = widget.source || "Employees";
          const value = getValue(data, { ...widget, source });
          const rows = getRows(data, source);
          const entries = getChartEntries(data, source);
          const maxValue = Math.max(1, ...entries.map((entry) => Math.abs(entry.value)));
          return (
            <article
              key={widget.id || `${widget.type}-${index}`}
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              style={{ borderTop: `3px solid ${widget.color || "#f18200"}` }}
            >
              <p className="truncate text-xs font-medium text-slate-500">{widget.label || widget.source}</p>
              {widget.type === "table" ? (
                rows.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {rows.slice(0, 4).map((row, rowIndex) => (
                      <li key={row.id || row.employee_id || rowIndex} className="truncate text-sm text-slate-700">
                        {row.name || row.employee || row.title || row.status || JSON.stringify(row)}
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-3 text-sm text-slate-400">No {source.toLowerCase()} rows available.</p>
              ) : widget.type === "bar" ? (
                entries.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {entries.map((entry) => (
                      <div key={entry.label}>
                        <div className="mb-1 flex justify-between gap-2 text-[11px] text-slate-500">
                          <span>{entry.label}</span><span>{entry.value}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full" style={{ width: `${Math.max(3, Math.abs(entry.value) / maxValue * 100)}%`, background: widget.color || "#f18200" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-3 text-sm text-slate-400">No {source.toLowerCase()} metrics available.</p>
              ) : widget.type === "line" ? (
                entries.length > 1 ? (
                  <svg className="mt-3 h-16 w-full" viewBox="0 0 200 60" role="img" aria-label={`${widget.label} live trend`}>
                    <polyline
                      points={entries.map((entry, pointIndex) => {
                        const x = entries.length === 1 ? 100 : pointIndex * 200 / (entries.length - 1);
                        const y = 55 - Math.abs(entry.value) / maxValue * 50;
                        return `${x},${y}`;
                      }).join(" ")}
                      fill="none" stroke={widget.color || "#f18200"} strokeWidth="3"
                    />
                  </svg>
                ) : <p className="mt-3 text-sm text-slate-400">More {source.toLowerCase()} data is needed for a trend.</p>
              ) : widget.type === "pie" ? (
                entries.length > 0 ? (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 rounded-full" style={{
                      background: `conic-gradient(${entries.map((entry, segmentIndex) => {
                        const palette = [widget.color || "#f18200", "#6366f1", "#10b981", "#f59e0b"];
                        const total = entries.reduce((sum, item) => sum + Math.abs(item.value), 0) || 1;
                        const start = entries.slice(0, segmentIndex).reduce((sum, item) => sum + Math.abs(item.value), 0) / total * 100;
                        const end = start + Math.abs(entry.value) / total * 100;
                        return `${palette[segmentIndex % palette.length]} ${start}% ${end}%`;
                      }).join(", ")})`,
                    }} />
                    <ul className="min-w-0 space-y-1">
                      {entries.map((entry) => <li key={entry.label} className="truncate text-[11px] text-slate-500">{entry.label}: {entry.value}</li>)}
                    </ul>
                  </div>
                ) : <p className="mt-3 text-sm text-slate-400">No {source.toLowerCase()} metrics available.</p>
              ) : widget.type === "calendar" ? (
                Array.isArray(data.calendarEvents) && data.calendarEvents.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {data.calendarEvents.slice(0, 3).map((event, eventIndex) => (
                      <li key={event.id || event.holiday_id || eventIndex} className="truncate text-sm text-slate-700">
                        {event.name || event.holiday_name || event.title || "Calendar event"}
                        <span className="ml-2 text-xs text-slate-400">{event.date || event.holiday_date || ""}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-3 text-sm text-slate-400">No upcoming calendar events available.</p>
              ) : (
                <p className="mt-2 text-2xl font-bold" style={{ color: widget.color || "#f18200" }}>
                  {typeof value === "number" && widget.source === "Attendance" && widget.label?.toLowerCase().includes("rate")
                    ? `${value}%`
                    : value}
                </p>
              )}
              {widget.type !== "table" && (
                <p className="mt-1 text-[11px] text-slate-400">Current {source.toLowerCase()} data</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
