import { useState, useEffect } from "react";
import { getEmployeeDashboardCounts } from "../../../api/timesheet.api";
import { TABS, FILTER_STYLE } from "./constants/taskConstants";
import StatCards from "./components/StatCards";
import MyTasksTab from "./components/MyTasksTab";
import TimesheetTab from "./components/TimesheetTab";
import TimesheetHistory from "./components/TimesheetHistory";
import "./tasks.css";

export default function Tasks() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [tsView, setTsView] = useState("history");
  const [tsFilter, setTsFilter] = useState(null);
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    getEmployeeDashboardCounts().then(setCounts).catch(() => {});
  }, []);

  const handleStatClick = (tab, filter = null) => {
    setActiveTab(tab);
    if (tab === "timesheets") {
      setTsFilter(filter);
      setTsView("history");
    }
  };

  const switchTab = (id) => {
    setActiveTab(id);
    if (id === "timesheets") {
      setTsFilter(null);
      setTsView("history");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-5 space-y-5">
      <StatCards counts={counts} onStatClick={handleStatClick} />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 px-4 pt-1 items-center">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => switchTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors mr-1 ${
                activeTab === tab.id
                  ? "border-brand text-brand"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}>
              {tab.label}
            </button>
          ))}

          {activeTab === "timesheets" && (
            <div className="ml-auto flex items-center gap-2 pb-1">
              {tsFilter && (
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${FILTER_STYLE[tsFilter] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                  {tsFilter}
                  <button onClick={() => setTsFilter(null)} className="hover:opacity-70 leading-none">×</button>
                </span>
              )}
              <button
                onClick={() => setTsView((v) => (v === "history" ? "entry" : "history"))}
                className="text-xs font-semibold px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                {tsView === "history" ? "New Week Entry" : "All Weeks"}
              </button>
            </div>
          )}
        </div>

        <div className="p-4">
          {activeTab === "tasks" && <MyTasksTab />}
          {activeTab === "timesheets" && (
            tsView === "history"
              ? <TimesheetHistory statusFilter={tsFilter} />
              : <TimesheetTab jumpTo={null} />
          )}
        </div>
      </div>
    </div>
  );
}
