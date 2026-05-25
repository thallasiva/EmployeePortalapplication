import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import EmployeeDashboard from "../pages/employee/Dashboard/EmployeeDashboard";
import AttendanceInfo from "../pages/employee/attendance/AttendanceInfo";
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

const EmployeeRoutes = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user?.role !== 2) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <Routes>
      <Route path="home" element={<EmployeeDashboard />} />
      <Route path="engine" element={<Engage />} />
      <Route path="worklife/kudos" element={<Kudos />} />
      <Route path="worklife/feedback" element={<Feedback />} />
      <Route path="attendance/daily" element={<AttendanceInfo />} />
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
      <Route path="documents" element={<AddDocumentScreen />} />
      <Route path="documents/upload" element={<DocumentCenter />} />
      <Route path="helpdesk" element={<Helpdesk />} />
    </Routes>
  );
};

export default EmployeeRoutes;
