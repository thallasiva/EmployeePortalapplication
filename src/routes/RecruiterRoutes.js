/**
 * RecruiterRoutes — routes for role 4 (Recruiter Team Lead) and role 5 (Recruiter).
 * Both roles land at /recruiter/recruitment and see only the Recruitment module.
 */
import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getStoredUser, isRecruitmentRole } from "../data/auth";
import LoadingFallback from "../component/LoadingFallback";
import ErrorBoundary from "../component/ErrorBoundary";

const Recruitment = lazy(() => import("../pages/admin/Recruitment"));

function Page({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

const RecruiterRoutes = () => {
  const user = getStoredUser();
  if (!isRecruitmentRole(user)) return <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route index element={<Navigate to="recruitment" replace />} />
      <Route path="recruitment" element={<Page><Recruitment /></Page>} />
      <Route path="*"           element={<Navigate to="recruitment" replace />} />
    </Routes>
  );
};

export default RecruiterRoutes;
