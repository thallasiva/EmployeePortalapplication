/**
 * AdminRoutes — lazy-loaded
 * ─────────────────────────
 * Each page is a separate Webpack chunk. The browser only downloads a
 * page's JS when the user first navigates to that route, keeping the
 * initial bundle small.
 *
 * React.lazy + Suspense pattern:
 *  • React.lazy(() => import("…")) — deferred chunk download
 *  • <Suspense fallback={<LoadingFallback />}> — shows spinner during load
 *  • <ErrorBoundary> inside each route via PageWrapper — isolates crashes
 */
import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getStoredUser, isAdmin } from "../data/auth";
import { PATH_EMPLOYEE_HOME } from "./paths";
import LoadingFallback from "../component/LoadingFallback";
import ErrorBoundary from "../component/ErrorBoundary";

// ── Lazy page imports ────────────────────────────────────────────────────────
const Dashboard              = lazy(() => import("../pages/admin/Dashboard"));
const Employee               = lazy(() => import("../pages/admin/Employee"));
const EmployeeDetail         = lazy(() => import("../pages/admin/EmployeeDetail"));
const CreateEmployee         = lazy(() => import("../pages/admin/CreateEmployee"));
const Company                = lazy(() => import("../pages/admin/Company"));
const CreateCompany          = lazy(() => import("../pages/admin/CreateCompany"));
const CalendarForm           = lazy(() => import("../pages/admin/CalendarForm"));
const AdminCalendar          = lazy(() => import("../pages/admin/Calendar"));
const Leave                  = lazy(() => import("../pages/admin/AdminLeaveManagement"));
const AdminAttendanceDashboard = lazy(() => import("../pages/admin/AdminAttendanceDashboard"));
const AdminDocuments         = lazy(() => import("../pages/admin/AdminDocuments"));
const AddDocumentScreen      = lazy(() => import("../pages/admin/AddDocumentScreen"));
const Reports                = lazy(() => import("../pages/admin/Report"));
const PayRollForm            = lazy(() => import("../pages/admin/PayRollForm"));
const AdminPayslips          = lazy(() => import("../pages/admin/AdminPayslips"));
const AdminPerformanceRollout = lazy(() => import("../pages/admin/AdminPerformanceRollout"));
const AdminITDeclaration      = lazy(() => import("../pages/admin/AdminITDeclaration"));
const AdminResignations       = lazy(() => import("../pages/admin/AdminResignations"));
const AdminTimesheets        = lazy(() => import("../pages/admin/AdminTimesheets"));
const Onboarding             = lazy(() => import("../pages/admin/Onboarding"));
const Manage                 = lazy(() => import("../pages/admin/Manage"));
const ManagePermissions      = lazy(() => import("../pages/admin/ManagePermissions"));
const Settings               = lazy(() => import("../pages/admin/Settings"));
const Profile                = lazy(() => import("../pages/admin/Profile"));
const MfaSetup               = lazy(() => import("../pages/admin/MfaSetup"));
const LeaveSummaryReport     = lazy(() => import("../pages/admin/LeaveSummaryReport"));
const HelpdeskAdmin          = lazy(() => import("../pages/admin/helpdesk/HelpdeskAdmin"));

// ── Suspense wrapper ─────────────────────────────────────────────────────────
// Each route gets its own ErrorBoundary so one crash doesn't unmount the rest.
function Page({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

const AdminRoutes = () => {
  const user = getStoredUser();
  if (!isAdmin(user)) return <Navigate to={PATH_EMPLOYEE_HOME} replace />;

  return (
    <Routes>
      <Route index                               element={<Page><Dashboard /></Page>} />
      <Route path="employee"                     element={<Page><Employee /></Page>} />
      <Route path="employee/:id"                 element={<Page><EmployeeDetail /></Page>} />
      <Route path="create-employee"              element={<Page><CreateEmployee /></Page>} />
      <Route path="company"                      element={<Page><Company /></Page>} />
      <Route path="create-company"               element={<Page><CreateCompany /></Page>} />
      <Route path="calendar"                     element={<Page><AdminCalendar /></Page>} />
      <Route path="calendar/form"               element={<Page><CalendarForm /></Page>} />
      <Route path="leave"                        element={<Page><Leave /></Page>} />
      <Route path="attendance"                   element={<Page><AdminAttendanceDashboard /></Page>} />
      <Route path="documents"                    element={<Page><AdminDocuments /></Page>} />
      <Route path="add-document"                 element={<Page><AddDocumentScreen /></Page>} />
      <Route path="payroll"                      element={<Page><PayRollForm /></Page>} />
      <Route path="payroll/payslips"             element={<Page><AdminPayslips /></Page>} />
      <Route path="performance"                  element={<Page><AdminPerformanceRollout /></Page>} />
      <Route path="it-declaration"               element={<Page><AdminITDeclaration /></Page>} />
      <Route path="resignations"                element={<Page><AdminResignations /></Page>} />
      <Route path="timesheets"                   element={<Page><AdminTimesheets /></Page>} />
      <Route path="report/*"                     element={<Page><Reports /></Page>} />
      <Route path="onboarding"                   element={<Page><Onboarding /></Page>} />
      <Route path="manage"                       element={<Page><Manage /></Page>} />
      <Route path="manage/permissions/:roleSlug" element={<Page><ManagePermissions /></Page>} />
      <Route path="settings"                     element={<Page><Settings /></Page>} />
      <Route path="profile"                      element={<Page><Profile /></Page>} />
      <Route path="security/mfa"                 element={<Page><MfaSetup /></Page>} />
      <Route path="leave/summary"               element={<Page><LeaveSummaryReport /></Page>} />
      <Route path="helpdesk"                    element={<Page><HelpdeskAdmin /></Page>} />
    </Routes>
  );
};

export default AdminRoutes;
