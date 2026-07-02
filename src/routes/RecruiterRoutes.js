/**
 * RecruiterRoutes — routes for role 4 (Recruiter Team Lead) and role 5 (Recruiter).
 * Both roles land at /recruiter/recruitment and see only the Recruitment module.
 */
import React, { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getStoredUser, isRecruitmentRole } from "../data/auth";
import LazyPage from "./LazyPage";

const Recruitment   = lazy(() => import("../pages/admin/Recruitment"));
const CreateJobPage = lazy(() => import("../pages/admin/recruitment/CreateJobPage"));

const Page = LazyPage;

const RecruiterRoutes = () => {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Routes>
      <Route index element={<Navigate to="recruitment?page=dashboard" replace />} />
      <Route path="recruitment"            element={<Page><Recruitment /></Page>} />
      <Route path="recruitment/create-new" element={<Page><CreateJobPage /></Page>} />
      <Route path="*"                      element={<Navigate to="recruitment?page=dashboard" replace />} />
    </Routes>
  );
};

export default RecruiterRoutes;
