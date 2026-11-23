import React from "react";
import PageTabs from "../../../../components/PageTabs";
const Tabs = ({
  tabs,
  active,
  onChange,
  label
}) => <PageTabs tabs={tabs.map(tab => ({
  ...tab,
  id: tab.key
}))} value={active} onChange={onChange} label={label} />;
export { Tabs };
