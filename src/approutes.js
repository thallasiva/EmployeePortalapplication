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

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import { getStoredUser, getHomePath, isAdmin, isEmployee, isReportingManager } from "./data/auth";

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

    </Routes>
  );
};

export default AppRoutes;