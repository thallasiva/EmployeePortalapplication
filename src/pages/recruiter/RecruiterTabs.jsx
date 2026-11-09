import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarCheck, Users, FileCheck } from "lucide-react";
import PageTabs from "../../components/PageTabs";
const TABS = [
  { label: "Team Overview",       path: "/recruiter/team/overview",    icon: LayoutDashboard },
  { label: "Leave Requests",      path: "/recruiter/team/leave",        icon: CalendarCheck },
  { label: "Attendance",          path: "/recruiter/team/attendance",   icon: Users },
  { label: "Joining Formalities", path: "/recruiter/team/joining",      icon: FileCheck },
];
const RecruiterTabs = () => {
  const navigate  = useNavigate();
  const { pathname } = useLocation();
  const activeTab = TABS.find(({ path }) => pathname.startsWith(path));
  return (
    <div className="mb-2">
      <PageTabs
        tabs={TABS.map(({ label, path, icon }) => ({ id: path, label, icon }))}
        value={activeTab?.path}
        onChange={navigate}
        label="Recruiter sections"
      />
    </div>
  );
};
export default RecruiterTabs;
