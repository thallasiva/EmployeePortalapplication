import React from "react";
import { useSearchParams } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, Users, CalendarCheck,
  FileCheck, UserPlus, BarChart3, CheckSquare,
} from "lucide-react";

import { getStoredUser } from "../../data/auth";
import { roleInfo, getRecruiterKey } from "./recruitment/data";

import JobsPage        from "./recruitment/JobsPage";
import CandidatesPage  from "./recruitment/CandidatesPage";
import InterviewsPage  from "./recruitment/InterviewsPage";
import OffersPage      from "./recruitment/OffersPage";
import OnboardingPage  from "./recruitment/OnboardingPage";

import AdminDashboard     from "./recruitment/AdminDashboard";
import ManagerDashboard   from "./recruitment/ManagerDashboard";
import RecruiterDashboard from "./recruitment/RecruiterDashboard";
import ReportsTab         from "./recruitment/ReportsTab";
import EmployeesTab       from "./recruitment/EmployeesTab";

const TABS = {
  1: [
    { key: "dashboard",  label: "Dashboard",  icon: LayoutDashboard },
    { key: "jobs",       label: "Jobs",       icon: Briefcase },
    { key: "candidates", label: "Candidates", icon: Users },
    { key: "interviews", label: "Interviews", icon: CalendarCheck },
    { key: "offers",     label: "Offers",     icon: FileCheck },
    { key: "onboarding", label: "Onboarding", icon: CheckSquare },
    { key: "employees",  label: "Employees",  icon: UserPlus },
    { key: "reports",    label: "Reports",    icon: BarChart3 },
  ],
  4: [
    { key: "dashboard",  label: "Dashboard",  icon: LayoutDashboard },
    { key: "jobs",       label: "Jobs",       icon: Briefcase },
    { key: "candidates", label: "Candidates", icon: Users },
    { key: "interviews", label: "Interviews", icon: CalendarCheck },
  ],
  5: [
    { key: "dashboard",  label: "My Dashboard", icon: LayoutDashboard },
    { key: "jobs",       label: "My Jobs",      icon: Briefcase },
    { key: "candidates", label: "Candidates",   icon: Users },
    { key: "interviews", label: "Interviews",   icon: CalendarCheck },
  ],
};

function RenderPage({ page, roleId }) {
  switch (page) {
    case "dashboard":
      if (roleId === 1) return <AdminDashboard />;
      if (roleId === 4) return <ManagerDashboard />;
      return <RecruiterDashboard />;
    case "jobs":       return <JobsPage role={roleId} />;
    case "candidates": return <CandidatesPage role={roleId} />;
    case "interviews": return <InterviewsPage role={roleId} />;
    case "offers":     return <OffersPage role={roleId} />;
    case "onboarding": return <OnboardingPage role={roleId} />;
    case "employees":  return <EmployeesTab />;
    case "reports":    return <ReportsTab />;
    default:
      if (roleId === 1) return <AdminDashboard />;
      if (roleId === 4) return <ManagerDashboard />;
      return <RecruiterDashboard />;
  }
}

const Recruitment = () => {
  const user = getStoredUser();
  const role = roleInfo(user);
  const roleId = role.id;
  const recruiterKey = getRecruiterKey(user);
  const tabs = TABS[roleId] || TABS[5];

  const [searchParams, setSearchParams] = useSearchParams();
  const activePage = searchParams.get("page") || searchParams.get("tab") || "dashboard";

  function navigate(key) {
    setSearchParams({ page: key }, { replace: true });
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", background: "#f8f9fc" }}>
      <nav style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 4px",
        display: "flex",
        gap: 2,
        overflowX: "auto",
        marginBottom: 24,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const selected = activePage === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 16px",
                fontSize: 13,
                fontWeight: selected ? 700 : 500,
                color: selected ? "#f18200" : "#6b7280",
                background: "transparent",
                border: "none",
                borderBottom: selected ? "2px solid #f18200" : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: "0 4px" }}>
        <RenderPage page={activePage} roleId={roleId} />
      </div>
    </div>
  );
};

export default Recruitment;
