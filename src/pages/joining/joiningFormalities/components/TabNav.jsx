import React from "react";
import { CheckCircle } from "lucide-react";
import { TABS } from "../constants";
import PageTabs from "../../../../components/PageTabs";
const TabNav = React.memo(function TabNav({ tab, visited, goTo }) {
  const tabs = TABS.map((item, index) => ({
    id: index,
    label: item.label,
    icon: visited.has(index) && index < tab ? CheckCircle : item.icon,
  }));
  return (
    <div className="px-4 py-4">
      <PageTabs tabs={tabs} value={tab} onChange={goTo} label="Joining formalities steps" />
    </div>
  );
});
export default TabNav;
