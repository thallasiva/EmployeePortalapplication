import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Calendar,
  Clock,
  FileText,
  Thermometer,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import {
  ADMIN_LEAVE_MONTHLY_CHART,
  ADMIN_LEAVE_MONTHLY_SERIES,
  ADMIN_LEAVE_POLICIES,
  ADMIN_TOTAL_EMPLOYEES,
  CALENDAR_PURPOSE,
  ADMIN_LEAVE_SUMMARY,
} from "../../data/adminLeaveData";
import AdminGroupedBarChart from "../../component/admin/AdminGroupedBarChart";
import AdminDonutChart from "../../component/admin/AdminDonutChart";
import TeamAvailabilityCalendar from "../../component/admin/TeamAvailabilityCalendar";
import LeaveEmployeeDetailTable from "../../component/admin/LeaveEmployeeDetailTable";
import {
  countApprovedThisMonth,
  getApprovedLeavesToday,
} from "../../utils/adminLeaveUtils";
import { successToast, errorToast } from "../../utils/ToastControllers";
import { listLeaveRequests, reviewLeaveRequest } from "../../api/leaveRequest.api";
import { importHolidays } from "../../api/holiday.api";
import { parseHolidayCsv } from "../../utils/holidayImport";
import "./adminDashboard.css";

const LEAVE_ICON = {
  thermometer: Thermometer,
  calendar: Calendar,
  user: User,
};

