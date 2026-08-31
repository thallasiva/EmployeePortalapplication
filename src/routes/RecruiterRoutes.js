



import React, { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getStoredUser, isRecruiterLead } from "../data/auth";
import LazyPage from "./LazyPage";

const Recruitment = lazy(() => import("../pages/admin/Recruitment"));
const CreateJobPage = lazy(() => import("../pages/admin/recruitment/CreateJobPage"));
const RecruiterTeamOverview = lazy(() => import("../pages/recruiter/RecruiterTeamOverview"));
const RecruiterTeamLeave = lazy(() => import("../pages/recruiter/RecruiterTeamLeave"));
const RecruiterTeamAttendance = lazy(() => import("../pages/recruiter/RecruiterTeamAttendance"));
const RecruiterJoining = lazy(() => import("../pages/recruiter/RecruiterJoining"));
const AIInterviewSetup = lazy(() => import("../pages/recruiter/AIInterviewSetup"));

const Page = LazyPage;

const RecruiterRoutes = () => {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  const isTL = isRecruiterLead(user);
  return (
    <Routes>
      <Route index element={<Navigate to="recruitment?page=dashboard" replace />} />
      <Route path="recruitment" element={<Page><Recruitment /></Page>} />
      <Route path="recruitment/create-new" element={<Page><CreateJobPage /></Page>} />
      <Route path="recruitment/ai-interview" element={<Page><AIInterviewSetup /></Page>} />

      {}
      {isTL &&
      <>
          <Route path="team" element={<Page><RecruiterTeamOverview /></Page>} />
          <Route path="team/leave" element={<Page><RecruiterTeamLeave /></Page>} />
          <Route path="team/attendance" element={<Page><RecruiterTeamAttendance /></Page>} />
          <Route path="team/joining" element={<Page><RecruiterJoining /></Page>} />
        </>
      }

      <Route path="*" element={<Navigate to="recruitment?page=dashboard" replace />} />
    </Routes>);

};

export default RecruiterRoutes;
