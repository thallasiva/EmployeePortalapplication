import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarCheck, Users } from "lucide-react";

const TABS = [
  { label: "Team Overview",  path: "/recruiter/team/overview",    icon: LayoutDashboard },
  { label: "Leave Requests", path: "/recruiter/team/leave",        icon: CalendarCheck },
  { label: "Attendance",     path: "/recruiter/team/attendance",   icon: Users },
];

const RecruiterTabs = () => {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="flex gap-1 flex-wrap mb-2">
      {TABS.map(({ label, path, icon: Icon }) => {
        const active = pathname.startsWith(path);
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-blue-600 text-white shadow"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default RecruiterTabs;
