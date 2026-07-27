import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { getAppraisalCycle } from "../../api/appraisal.api";

const BASE_TABS = [
{ label: "Team Overview", to: "/manager" },
{ label: "Team Attendance", to: "/manager/team/attendance" },
{ label: "Leave Requests", to: "/manager/team/leave" },
{ label: "Regularization", to: "/manager/team/regularizations" },
{ label: "Timesheets", to: "/manager/timesheets" },

{ label: "Resignations", to: "/manager/team/resignations" },
{ label: "Performance Appraisal", to: "/manager/team/performance", appraisalGated: true }];


const isTabActive = (pathname, to) =>
{
  const normalized = pathname.replace(/\/$/, "") || "/";
  const target = to.replace(/\/$/, "") || "/";
  if (target === "/manager") return normalized === target;
  return normalized === target || normalized.startsWith(`${target}/`);
};

const ManagerTabs = () =>
{
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [appraisalActive, setAppraisalActive] = useState(false);

  useEffect(() =>
  {
    getAppraisalCycle().
    then((c) => setAppraisalActive(c?.status === "active")).
    catch(() => {});
  }, []);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {BASE_TABS.map((tab) =>
      {
        const locked = tab.appraisalGated && !appraisalActive;
        const active = !locked && isTabActive(pathname, tab.to);
        return (
          <button
            key={tab.to}
            type="button"
            onClick={() => !locked && navigate(tab.to)}
            title={locked ? "Admin must roll out the appraisal cycle first" : undefined}
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${locked ?
            "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed" :
            active ?
            "bg-brand text-white border-brand" :
            "bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand"}`
            }>

            {locked && <Lock size={12} className="shrink-0" />}
            {tab.label}
          </button>);

      })}
    </div>);

};

export default ManagerTabs;
