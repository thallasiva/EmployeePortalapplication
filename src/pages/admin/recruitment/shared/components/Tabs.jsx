import React from "react";
import PageTabs from "../../../../../components/PageTabs";
export const Tabs = React.memo(function Tabs({ tabs, active, onChange }) {
  return (
    <PageTabs
      tabs={tabs.map((tab) => ({ ...tab, id: tab.key }))}
      value={active}
      onChange={onChange}
    />
  );
});
