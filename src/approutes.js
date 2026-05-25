// AppRoutes.jsx

import React from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Layout from "./component/layout";

import AdminRoutes from "./routes/AdminRoutes";
import EmployeeRoutes from "./routes/EmployeeRoutes";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";

const AppRoutes = () => {
  const user = JSON.parse(
    localStorage.getItem("user")
  );

  return (
    <Routes>

      {/* DEFAULT */}
      <Route
        path="/"
        element={
          user ? (
            user?.role === 1 ? (
              <Navigate to="/dashboard" replace />
            ) : user?.role === 2 ? (
              <Navigate
                to="/employee/home"
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          ) : (
            <Navigate to="/login" replace />
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
          user?.role === 1 ? (
            <Layout />
          ) : (
            <Navigate
              to="/employee/home"
              replace
            />
          )
        }
      >
        <Route
          path="*"
          element={<AdminRoutes />}
        />
      </Route>

      {/* EMPLOYEE */}
      <Route
        path="/employee/*"
        element={
          user?.role === 2 ? (
            <Layout />
          ) : (
            <Navigate
              to="/dashboard"
              replace
            />
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