import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const TABS = [
  { label: "Team Overview", to: "/manager" },
  { label: "Team Attendance", to: "/manager/team/attendance" },
  { label: "Leave Requests", to: "/manager/team/leave" },
  { label: "Regularization", to: "/manager/team/regularizations" },
  { label: "Performance Appraisal", to: "/manager/team/performance" },

];

const isTabActive = (pathname, to) => {
  const normalized = pathname.replace(/\/$/, "") || "/";
  const target = to.replace(/\/$/, "") || "/";
  if (target === "/manager") return normalized === target;
  return normalized === target || normalized.startsWith(`${target}/`);
};

const ManagerTabs = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {TABS.map((tab) => {
        const active = isTabActive(pathname, tab.to);
        return (
          <button
            key={tab.to}
            type="button"
            onClick={() => navigate(tab.to)}
            className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
              active
                ? "bg-brand text-white border-brand"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default ManagerTabs;
