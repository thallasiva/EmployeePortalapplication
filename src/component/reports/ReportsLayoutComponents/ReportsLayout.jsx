import React from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { REPORT_NAV } from "../../../data/reportsData";
import { ProjectReport, TaskReport, EmployeeReport, AttendanceReport, LeaveReport, DailyReport, DownloadReports, PayslipReport, UserReport, EmptyStateReport } from "./shared";
import { ReportRoute } from "./ReportRoute";
function ReportsLayout() {
  return <div className="reports-hub">
      <header className="reports-header">
        <nav className="reports-header-tabs" aria-label="Report types">
          {REPORT_NAV.map(item => <NavLink key={item.path} to={`/dashboard/report/${item.path}`} className={({
          isActive
        }) => `reports-header-tabs__link${isActive ? " active" : ""}`}>
              {item.label}
            </NavLink>)}
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
          <Route path="*" element={<Navigate to="/dashboard/report/daily" replace />} />
        </Routes>
      </div>
    </div>;
}
export { ReportsLayout };
