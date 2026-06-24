import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getHomePath, getStoredUser, isReportingManager } from "../data/auth";
import LoadingFallback from "../component/LoadingFallback";
import ErrorBoundary from "../component/ErrorBoundary";

const ManagerDashboard        = lazy(() => import("../pages/manager/ManagerDashboard"));
const TeamAttendance          = lazy(() => import("../pages/manager/TeamAttendance"));
const TeamLeaveRequests       = lazy(() => import("../pages/manager/TeamLeaveRequests"));
const TeamRegularizations     = lazy(() => import("../pages/manager/TeamRegularizations"));
const PerformanceApprisial    = lazy(() => import("../pages/manager/PerformanceApprisial"));
const TeamAttendanceAppraisal = lazy(() => import("../pages/manager/TeamAttendanceAppraisal"));
const ManagerTimesheets       = lazy(() => import("../pages/manager/ManagerTimesheets"));
const TeamResignations        = lazy(() => import("../pages/manager/TeamResignations"));

function Page({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

const ManagerRoutes = () => {
  const user = getStoredUser();
  if (!isReportingManager(user)) return <Navigate to={getHomePath(user)} replace />;

  return (
    <Routes>
      <Route index                              element={<Page><ManagerDashboard /></Page>} />
      <Route path="team/attendance"             element={<Page><TeamAttendance /></Page>} />
      <Route path="team/leave"                  element={<Page><TeamLeaveRequests /></Page>} />
      <Route path="team/regularizations"        element={<Page><TeamRegularizations /></Page>} />
      <Route path="team/performance"            element={<Page><PerformanceApprisial /></Page>} />
      <Route path="team/appraisal-attendance"   element={<Page><TeamAttendanceAppraisal /></Page>} />
      <Route path="timesheets"                  element={<Page><ManagerTimesheets /></Page>} />
      <Route path="team/resignations"           element={<Page><TeamResignations /></Page>} />
    </Routes>
  );
};

export default ManagerRoutes;
