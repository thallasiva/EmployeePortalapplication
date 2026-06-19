import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ManagerDashboard from "../pages/manager/ManagerDashboard";
import TeamAttendance from "../pages/manager/TeamAttendance";
import TeamLeaveRequests from "../pages/manager/TeamLeaveRequests";
import TeamRegularizations from "../pages/manager/TeamRegularizations";
import { getHomePath, getStoredUser, isReportingManager } from "../data/auth";
import PerformanceApprisial from "../pages/manager/PerformanceApprisial";
import TeamAttendanceAppraisal from "../pages/manager/TeamAttendanceAppraisal";
import ManagerTimesheets from "../pages/manager/ManagerTimesheets";

const ManagerRoutes = () => {
  const user = getStoredUser();

  if (!isReportingManager(user)) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return (
    <Routes>
      <Route index element={<ManagerDashboard />} />
      <Route path="team/attendance" element={<TeamAttendance />} />
      <Route path="team/leave" element={<TeamLeaveRequests />} />
      <Route path="team/regularizations" element={<TeamRegularizations />} />
      <Route path="team/performance" element={<PerformanceApprisial />} />
      <Route path="team/appraisal-attendance" element={<TeamAttendanceAppraisal />} />
      <Route path="timesheets" element={<ManagerTimesheets />} />
    </Routes>
  );
};

export default ManagerRoutes;
