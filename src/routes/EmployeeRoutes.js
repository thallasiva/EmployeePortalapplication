import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getStoredUser, isEmployee, isReportingManager } from "../data/auth";
import { PATH_ADMIN_HOME } from "./paths";
import LoadingFallback from "../component/LoadingFallback";
import ErrorBoundary from "../component/ErrorBoundary";

// ── Lazy imports ─────────────────────────────────────────────────────────────
const EmployeeDashboard   = lazy(() => import("../pages/employee/Dashboard/EmployeeDashboard"));
const AttendanceInfo      = lazy(() => import("../pages/employee/attendance/AttendanceInfo"));
const MyRegularizations   = lazy(() => import("../pages/employee/attendance/MyRegularizations"));
const AttendanceMuster    = lazy(() => import("../pages/employee/attendance/AttendanceMuster"));
const ShiftRoster         = lazy(() => import("../pages/employee/attendance/ShiftRoster"));
const LeaveBalances       = lazy(() => import("../pages/employee/leave/LeaveBalance"));
const LeaveApply          = lazy(() => import("../pages/employee/leave/LeaveApply"));
const LeaveCalendar       = lazy(() => import("../pages/employee/leave/LeaveCalendar"));
const HolidayCalendar     = lazy(() => import("../pages/employee/leave/HolidayCalendar"));
const Payslips            = lazy(() => import("../pages/employee/salary/Payslips"));
const ITDeclaration       = lazy(() => import("../pages/employee/salary/ITDeclaration"));
const ITStatement         = lazy(() => import("../pages/employee/salary/ITStatement"));
const Reimbursement       = lazy(() => import("../pages/employee/salary/Reimbursement"));
const ProofInvestment     = lazy(() => import("../pages/employee/salary/ProofInvestment"));
const Loans               = lazy(() => import("../pages/employee/salary/Loans"));
const YTDReports          = lazy(() => import("../pages/employee/salary/YTDReports"));
const SalaryRevision      = lazy(() => import("../pages/employee/salary/SalaryRevision"));
const DocumentCenter      = lazy(() => import("../pages/employee/documents/DocumentCenter"));
const Helpdesk            = lazy(() => import("../pages/employee/helpdesk/Helpdesk"));
const Engage              = lazy(() => import("../pages/employee/engage/Engage"));
const Kudos               = lazy(() => import("../pages/employee/worklife/Kudos"));
const Feedback            = lazy(() => import("../pages/employee/worklife/Feedback"));
const Tasks               = lazy(() => import("../pages/employee/tasks/Tasks"));
const TaskReview          = lazy(() => import("../pages/employee/tasks/Review"));
const People              = lazy(() => import("../pages/employee/people/People"));
const OrganizationChart   = lazy(() => import("../pages/employee/people/OrganizationChart"));
const Hiring              = lazy(() => import("../pages/employee/hiring/Hiring"));
const RequestHub          = lazy(() => import("../pages/employee/request/RequestHub"));
const WorkflowDelegates   = lazy(() => import("../pages/employee/workflow/WorkflowDelegates"));
const MyInfo              = lazy(() => import("../pages/employee/myinfo/MyInfo"));
const Resignation         = lazy(() => import("../pages/employee/myinfo/Resignation"));
const SelfAppraisal       = lazy(() => import("../pages/employee/appraisal/SelfAppraisal"));

function Page({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

const EmployeeRoutes = () => {
  const user = getStoredUser();
  if (!isEmployee(user) && !isReportingManager(user)) {
    return <Navigate to={PATH_ADMIN_HOME} replace />;
  }

  return (
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home"                     element={<Page><EmployeeDashboard /></Page>} />
      <Route path="engage"                   element={<Page><Engage /></Page>} />
      <Route path="engine"                   element={<Navigate to="/employee/engage" replace />} />
      <Route path="todo/tasks"               element={<Page><Tasks /></Page>} />
      <Route path="todo/review"              element={<Page><TaskReview /></Page>} />
      <Route path="worklife/kudos"           element={<Page><Kudos /></Page>} />
      <Route path="worklife/feedback"        element={<Page><Feedback /></Page>} />
      <Route path="attendance/daily"         element={<Page><AttendanceInfo /></Page>} />
      <Route path="attendance/regularizations" element={<Page><MyRegularizations /></Page>} />
      <Route path="attendance/monthly"       element={<Page><AttendanceMuster /></Page>} />
      <Route path="attendance/shifts"        element={<Page><ShiftRoster /></Page>} />
      <Route path="leave/balance"            element={<Page><LeaveBalances /></Page>} />
      <Route path="leave/apply"              element={<Page><LeaveApply /></Page>} />
      <Route path="leave/calendar"           element={<Page><LeaveCalendar /></Page>} />
      <Route path="leave/holiday-calendar"   element={<Page><HolidayCalendar /></Page>} />
      <Route path="payroll/payslips"         element={<Page><Payslips /></Page>} />
      <Route path="payroll/it-declaration"   element={<Page><ITDeclaration /></Page>} />
      <Route path="payroll/it-statement"     element={<Page><ITStatement /></Page>} />
      <Route path="payroll/reimbursements"   element={<Page><Reimbursement /></Page>} />
      <Route path="payroll/claims"           element={<Page><ProofInvestment /></Page>} />
      <Route path="payroll/loans"            element={<Page><Loans /></Page>} />
      <Route path="payroll/ytd-reports"      element={<Page><YTDReports /></Page>} />
      <Route path="payroll/salary-revision"  element={<Page><SalaryRevision /></Page>} />
      <Route path="hiring"                   element={<Page><Hiring /></Page>} />
      <Route path="documents"                element={<Page><DocumentCenter /></Page>} />
      <Route path="documents/upload"         element={<Page><DocumentCenter /></Page>} />
      <Route path="people"                   element={<Page><People /></Page>} />
      <Route path="org-chart"                element={<Page><OrganizationChart /></Page>} />
      <Route path="helpdesk"                 element={<Page><Helpdesk /></Page>} />
      <Route path="request-hub"              element={<Page><RequestHub /></Page>} />
      <Route path="workflow-delegates"       element={<Page><WorkflowDelegates /></Page>} />
      <Route path="my-info"                  element={<Page><MyInfo /></Page>} />
      <Route path="resignation"             element={<Page><Resignation /></Page>} />
      <Route path="appraisal"               element={<Page><SelfAppraisal /></Page>} />
    </Routes>
  );
};

export default EmployeeRoutes;
