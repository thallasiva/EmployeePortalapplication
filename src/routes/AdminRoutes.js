import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/admin/Dashboard";
import Employee from "../pages/admin/Employee";
import Company from "../pages/admin/Company";
import CreateCompany from "../pages/admin/CreateCompany";
import CalendarForm from "../pages/admin/CalendarForm";
import Leave from "../pages/admin/Leave";
import Review from "../pages/admin/Review";
import CreateReviewer from "../pages/admin/CreateReviewer";
import AddDocumentScreen from "../pages/admin/AddDocumentScreen";
import Reports from "../pages/admin/Report";
import Manage from "../pages/admin/Manage";
import ManagePermissions from "../pages/admin/ManagePermissions";
import Settings from "../pages/admin/Settings";
import Profile from "../pages/admin/Profile";
import CreateEmployee from "../pages/admin/CreateEmployee";
import { getStoredUser, isAdmin } from "../data/auth";
import { PATH_EMPLOYEE_HOME } from "./paths";

const AdminRoutes = () => {
  const user = getStoredUser();

  if (!isAdmin(user)) {
    return <Navigate to={PATH_EMPLOYEE_HOME} replace />;
  }

  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="employee" element={<Employee />} />
      <Route path="create-employee" element={<CreateEmployee />} />
      <Route path="company" element={<Company />} />
      <Route path="create-company" element={<CreateCompany />} />
      <Route path="calendar" element={<CalendarForm />} />
      <Route path="leave" element={<Leave />} />
      <Route path="review" element={<Review />} />
      <Route path="create-review" element={<CreateReviewer />} />
      <Route path="add-document" element={<AddDocumentScreen />} />
      <Route path="report" element={<Reports />} />
      <Route path="manage" element={<Manage />} />
      <Route path="manage/permissions/:roleSlug" element={<ManagePermissions />} />
      <Route path="settings" element={<Settings />} />
      <Route path="profile" element={<Profile />} />
    </Routes>
  );
};

export default AdminRoutes;
