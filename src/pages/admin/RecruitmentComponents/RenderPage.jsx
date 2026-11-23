import React from "react";
import JobsPage from ".././recruitment/JobsPage";
import CandidatesPage from ".././recruitment/CandidatesPage";
import InterviewsPage from ".././recruitment/InterviewsPage";
import OffersPage from ".././recruitment/OffersPage";
import ResumeMatchTab from ".././recruitment/ResumeMatchTab";
import AdminDashboard from ".././recruitment/AdminDashboard";
import ManagerDashboard from ".././recruitment/ManagerDashboard";
import RecruiterDashboard from ".././recruitment/RecruiterDashboard";
import ReportsTab from ".././recruitment/ReportsTab";
import AIInterviewSetup from "../../recruiter/AIInterviewSetup";
import EmployeesTab from ".././recruitment/EmployeesTab";
function RenderPage({
  page,
  roleId
}) {
  switch (page) {
    case "dashboard":
      if (roleId === 1) return <AdminDashboard />;
      if (roleId === 3 || roleId === 4) return <ManagerDashboard />;
      return <RecruiterDashboard />;
    case "jobs":
      return <JobsPage role={roleId} />;
    case "candidates":
      return <CandidatesPage role={roleId} />;
    case "interviews":
      return <InterviewsPage role={roleId} />;
    case "resume-match":
      return <ResumeMatchTab role={roleId} />;
    case "offers":
      return <OffersPage role={roleId} />;
    // case "onboarding":return <OnboardingPage role={roleId} />;
    case "employees":
      return <EmployeesTab />;
    case "reports":
      return <ReportsTab />;
    case "ai-interview":
      return <AIInterviewSetup />;
    default:
      if (roleId === 1) return <AdminDashboard />;
      if (roleId === 3 || roleId === 4) return <ManagerDashboard />;
      return <RecruiterDashboard />;
  }
}
export { RenderPage };
