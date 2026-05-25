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

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import { getStoredUser, isAdmin, isEmployee } from "./data/auth";
import { PATH_ADMIN_HOME, PATH_EMPLOYEE_HOME, PATH_LOGIN } from "./routes/paths";

const AppRoutes = () => {
  const location = useLocation();
  const user = getStoredUser();
  void location.key;

  return (
    <Routes>

      {/* DEFAULT */}
      <Route
        path="/"
        element={
          user ? (
            isAdmin(user) ? (
              <Navigate to={PATH_ADMIN_HOME} replace />
            ) : isEmployee(user) ? (
              <Navigate to={PATH_EMPLOYEE_HOME} replace />
            ) : (
              <Navigate to={PATH_LOGIN} replace />
            )
          ) : (
            <Navigate to={PATH_LOGIN} replace />
          )
        }
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
            <Navigate to={PATH_EMPLOYEE_HOME} replace />
          )
        }
      >
        <Route path="*" element={<AdminRoutes />} />
      </Route>

      {/* EMPLOYEE */}
      <Route
        path="/employee/*"
        element={
          isEmployee(user) ? (
            <Layout />
          ) : (
            <Navigate to={PATH_ADMIN_HOME} replace />
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