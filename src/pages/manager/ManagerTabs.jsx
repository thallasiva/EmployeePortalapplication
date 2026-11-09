import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { getAppraisalCycle } from "../../api/appraisal.api";
import PageTabs from "../../components/PageTabs";
const BASE_TABS = [
  { label: "Team Overview", to: "/manager" },
  { label: "Team Attendance", to: "/manager/team/attendance" },
  { label: "Leave Requests", to: "/manager/team/leave" },
  { label: "Regularization", to: "/manager/team/regularizations" },
  { label: "Timesheets", to: "/manager/timesheets" },
  { label: "Resignations", to: "/manager/team/resignations" },
  { label: "Performance Appraisal", to: "/manager/team/performance", appraisalGated: true }];
const isTabActive = (pathname, to) => {
  const normalized = pathname.replace(/\/$/, "") || "/";
  const target = to.replace(/\/$/, "") || "/";
  if (target === "/manager") return normalized === target;
  return normalized === target || normalized.startsWith(`${target}/`);
};
const ManagerTabs = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [appraisalActive, setAppraisalActive] = useState(false);
  useEffect(() => {
    getAppraisalCycle()
      .then((c) => setAppraisalActive(c?.status === "active"))
      .catch(() => { });
  }, []);
  const activeTab = BASE_TABS.find((tab) =>
    !(tab.appraisalGated && !appraisalActive) && isTabActive(pathname, tab.to)
  );
  return (
    <div className="mb-4">
      <PageTabs
        tabs={BASE_TABS.map((tab) => {
          const locked = tab.appraisalGated && !appraisalActive;
          return {
            id: tab.to,
            label: tab.label,
            disabled: locked,
            icon: locked ? Lock : undefined,
          };
        })}
        value={activeTab?.to}
        onChange={navigate}
        label="Manager sections"
      />
    </div>
  );
};
export default ManagerTabs;
