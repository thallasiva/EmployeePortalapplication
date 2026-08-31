import React from "react";
import { useSearchParams } from "react-router-dom";
import {

  LayoutDashboard, Briefcase, Users, CalendarCheck,
  FileCheck, UserPlus, BarChart3, CheckSquare, Zap, Bot } from
"lucide-react";

import { getStoredUser } from "../../data/auth";
import { roleInfo, getRecruiterKey } from "./recruitment/data";

import JobsPage from "./recruitment/JobsPage";
import CandidatesPage from "./recruitment/CandidatesPage";
import InterviewsPage from "./recruitment/InterviewsPage";
import OffersPage from "./recruitment/OffersPage";
import OnboardingPage from "./recruitment/OnboardingPage";
import ResumeMatchTab from "./recruitment/ResumeMatchTab";

import AdminDashboard from "./recruitment/AdminDashboard";
import ManagerDashboard from "./recruitment/ManagerDashboard";
import RecruiterDashboard from "./recruitment/RecruiterDashboard";
import ReportsTab from "./recruitment/ReportsTab";
import AIInterviewSetup from "../recruiter/AIInterviewSetup";
import EmployeesTab from "./recruitment/EmployeesTab";

const TABS = {

  1: [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "candidates", label: "Candidates", icon: Users },
  { key: "interviews", label: "Interviews", icon: CalendarCheck },
  { key: "offers", label: "Offers", icon: FileCheck },
  // { key: "onboarding", label: "Onboarding", icon: CheckSquare },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "ai-interview", label: "AI Interview", icon: Bot }],


  3: [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "candidates", label: "Candidates", icon: Users },
  { key: "interviews", label: "Interviews", icon: CalendarCheck },
  { key: "offers", label: "Offers", icon: FileCheck },
//  { key: "onboarding", label: "Onboarding", icon: CheckSquare }
  { key: "ai-interview", label: "AI Interview", icon: Bot },
],


  4: [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "candidates", label: "Candidates", icon: Users }],


  5: [
  { key: "dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { key: "jobs", label: "My Jobs", icon: Briefcase },
  { key: "candidates", label: "Candidates", icon: Users },
  { key: "interviews", label: "Interviews", icon: CalendarCheck },
  { key: "ai-interview", label: "AI Interview", icon: Bot }]

};

function RenderPage({ page, roleId })
{
  switch (page) {

    case "dashboard":
      if (roleId === 1) return <AdminDashboard />;
      if (roleId === 3 || roleId === 4) return <ManagerDashboard />;
      return <RecruiterDashboard />;
    case "jobs":return <JobsPage role={roleId} />;
    case "candidates":return <CandidatesPage role={roleId} />;
    case "interviews":return <InterviewsPage role={roleId} />;
    case "resume-match":return <ResumeMatchTab role={roleId} />;
    case "offers":return <OffersPage role={roleId} />;
    // case "onboarding":return <OnboardingPage role={roleId} />;
    case "employees":return <EmployeesTab />;
    case "reports":return <ReportsTab />;
    case "ai-interview":return <AIInterviewSetup />;
    default:
      if (roleId === 1) return <AdminDashboard />;
      if (roleId === 3 || roleId === 4) return <ManagerDashboard />;
      return <RecruiterDashboard />;
  }
}

const Recruitment = () =>
{
  const user = getStoredUser();
  const role = roleInfo(user);
  const roleId = role.id;
  const recruiterKey = getRecruiterKey(user);
  const tabs = TABS[roleId] || TABS[5];

  const [searchParams, setSearchParams] = useSearchParams();
  const activePage = searchParams.get("page") || searchParams.get("tab") || "dashboard";

  function navigate(key)
  {
    setSearchParams({ page: key }, { replace: true });
  }

  return (
    <div className="font-[Inter,system-ui,sans-serif] min-h-screen bg-[#f8f9fc]">

      <nav
        className="
        bg-white
        border-b border-[#e5e7eb]
        px-[4px]
        flex
        gap-[2px]
        overflow-x-auto
        mb-[24px]
        shadow-[0_1px_4px_rgba(0,0,0,0.06)]
      ">










        {tabs.map((tab) =>
        {
          const Icon = tab.icon;
          const selected = activePage === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.key)}
              className={`
              inline-flex
              items-center
              gap-[6px]
              px-[16px]
              py-[12px]
              text-[13px]
              ${selected ?
              "font-[700] text-[#f18200] border-b-[2px] border-[#f18200]" :
              "font-[500] text-[#6b7280] border-b-[2px] border-transparent"}
              bg-transparent
              border-x-0
              border-t-0
              cursor-pointer
              whitespace-nowrap
              transition-[color,border-color]
              duration-[150ms]
            `
              }>

              <Icon size={15} />
              {tab.label}
            </button>);

        })}
      </nav>

      <div className="px-[4px]">
        <RenderPage
          page={activePage}
          roleId={roleId} />

      </div>

    </div>);


};

export default Recruitment;
