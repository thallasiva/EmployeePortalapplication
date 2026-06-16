import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/admin/Dashboard";
import Employee from "../pages/admin/Employee";
import Company from "../pages/admin/Company";
import CreateCompany from "../pages/admin/CreateCompany";
import CalendarForm from "../pages/admin/CalendarForm";
import Leave from "../pages/admin/AdminLeaveDashboard";
import AdminAttendanceDashboard from "../pages/admin/AdminAttendanceDashboard";
import AddDocumentScreen from "../pages/admin/AddDocumentScreen";
import AdminDocuments from "../pages/admin/AdminDocuments";
import Reports from "../pages/admin/Report";
import Onboarding from "../pages/admin/Onboarding";
import Manage from "../pages/admin/Manage";
import ManagePermissions from "../pages/admin/ManagePermissions";
import Settings from "../pages/admin/Settings";
import Profile from "../pages/admin/Profile";
import CreateEmployee from "../pages/admin/CreateEmployee";
import EmployeeDetail from "../pages/admin/EmployeeDetail";
import { getStoredUser, isAdmin } from "../data/auth";
import { PATH_EMPLOYEE_HOME } from "./paths";
import PayRollForm from "../pages/admin/PayRollForm";
import AdminPayslips from "../pages/admin/AdminPayslips";

const AdminRoutes = () => {
  const user = getStoredUser();

  if (!isAdmin(user)) {
    return <Navigate to={PATH_EMPLOYEE_HOME} replace />;
  }

  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="employee" element={<Employee />} />
      <Route path="employee/:id" element={<EmployeeDetail />} />
      <Route path="create-employee" element={<CreateEmployee />} />
      <Route path="company" element={<Company />} />
      <Route path="create-company" element={<CreateCompany />} />
      <Route path="calendar" element={<CalendarForm />} />
      <Route path="leave" element={<Leave />} />
      <Route path="attendance" element={<AdminAttendanceDashboard />} />
      <Route path="documents" element={<AdminDocuments />} />
      <Route path="add-document" element={<AddDocumentScreen />} />
      <Route path="payroll" element={<PayRollForm />} />
      <Route path="payroll/payslips" element={<AdminPayslips />} />
      <Route path="report/*" element={<Reports />} />
      <Route path="onboarding" element={<Onboarding />} />
      <Route path="manage" element={<Manage />} />
      <Route path="manage/permissions/:roleSlug" element={<ManagePermissions />} />
      <Route path="settings" element={<Settings />} />
      <Route path="profile" element={<Profile />} />
    </Routes>
  );
};

export default AdminRoutes;
