import React, { useEffect, useState } from "react";
import Pagination, { usePagination } from "../../components/Pagination";
import { listAttendance } from "../../api/attendance.api";
import RecruiterTabs from "./RecruiterTabs";
import "../admin/adminDashboard.css";

function getInitials(name) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function fmt(val) {
  if (!val) return "—";
  return String(val).slice(0, 5);
}

const STATUS_BADGE = {
  present:    "approved",
  absent:     "rejected",
  late:       "pending",
  "half-day": "pending",
};

const RecruiterTeamAttendance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date,    setDate]    = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setLoading(true);
    listAttendance({ from_date: date, to_date: date, limit: 200 })
      .then(({ data }) => setRecords(data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [date]);

  const present  = records.filter((r) => (r.status || "").toLowerCase() === "present").length;
  const absent   = records.filter((r) => (r.status || "").toLowerCase() === "absent").length;
  const late     = records.filter((r) => (r.status || "").toLowerCase() === "late").length;
  const { paged: pagedAtt, page: attPage, setPage: setAttPage, totalPages: attTotalPages, from: attFrom, to: attTo, total: attTotal, pageSize: attPageSize, setPageSize: setAttPageSize } = usePagination(records);

  return (
    <div className="admin-dash space-y-4">
      <RecruiterTabs />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Team Attendance</h1>
          <p className="text-gray-500 mt-1">Daily attendance for your recruitment team.</p>
        </div>
        <input
          type="date"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Present", count: present, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { label: "Absent",  count: absent,  cls: "bg-rose-50 text-rose-700 border-rose-200" },
          { label: "Late",    count: late,    cls: "bg-amber-50 text-amber-700 border-amber-200" },
        ].map(({ label, count, cls }) => (
          <span key={label} className={`px-4 py-1.5 rounded-full text-sm font-medium border ${cls}`}>
            {label}: {count}
          </span>
        ))}
      </div>

      <div className="admin-dash-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-10">Loading...</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No attendance records for {date}.</p>
          ) : (
            <>
            <table className="admin-att-table w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Work Hours</th>
                  <th>Late By</th>
                </tr>
              </thead>
              <tbody>
                {pagedAtt.map((m, i) => {
                  const st = (m.status || "").toLowerCase();
                  return (
                    <tr key={m.attendance_id || i}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {getInitials(m.employee_name)}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-800">{m.employee_name || "—"}</p>
                            <p className="text-xs text-gray-400">{m.emp_code || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-gray-600">{m.department_name || "—"}</td>
                      <td>
                        <span className={`admin-status-badge ${STATUS_BADGE[st] || "pending"}`}>
                          {m.status || "—"}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">{fmt(m.check_in)}</td>
                      <td className="text-sm text-gray-600">{fmt(m.check_out)}</td>
                      <td className="text-sm text-gray-600">{m.work_hours || "—"}</td>
                      <td className="text-sm text-gray-600">{m.late_by || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={attPage} setPage={setAttPage} totalPages={attTotalPages} from={attFrom} to={attTo} total={attTotal} pageSize={attPageSize} setPageSize={setAttPageSize} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterTeamAttendance;
