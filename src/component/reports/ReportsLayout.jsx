import React from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { REPORT_NAV } from "../../data/reportsData";
import ProjectReport from "../../pages/admin/reports/ProjectReport";
import TaskReport from "../../pages/admin/reports/TaskReport";
import EmployeeReport from "../../pages/admin/reports/EmployeeReport";
import AttendanceReport from "../../pages/admin/reports/AttendanceReport";
import LeaveReport from "../../pages/admin/reports/LeaveReport";
import DailyReport from "../../pages/admin/reports/DailyReport";
import DownloadReports from "../../pages/admin/reports/DownloadReports";
import PayslipReport from "../../pages/admin/reports/PayslipReport";
import UserReport from "../../pages/admin/reports/UserReport";
import EmptyStateReport from "../../pages/admin/reports/EmptyStateReport";
import "./reports.css";

export default function ReportsLayout() {
  return (
    <div className="reports-hub">
      <header className="reports-header">
        <nav className="reports-header-tabs" aria-label="Report types">
          {REPORT_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={`/dashboard/report/${item.path}`}
              className={({ isActive }) =>
                `reports-header-tabs__link${isActive ? " active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="reports-content">
        <Routes>
          <Route index element={<Navigate to="daily" replace />} />
          <Route path="project" element={<ProjectReport />} />
          <Route path="task" element={<TaskReport />} />
          <Route path="employee" element={<EmployeeReport />} />
          <Route path="attendance" element={<AttendanceReport />} />
          <Route path="leave" element={<LeaveReport />} />
          <Route path="daily" element={<DailyReport />} />
          <Route path="expense" element={<EmptyStateReport type="expense" />} />
          <Route path="invoice" element={<EmptyStateReport type="invoice" />} />
          <Route path="payment" element={<EmptyStateReport type="payment" />} />
          <Route path="user" element={<UserReport />} />
          <Route path="payslip" element={<PayslipReport />} />
          <Route path="downloads" element={<DownloadReports />} />
          <Route path="*" element={<Navigate to="daily" replace />} />
        </Routes>
      </div>
    </div>
  );
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
    </div>
  );
}

export function ReportAvatar({ name, size = "md" }) {
  return (
    <span
      className={`report-avatar report-avatar--${size}`}
      style={{ backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </span>
  );
}

function getInitials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
      {barWidth != null && (
        <div className="report-stat-card__bar">
          <span style={{ width: `${barWidth}%`, background: barColor }} />
        </div>
      )}
      {trend && (
        <p className={`report-stat-card__trend ${positive ? "is-up" : "is-down"}`}>
          ~ {trend}
        </p>
      )}
    </div>
  );
}

export function ReportIconStatCard({ label, value, icon, color, trend, fraction }) {
  return (
    <div className="report-icon-stat">
      <div className="report-icon-stat__top">
        <div>
          <p className="report-icon-stat__label">{label}</p>
          <p className="report-icon-stat__value">{value}</p>
        </div>
        {fraction ? (
          <span className="report-icon-stat__fraction">{fraction}</span>
        ) : (
          <span className="report-icon-stat__icon" style={{ background: color }}>
            {icon}
          </span>
        )}
      </div>
      {trend && <p className="report-icon-stat__trend">~ {trend}</p>}
    </div>
  );
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
        {filters && (
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
        )}
      </div>
    </>
  );
}

export function ReportPriorityBadge({ priority }) {
  const cls = {
    Low: "report-priority--low",
    Medium: "report-priority--medium",
    High: "report-priority--high",
  }[priority] || "report-priority--low";
  return (
    <span className={`report-priority ${cls}`}>
      <span className="report-priority__dot" />
      {priority}
    </span>
  );
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
    Processing: "report-status--pending",
  }[status] || "report-status--active";
  return <span className={`report-status ${cls}`}>{status}</span>;
}