const LEAVE_COLOR = {
  green: { bg: "bg-emerald-50", text: "text-emerald-600", bar: "#22c55e" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", bar: "#3b82f6" },
  purple: { bg: "bg-violet-50", text: "text-violet-600", bar: "#8b5cf6" },
};

const today = new Date();

function formatActionDate() {
  return today.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Maps a backend leave_requests row to the shape RequestRow expects */
function mapRequest(row) {
  return {
    id: row.leave_request_id,
    employee: (row.employee_name || "").trim() || "—",
    department: row.department_name || "—",
    type: row.leave_type_name || "—",
    from: formatDate(row.from_date),
    to: formatDate(row.to_date),
    days: Number(row.days) || 0,
    reason: row.reason || "—",
    appliedOn: formatDate(row.applied_on),
    status: row.status,
    actionBy: (row.reviewer_name || "").trim() || null,
    actionOn:
      row.status !== "Pending"
        ? formatDate(row.reviewed_on || row.updated_at || row.applied_on)
        : null,
  };
}

function LeaveTypeCard({ item }) {
  const Icon = LEAVE_ICON[item.icon] || Calendar;
  const colors = LEAVE_COLOR[item.color] || LEAVE_COLOR.green;
  const pct = item.totalQuota
    ? Math.round((item.usedThisMonth / item.totalQuota) * 100)
    : 0;

  return (
    <div className="admin-dash-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon size={18} className={colors.text} />
        </div>
        <span className="text-xs font-medium text-gray-500">
          {item.onLeaveToday} on leave today
        </span>
      </div>
      <p className="text-sm font-medium text-gray-600">{item.label}</p>
      <p className="admin-dash-stat-value mt-1">
        {item.usedThisMonth}
        <span className="text-base font-normal text-gray-400">
          {" "}
          / {item.totalQuota} days used
        </span>
      </p>
      <div className="admin-dash-progress mt-3">
        <span style={{ width: `${pct}%`, background: colors.bar }} />
      </div>
    </div>
  );
}

function QuickStatCard({ icon: Icon, value, label, iconBg, iconColor, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-dash-card admin-stat-card-clickable flex items-center gap-4 text-left w-full ${
        active ? "active" : ""
      }`}
    >
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <p className="admin-dash-stat-value">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xs text-emerald-600 mt-1">Click to view list</p>
      </div>
    </button>
  );
}

function RequestRow({ row, showActions, onApprove, onReject, highlight }) {
  return (
    <div
      id={`leave-request-${row.id}`}
      className={`border rounded-lg p-3 mb-2 hover:bg-gray-50/80 bg-white ${
        highlight
          ? "border-emerald-400 ring-2 ring-emerald-100"
          : "border-gray-100"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{row.employee}</p>
          <p className="text-xs text-gray-500">{row.department}</p>
        </div>
        <span
          className={`admin-status-badge ${
            row.status === "Approved"
              ? "approved"
              : row.status === "Rejected"
                ? "rejected"
                : "pending"
          }`}
        >
          {row.status}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-600">
        <span>
          <strong>Type:</strong> {row.type}
        </span>
        <span>
          <strong>Days:</strong> {row.days}
        </span>
        <span>
          <strong>From:</strong> {row.from}
        </span>
        <span>
          <strong>To:</strong> {row.to}
        </span>
        <span className="sm:col-span-2">
          <strong>Reason:</strong> {row.reason}
        </span>
        <span>
          <strong>Applied:</strong> {row.appliedOn}
        </span>
        {row.actionBy && (
          <span>
            <strong>Action:</strong> {row.actionBy} on {row.actionOn}
          </span>
        )}
      </div>
      {showActions && (
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => onApprove(row.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => onReject(row.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

function ImportHolidayCalendarModal({ onClose, onImported }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const { holidays, errors } = parseHolidayCsv(String(reader.result || ""));
        setImporting(true);
        await importHolidays(holidays);
        if (errors.length) {
          successToast(
            `Imported ${holidays.length} holiday(s). ${errors.length} row(s) were skipped.`
          );
        } else {
          successToast(`Imported ${holidays.length} holiday(s) successfully.`);
        }
        onImported();
        onClose();
      } catch (err) {
        const message =
          err?.response?.data?.message || err?.message || "Failed to import holiday calendar.";
        setError(message);
        errorToast(message);
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      setError("Could not read the selected file.");
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-semibold text-gray-900">Import Holiday Calendar</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-600">
            Upload a CSV file with columns <strong>Holiday Name</strong> and{" "}
            <strong>Date</strong> (YYYY-MM-DD). Optional columns:{" "}
            <strong>Shift</strong>, <strong>Location</strong>, <strong>Restricted</strong>.
          </p>

          {/* Template download banner */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            background:"#fff8f0", border:"1px solid #fed7aa", borderRadius:10,
            padding:"10px 14px",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:18 }}>📥</span>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#92400e" }}>Not sure about the format?</div>
                <div style={{ fontSize:11, color:"#b45309" }}>Download the template and fill it in</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const a = document.createElement("a");
                a.href = "/templates/holiday_import_template.csv";
                a.download = "holiday_import_template.csv";
                a.click();
              }}
              style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:700,
                background:"#f18200", color:"#fff", border:"none", cursor:"pointer",
                whiteSpace:"nowrap",
              }}
            >
              ⬇ Download Template
            </button>
          </div>

          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-center cursor-pointer hover:border-brand hover:bg-brand-50/40">
            <Upload size={24} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {fileName || "Click to choose a CSV file"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={importing}
            />
          </label>

          {importing && <p className="text-sm text-brand">Importing holidays...</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLeaveDashboard() {
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestTab, setRequestTab] = useState(location.state?.tab ?? "pending");
  const [highlightRequestId, setHighlightRequestId] = useState(
    location.state?.requestId ?? null
  );
  const [statFilter, setStatFilter] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const requestsPanelRef = useRef(null);
  const statDetailRef = useRef(null);

  const loadRequests = () => {
    setLoading(true);
    return listLeaveRequests({ limit: 100 })
      .then(({ data }) => {
        setRequests((data || []).map(mapRequest));
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (location.state?.tab) {
      setRequestTab(location.state.tab);
    }
    if (location.state?.requestId) {
      setHighlightRequestId(location.state.requestId);
      setRequestTab("pending");
      setTimeout(() => {
        requestsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        document
          .getElementById(`leave-request-${location.state.requestId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, [location.state]);

  const pending = useMemo(
    () => requests.filter((r) => r.status === "Pending"),
    [requests]
  );
  const approved = useMemo(
    () => requests.filter((r) => r.status === "Approved"),
    [requests]
  );
  const rejected = useMemo(
    () => requests.filter((r) => r.status === "Rejected"),
    [requests]
  );
  const onLeaveToday = useMemo(
    () => getApprovedLeavesToday(requests, today),
    [requests]
  );
  const approvedThisMonth = useMemo(
    () => countApprovedThisMonth(requests, today),
    [requests]
  );

  const requestChart = useMemo(
    () => [
      { label: "Pending", value: pending.length, color: "#f97316" },
      { label: "Approved", value: approved.length, color: "#22c55e" },
      { label: "Rejected", value: rejected.length, color: "#ef4444" },
    ],
    [pending.length, approved.length, rejected.length]
  );

  const tabRows =
    requestTab === "pending"
      ? pending
      : requestTab === "approved"
        ? approved
        : rejected;

  const statDetailRows =
    statFilter === "pending"
      ? pending
      : statFilter === "approved"
        ? approved.filter((r) => {
            const d = new Date(r.from);
            return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
          })
        : statFilter === "teamOut"
          ? onLeaveToday
          : [];

  const statDetailTitle =
    statFilter === "pending"
      ? "All Pending Requests"
      : statFilter === "approved"
        ? "Approved This Month"
        : statFilter === "teamOut"
          ? "Team Out Today"
          : "";

  const handleApprove = (id) => {
    setRequests((curr) =>
      curr.map((r) =>
        r.id === id
          ? { ...r, status: "Approved", actionOn: formatActionDate() }
          : r
      )
    );
    reviewLeaveRequest(id, { decision: "Approved" })
      .then(() => {
        successToast("Leave request approved.");
        loadRequests();
      })
      .catch((err) => {
        errorToast(err?.response?.data?.message || "Failed to approve leave request.");
        loadRequests();
      });
  };

  const handleReject = (id) => {
    setRequests((curr) =>
      curr.map((r) =>
        r.id === id
          ? { ...r, status: "Rejected", actionOn: formatActionDate() }
          : r
      )
    );
    reviewLeaveRequest(id, { decision: "Rejected", remarks: "Rejected by admin" })
      .then(() => {
        successToast("Leave request rejected.");
        loadRequests();
      })
      .catch((err) => {
        errorToast(err?.response?.data?.message || "Failed to reject leave request.");
        loadRequests();
      });
  };

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openStat = (filter) => {
    setStatFilter(filter);
    if (filter === "pending") setRequestTab("pending");
    if (filter === "approved") setRequestTab("approved");
    setTimeout(() => scrollTo(statDetailRef), 0);
  };

  return (
    <div className="admin-dash space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor team leave, requests, and availability across all employees
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Upload size={16} />
          Import Holiday Calendar
        </button>
      </div>

      {showImportModal && (
        <ImportHolidayCalendarModal
          onClose={() => setShowImportModal(false)}
          onImported={() => {}}
        />
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Leave Overview by Type
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ADMIN_LEAVE_SUMMARY.map((item) => (
            <LeaveTypeCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Quick Stats — click to view full list
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickStatCard
            icon={Clock}
            value={pending.length}
            label="Pending Requests"
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            active={statFilter === "pending"}
            onClick={() => openStat("pending")}
          />
          <QuickStatCard
            icon={Users}
            value={onLeaveToday.length}
            label="Team Out Today"
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
            active={statFilter === "teamOut"}
            onClick={() => openStat("teamOut")}
          />
          <QuickStatCard
            icon={FileText}
            value={approvedThisMonth}
            label="Approved This Month"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            active={statFilter === "approved"}
            onClick={() => openStat("approved")}
          />
        </div>

        {statFilter && (
          <div ref={statDetailRef} className="admin-detail-panel mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{statDetailTitle}</h3>
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-gray-800"
                onClick={() => setStatFilter(null)}
              >
                Close
              </button>
            </div>
            <LeaveEmployeeDetailTable
              rows={statDetailRows}
              emptyMessage="No records for this filter."
            />
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Analytics
        </h2>
        <div className="admin-charts-grid admin-charts-grid--2">
          <div className="admin-dash-card">
            <AdminGroupedBarChart
              title="Monthly Leave Usage"
              subtitle="Sick, Earned & Casual leave days consumed"
              data={ADMIN_LEAVE_MONTHLY_CHART}
              series={ADMIN_LEAVE_MONTHLY_SERIES}
              yLabel="Days"
              height={200}
            />
          </div>
          <div className="admin-dash-card">
            <AdminDonutChart
              title="Request Status"
              subtitle="Live counts from employee requests"
              segments={requestChart}
              centerValue={requests.length}
              centerLabel="Total"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="admin-dash-card">
          <TeamAvailabilityCalendar
            requests={requests}
            totalEmployees={ADMIN_TOTAL_EMPLOYEES}
            purposeText={CALENDAR_PURPOSE}
            initialDate={today}
          />
        </div>

        <div ref={requestsPanelRef} className="admin-dash-card flex flex-col min-h-[420px]">
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900">Employee Requests</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4 mt-2">
            <button
              type="button"
              className={`admin-tab-btn ${requestTab === "pending" ? "active" : ""}`}
              onClick={() => setRequestTab("pending")}
            >
              Pending ({pending.length})
            </button>
            <button
              type="button"
              className={`admin-tab-btn ${requestTab === "approved" ? "active" : ""}`}
              onClick={() => setRequestTab("approved")}
            >
              Completed ({approved.length})
            </button>
            <button
              type="button"
              className={`admin-tab-btn ${requestTab === "rejected" ? "active" : ""}`}
              onClick={() => setRequestTab("rejected")}
            >
              Rejected ({rejected.length})
            </button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[360px] pr-1">
            {loading ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Loading requests...
              </p>
            ) : tabRows.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No {requestTab} requests.
              </p>
            ) : (
              tabRows.map((row) => (
                <RequestRow
                  key={row.id}
                  row={row}
                  showActions={requestTab === "pending"}
                  highlight={highlightRequestId === row.id}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <section className="admin-dash-card">
        <h3 className="font-semibold text-gray-900 mb-4">All Employees on Leave Today</h3>
        <LeaveEmployeeDetailTable
          rows={onLeaveToday.map((r) => ({ ...r, status: "Approved" }))}
          emptyMessage="No employees on approved leave today."
        />
      </section>

      <section className="admin-dash-card">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Leave Policy Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ADMIN_LEAVE_POLICIES.map((p) => (
            <div key={p.title}>
              <p className="font-semibold text-gray-800 text-sm mb-1">{p.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
