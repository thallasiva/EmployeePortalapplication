import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import EmployeeDashboard from "../pages/employee/Dashboard/EmployeeDashboard";
import AttendanceInfo from "../pages/employee/attendance/AttendanceInfo";
import MyRegularizations from "../pages/employee/attendance/MyRegularizations";
import AttendanceMuster from "../pages/employee/attendance/AttendanceMuster";
import ShiftRoster from "../pages/employee/attendance/ShiftRoster";
import LeaveBalances from "../pages/employee/leave/LeaveBalance";
import LeaveApply from "../pages/employee/leave/LeaveApply";
import LeaveCalendar from "../pages/employee/leave/LeaveCalendar";
import HolidayCalendar from "../pages/employee/leave/HolidayCalendar";
import Payslips from "../pages/employee/salary/Payslips";
import ITDeclaration from "../pages/employee/salary/ITDeclaration";
import ITStatement from "../pages/employee/salary/ITStatement";
import Reimbursement from "../pages/employee/salary/Reimbursement";
import ProofInvestment from "../pages/employee/salary/ProofInvestment";
import AddDocumentScreen from "../pages/admin/AddDocumentScreen";
import DocumentCenter from "../pages/employee/documents/DocumentCenter";
import Helpdesk from "../pages/employee/helpdesk/Helpdesk";
import Engage from "../pages/employee/engage/Engage";
import Kudos from "../pages/employee/worklife/Kudos";
import Feedback from "../pages/employee/worklife/Feedback";
import Tasks from "../pages/employee/tasks/Tasks";
import TaskReview from "../pages/employee/tasks/Review";
import People from "../pages/employee/people/People";
import Hiring from "../pages/employee/hiring/Hiring";
import RequestHub from "../pages/employee/request/RequestHub";
import WorkflowDelegates from "../pages/employee/workflow/WorkflowDelegates";
import Loans from "../pages/employee/salary/Loans";
import YTDReports from "../pages/employee/salary/YTDReports";
import SalaryRevision from "../pages/employee/salary/SalaryRevision";
import { getStoredUser, isEmployee } from "../data/auth";
import { PATH_ADMIN_HOME } from "./paths";

const EmployeeRoutes = () => {
  const user = getStoredUser();

  if (!isEmployee(user)) {
    return <Navigate to={PATH_ADMIN_HOME} replace />;
  }

  return (
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<EmployeeDashboard />} />
      <Route path="engage" element={<Engage />} />
      <Route path="engine" element={<Navigate to="/employee/engage" replace />} />
      <Route path="todo/tasks" element={<Tasks />} />
      <Route path="todo/review" element={<TaskReview />} />
      <Route path="worklife/kudos" element={<Kudos />} />
      <Route path="worklife/feedback" element={<Feedback />} />
      <Route path="attendance/daily" element={<AttendanceInfo />} />
      <Route path="attendance/regularizations" element={<MyRegularizations />} />
      <Route path="attendance/monthly" element={<AttendanceMuster />} />
      <Route path="attendance/shifts" element={<ShiftRoster />} />
      <Route path="leave/balance" element={<LeaveBalances />} />
      <Route path="leave/apply" element={<LeaveApply />} />
      <Route path="leave/calendar" element={<LeaveCalendar />} />
      <Route path="leave/holiday-calendar" element={<HolidayCalendar />} />
      <Route path="payroll/payslips" element={<Payslips />} />
      <Route path="payroll/it-declaration" element={<ITDeclaration />} />
      <Route path="payroll/it-statement" element={<ITStatement />} />
      <Route path="payroll/reimbursements" element={<Reimbursement />} />
      <Route path="payroll/claims" element={<ProofInvestment />} />
      <Route path="payroll/loans" element={<Loans />} />
      <Route path="payroll/ytd-reports" element={<YTDReports />} />
      <Route path="payroll/salary-revision" element={<SalaryRevision />} />
      <Route path="hiring" element={<Hiring />} />
      <Route path="documents" element={<AddDocumentScreen />} />
      <Route path="documents/upload" element={<DocumentCenter />} />
      <Route path="people" element={<People />} />
      <Route path="helpdesk" element={<Helpdesk />} />
      <Route path="request-hub" element={<RequestHub />} />
      <Route path="workflow-delegates" element={<WorkflowDelegates />} />
    </Routes>
  );
};

export default EmployeeRoutes;
