import React from "react";
import PageTabs from "../../../../../components/PageTabs";
const TABS = [
  { key: "apply", label: "Apply" },
  { key: "pending", label: "Pending" },
  { key: "history", label: "History" },
];
const TabSwitcher = React.memo(function TabSwitcher({ tab, onTabChange }) {
  return (
    <div className="relative mb-4 flex min-h-[40px] items-center">
      <PageTabs tabs={TABS.map(({ key, label }) => ({ id: key, label }))} value={tab} onChange={onTabChange} />
    </div>
  );
});
export default TabSwitcher;
