import { memo } from "react";
import PageTabs from "../../../../components/PageTabs";
const TABS = [
  { id: "request", label: "Raise a Request" },
  { id: "tickets", label: "My Tickets" },
];
/**
 * Tab navigation bar at the top of the Helpdesk page.
 * Single responsibility: renders + fires onTabChange.
 */
const HelpdeskTabs = memo(function HelpdeskTabs({ activeTab, onTabChange }) {
  const selectedTab = activeTab === "request" || activeTab === "category" ? "request" : "tickets";
  return (
    <div className="shrink-0 px-4 py-3">
      <PageTabs tabs={TABS} value={selectedTab} onChange={onTabChange} label="Helpdesk sections" />
    </div>
  );
});
export default HelpdeskTabs;
