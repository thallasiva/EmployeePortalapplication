// AppRoutes.jsx

import React from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Layout from "./component/layout";

import AdminRoutes from "./routes/AdminRoutes";
import EmployeeRoutes from "./routes/EmployeeRoutes";
import ManagerRoutes from "./routes/ManagerRoutes";
import RecruiterRoutes from "./routes/RecruiterRoutes";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import PayslipPrintView from "./pages/payslip/PayslipPrintView";
import { getStoredUser, getHomePath, isAdmin, isEmployee, isReportingManager, isRecruitmentRole } from "./data/auth";

const AppRoutes = () => {
  const location = useLocation();
  const user = getStoredUser();
  void location.key;

  return (
    <Routes>

      {/* DEFAULT */}
      <Route
        path="/"
        element={<Navigate to={getHomePath(user)} replace />}
      />

      {/* AUTH */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/forgotpwd"
        element={<ForgotPassword />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* PRINTABLE PAYSLIP — full-page view, accessible to any authenticated user
          (the backend enforces self-access or payroll:view permission) */}
      <Route
        path="/payslip/:id/print"
        element={user ? <PayslipPrintView /> : <Navigate to="/login" replace />}
      />

      {/* ADMIN */}
      <Route
        path="/dashboard/*"
        element={
          isAdmin(user) ? (
            <Layout />
          ) : (
            <Navigate to={getHomePath(user)} replace />
          )
        }
      >
        <Route path="*" element={<AdminRoutes />} />
      </Route>

      {/* REPORTING MANAGER */}
      <Route
        path="/manager/*"
        element={
          isReportingManager(user) ? (
            <Layout />
          ) : (
            <Navigate to={getHomePath(user)} replace />
          )
        }
      >
        <Route path="*" element={<ManagerRoutes />} />
      </Route>

      {/* EMPLOYEE */}
      <Route
        path="/employee/*"
        element={
          isEmployee(user) || isReportingManager(user) ? (
            <Layout />
          ) : (
            <Navigate to={getHomePath(user)} replace />
          )
        }
      >
        <Route
          path="*"
          element={<EmployeeRoutes />}
        />
      </Route>

      {/* RECRUITER TEAM LEAD + RECRUITER */}
      <Route
        path="/recruiter/*"
        element={
          isRecruitmentRole(user) ? (
            <Layout />
          ) : (
            <Navigate to={getHomePath(user)} replace />
          )
        }
      >
        <Route path="*" element={<RecruiterRoutes />} />
      </Route>

    </Routes>
  );
};

export default AppRoutes;