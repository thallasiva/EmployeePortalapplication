// AppRoutes.jsx

import React, { lazy } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import LazyPage from "./routes/LazyPage";
import PerformanceDemoRoute from "./routes/PerformanceDemoRoute";
import { getStoredUser, getHomePath, isAdmin, isEmployee, isReportingManager, isRecruitmentRole, canViewTeamOverview } from "./data/auth";

const Layout = lazy(() => import("./component/layout"));
const AdminRoutes = lazy(() => import("./routes/AdminRoutes"));
const EmployeeRoutes = lazy(() => import("./routes/EmployeeRoutes"));
const ManagerRoutes = lazy(() => import("./routes/ManagerRoutes"));
const RecruiterRoutes = lazy(() => import("./routes/RecruiterRoutes"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Register = lazy(() => import("./pages/Register"));
const PayslipPrintView   = lazy(() => import("./pages/payslip/PayslipPrintView"));
const JoiningFormalities = lazy(() => import("./pages/joining/JoiningFormalities"));

const AppRoutes = () =>
{
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
        element={<LazyPage label="Loading login..."><Login /></LazyPage>}
      />

      <Route
        path="/forgotpwd"
        element={<LazyPage label="Loading reset page..."><ForgotPassword /></LazyPage>}
      />

      <Route
        path="/register"
        element={<LazyPage label="Loading registration..."><Register /></LazyPage>}
      />

      {/* PRINTABLE PAYSLIP */}
      <Route
        path="/payslip/:id/print"
        element={user ? <LazyPage label="Loading payslip..."><PayslipPrintView /></LazyPage> : <Navigate to="/login" replace />}
      />

      {/* PUBLIC — Joining Formalities (no auth needed, token-secured) */}
      <Route path="/joining/:token" element={<LazyPage label="Loading..."><JoiningFormalities /></LazyPage>} />

      <Route path="/performance-showcase" element={<PerformanceDemoRoute />} />

      {/* ADMIN */}
      <Route
        path="/dashboard/*"
        element={
          user
            ? <Layout />
            : <Navigate to="/login" replace />
        }
      >
        <Route path="*" element={<LazyPage label="Loading admin module..."><AdminRoutes /></LazyPage>} />
      </Route>

      {/* REPORTING MANAGER */}
      <Route
        path="/manager/*"
        element={
          canViewTeamOverview(user) ? (
            <Layout />
          ) : (
            <Navigate to={getHomePath(user)} replace />
          )
        }
      >
        <Route path="*" element={<LazyPage label="Loading manager module..."><ManagerRoutes /></LazyPage>} />
      </Route>

      {/* EMPLOYEE - also allow recruiter roles so their sidebar employee links work */}
      <Route
        path="/employee/*"
        element={
          isEmployee(user) || isReportingManager(user) || isRecruitmentRole(user) ? (
            <Layout />
          ) : (
            <Navigate to={getHomePath(user)} replace />
          )
        }
      >
        <Route
          path="*"
          element={<LazyPage label="Loading employee module..."><EmployeeRoutes /></LazyPage>}
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
        <Route path="*" element={<LazyPage label="Loading recruiter module..."><RecruiterRoutes /></LazyPage>} />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
