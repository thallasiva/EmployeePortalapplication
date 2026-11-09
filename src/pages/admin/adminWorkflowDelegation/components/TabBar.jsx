import React from "react";
import PageTabs from "../../../../components/PageTabs";
const TabBar = React.memo(function TabBar({ tabs, activeTab, setActiveTab, stats }) {
  const pageTabs = tabs.map((tab) => ({
    id: tab.key,
    label: tab.label,
    icon: tab.icon,
    count: tab.key === "unassigned" && stats?.without_manager > 0 ? stats.without_manager : null,
  }));
  return (
    <div className="mb-6">
      <PageTabs tabs={pageTabs} value={activeTab} onChange={setActiveTab} label="Workflow delegation sections" />
    </div>
  );
});
export default TabBar;
