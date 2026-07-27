import React, { lazy } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { REPORT_NAV } from "../../data/reportsData";
import LazyPage from "../../routes/LazyPage";
import "./reports.css";import { cssClass, joinClasses } from "../../utils/classStyles";

const ProjectReport = lazy(() => import("../../pages/admin/reports/ProjectReport"));
const TaskReport = lazy(() => import("../../pages/admin/reports/TaskReport"));
const EmployeeReport = lazy(() => import("../../pages/admin/reports/EmployeeReport"));
const AttendanceReport = lazy(() => import("../../pages/admin/reports/AttendanceReport"));
const LeaveReport = lazy(() => import("../../pages/admin/reports/LeaveReport"));
const DailyReport = lazy(() => import("../../pages/admin/reports/DailyReport"));
const DownloadReports = lazy(() => import("../../pages/admin/reports/DownloadReports"));
const PayslipReport = lazy(() => import("../../pages/admin/reports/PayslipReport"));
const UserReport = lazy(() => import("../../pages/admin/reports/UserReport"));
const EmptyStateReport = lazy(() => import("../../pages/admin/reports/EmptyStateReport"));

const ReportRoute = ({ children }) => (
  <LazyPage label="Loading report...">{children}</LazyPage>
);

export default function ReportsLayout() {
  return (
    <div className="reports-hub">
      <header className="reports-header">
        <nav className="reports-header-tabs" aria-label="Report types">
          {REPORT_NAV.map((item) =>
          <NavLink
            key={item.path}
            to={`/dashboard/report/${item.path}`}
            className={({ isActive }) =>
            `reports-header-tabs__link${isActive ? " active" : ""}`
            }>

              {item.label}
            </NavLink>
          )}
        </nav>
      </header>

      <div className="reports-content">
        <Routes>
          <Route index element={<Navigate to="daily" replace />} />
          <Route path="project" element={<ReportRoute><ProjectReport /></ReportRoute>} />
          <Route path="task" element={<ReportRoute><TaskReport /></ReportRoute>} />
          <Route path="employee" element={<ReportRoute><EmployeeReport /></ReportRoute>} />
          <Route path="attendance" element={<ReportRoute><AttendanceReport /></ReportRoute>} />
          <Route path="leave" element={<ReportRoute><LeaveReport /></ReportRoute>} />
          <Route path="daily" element={<ReportRoute><DailyReport /></ReportRoute>} />
          <Route path="expense" element={<ReportRoute><EmptyStateReport type="expense" /></ReportRoute>} />
          <Route path="invoice" element={<ReportRoute><EmptyStateReport type="invoice" /></ReportRoute>} />
          <Route path="payment" element={<ReportRoute><EmptyStateReport type="payment" /></ReportRoute>} />
          <Route path="user" element={<ReportRoute><UserReport /></ReportRoute>} />
          <Route path="payslip" element={<ReportRoute><PayslipReport /></ReportRoute>} />
          <Route path="downloads" element={<ReportRoute><DownloadReports /></ReportRoute>} />
          <Route path="*" element={<Navigate to="daily" replace />} />
        </Routes>
      </div>
    </div>);

}

export function ReportPageHeader({ title }) {
  return (
    <div className="report-header">
      <div>
        <h1 className="report-header__title">{title}</h1>

      </div>
      <button type="button" className="report-header__export">
        Export
        <span className="report-header__export-arrow">▾</span>
      </button>
    </div>);

}

export function ReportAvatar({ name, size = "md" }) {
  return (
    <span
      className={joinClasses(`report-avatar report-avatar--${size}`, cssClass(
        { backgroundColor: getAvatarColor(name) }))}>

      {getInitials(name)}
    </span>);

}

function getInitials(name) {
  return name.
  split(" ").
  map((p) => p[0]).
  join("").
  slice(0, 2).
  toUpperCase();
}

function getAvatarColor(name) {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#3b82f6"];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function ReportStatCard({ label, value, trend, positive, barColor, barWidth }) {
  return (
    <div className="report-stat-card">
      <p className="report-stat-card__label">{label}</p>
      <p className="report-stat-card__value">{value}</p>
      {barWidth != null &&
      <div className="report-stat-card__bar">
          <span className={cssClass({ width: `${barWidth}%`, background: barColor })} />
        </div>
      }
      {trend &&
      <p className={`report-stat-card__trend ${positive ? "is-up" : "is-down"}`}>
          ~ {trend}
        </p>
      }
    </div>);

}

export function ReportIconStatCard({ label, value, icon, color, trend, fraction }) {
  return (
    <div className="report-icon-stat">
      <div className="report-icon-stat__top">
        <div>
          <p className="report-icon-stat__label">{label}</p>
          <p className="report-icon-stat__value">{value}</p>
        </div>
        {fraction ?
        <span className="report-icon-stat__fraction">{fraction}</span> :

        <span className={joinClasses("report-icon-stat__icon", cssClass({ background: color }))}>
            {icon}
          </span>
        }
      </div>
      {trend && <p className="report-icon-stat__trend">~ {trend}</p>}
    </div>);

}

export function ReportTableToolbar({ title, filters = true }) {
  return (
    <>
      {title && <h2 className="report-table-section__title">{title}</h2>}
      <div className="report-table-toolbar">
        <div className="report-table-toolbar__left">
          <span className="report-table-toolbar__rows">
            Row Per Page <select defaultValue="10"><option>10</option><option>25</option></select> Entries
          </span>
        </div>
        {filters &&
        <div className="report-table-toolbar__filters">
            <button type="button" className="report-filter-btn">29/05/2026 - 29/05/2026</button>
            <select className="report-filter-select" defaultValue="">
              <option value="">Select Status</option>
              <option>Active</option>
              <option>Pending</option>
            </select>
            <select className="report-filter-select" defaultValue="7">
              <option value="7">Sort By : Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
            <input type="search" className="report-search" placeholder="Search" />
          </div>
        }
      </div>
    </>);

}

export function ReportPriorityBadge({ priority }) {
  const cls = {
    Low: "report-priority--low",
    Medium: "report-priority--medium",
    High: "report-priority--high"
  }[priority] || "report-priority--low";
  return (
    <span className={`report-priority ${cls}`}>
      <span className="report-priority__dot" />
      {priority}
    </span>);

}

export function ReportStatusBadge({ status }) {
  const cls = {
    Active: "report-status--active",
    Completed: "report-status--completed",
    Pending: "report-status--pending",
    Inprogress: "report-status--inprogress",
    "On Hold": "report-status--hold",
    Present: "report-status--present",
    Late: "report-status--pending",
    Absent: "report-status--rejected",
    "On Leave": "report-status--inprogress",
    Weekend: "report-status--hold",
    Approved: "report-status--approved",
    Rejected: "report-status--rejected",
    Paid: "report-status--approved",
    Sent: "report-status--inprogress",
    "Partially Paid": "report-status--hold",
    Generated: "report-status--approved",
    Processing: "report-status--pending"
  }[status] || "report-status--active";
  return <span className={`report-status ${cls}`}>{status}</span>;
}
