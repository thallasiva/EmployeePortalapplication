import React, { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getHomePath, getStoredUser, isReportingManager } from "../data/auth";
import LazyPage from "./LazyPage";

const ManagerDashboard = lazy(() => import("../pages/manager/ManagerDashboard"));
const TeamAttendance = lazy(() => import("../pages/manager/TeamAttendance"));
const TeamLeaveRequests = lazy(() => import("../pages/manager/TeamLeaveRequests"));
const TeamRegularizations = lazy(() => import("../pages/manager/TeamRegularizations"));
const PerformanceApprisial = lazy(() => import("../pages/manager/PerformanceApprisial"));
const TeamAttendanceAppraisal = lazy(() => import("../pages/manager/TeamAttendanceAppraisal"));
const ManagerTimesheets = lazy(() => import("../pages/manager/ManagerTimesheets"));
const TeamResignations = lazy(() => import("../pages/manager/TeamResignations"));
const ManagerHelpdesk = lazy(() => import("../pages/admin/helpdesk/HelpdeskAdmin"));


const Page = LazyPage;

const ManagerRoutes = () =>
{
  const user = getStoredUser();
  // if (!isReportingManager(user)) return <Navigate to={getHomePath(user)} replace />;
  if (!user)
    return <Navigate to="/login" replace />;
  return (
    <Routes>
      <Route index element={<Page><ManagerDashboard /></Page>} />
      <Route path="team/attendance" element={<Page><TeamAttendance /></Page>} />
      <Route path="team/leave" element={<Page><TeamLeaveRequests /></Page>} />
      <Route path="team/regularizations" element={<Page><TeamRegularizations /></Page>} />
      <Route path="team/performance" element={<Page><PerformanceApprisial /></Page>} />
      <Route path="team/appraisal-attendance" element={<Page><TeamAttendanceAppraisal /></Page>} />
      <Route path="timesheets" element={<Page><ManagerTimesheets /></Page>} />
      <Route path="team/resignations" element={<Page><TeamResignations /></Page>} />
      <Route path="helpdesk" element={<Page><ManagerHelpdesk /></Page>} />
      <Route path="*" element={<Navigate to="/manager" replace />} />
    </Routes>
  );
};

export default ManagerRoutes;
