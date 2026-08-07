import { useSearchParams } from "react-router-dom";
import { getStoredUser } from "../../../data/auth";
import { getRecruiterKey, INTERVIEWS, roleInfo, TABS } from "./data";
import { useEffect, useState } from "react";
import AdminDashboard from "./AdminDashboard";
import RequirementsTab from "./handleAssignJobs";
import CandidatesTab from "./CandidatesTab";
import InterviewsTab from "./InterviewsTab";
import OffersTab from "./OffersTab";
import OnboardingTab from "./OnboardingTab";
import EmployeesTab from "./EmployeesTab";
import ReportsTab from "./ReportsTab";
import ManagerDashboard from "./ManagerDashboard";
import RecruiterDashboard from "./RecruiterDashboard";
import { Briefcase } from "lucide-react";
import Toolbar from "./Toolbar";

export default function Recruitment()
{
  const user = getStoredUser();
  const role = roleInfo(user);
  const tabs = TABS[role.id];
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "dashboard";
  const [active, setActive] = useState(initialTab);
  const recruiterKey = getRecruiterKey(user);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [interviews, setInterviews] = useState(INTERVIEWS);

  useEffect(() =>
  {
    const tab = searchParams.get("tab") || "dashboard";
    setActive(tab);
  }, [searchParams]);

  const handleScheduleInterview = (interview) =>
  {

    setInterviews((prev) => [...prev, interview]);

    setActive("interviews");
  };

  const getRoleStyles = () =>
  {
    if (role.id === 1) return "from-slate-600 to-slate-700";
    if (role.id === 4) return "from-violet-600 to-violet-700";
    return "from-orange-500 to-orange-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {}
      <div className={`bg-gradient-to-r ${getRoleStyles()} px-6 py-8 text-white shadow-lg`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
              <Briefcase size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Recruitment & Onboarding Hub</h1>
              <p className="mt-1 text-sm text-white/80">Manage hiring, interviews, and employee onboarding</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold">{user?.name || "User"}</div>
              <div className="mt-1 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                {role.label}
              </div>
            </div>
            <Toolbar role={role} setActive={setActive} />
          </div>
        </div>
      </div>

      {}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {}
        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-xl bg-white p-1.5 shadow-sm">
          {tabs.map((tab) =>
          {
            const Icon = tab.icon;
            const selected = active === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActive(tab.key);
                  setSearchParams({ tab: tab.key }, { replace: true });
                }}
                className={`
                  inline-flex whitespace-nowrap items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium
                  transition-all duration-200 flex-shrink-0
                  ${selected ?
                role.id === 1 ?
                "bg-slate-100 text-slate-700 shadow-md" :
                role.id === 4 ?
                "bg-violet-100 text-violet-700 shadow-md" :
                "bg-orange-100 text-orange-700 shadow-md" :
                "text-gray-600 hover:bg-gray-50"}
                `
                }>

                <Icon size={16} />
                {tab.label}
              </button>);

          })}
        </nav>

        {}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          {active === "dashboard" && role.id === 1 && <AdminDashboard />}
          {active === "dashboard" && role.id === 4 && <ManagerDashboard />}
          {active === "dashboard" && role.id === 5 && <RecruiterDashboard recruiterKey={recruiterKey} />}
          {active === "requirements" && <RequirementsTab role={role} recruiterKey={recruiterKey} />}
          {active === "candidates" && <CandidatesTab
            role={role}
            recruiterKey={recruiterKey}
            selectedCandidate={selectedCandidate}
            setSelectedCandidate={setSelectedCandidate}
            setActive={setActive} />
          }
          {active === "interviews" && <InterviewsTab
            role={role}
            recruiterKey={recruiterKey}
            selectedCandidate={selectedCandidate}
            handleScheduleInterview={handleScheduleInterview}
            interviews={interviews} />
          }
          {active === "offers" && role.id === 4 && <OffersTab />}
          {active === "onboarding" && role.id === 4 && <OnboardingTab />}
          {active === "employees" && role.id === 4 && <EmployeesTab />}
          {active === "reports" && role.id === 1 && <ReportsTab />}
        </div>
      </div>
    </div>);

}
