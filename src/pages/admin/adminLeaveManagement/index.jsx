import { memo } from "react";
import { useSearchParams } from "react-router-dom";
import { cssClass } from "../../../utils/classStyles";
import PageTabs from "../../../components/PageTabs";
import { TABS } from "./constants/leaveConstants";
import CalendarTab    from "./components/CalendarTab";
import RequestsTab    from "./components/RequestsTab";
import BalancesTab    from "./components/BalancesTab";
import LeaveTypesTab  from "./components/LeaveTypesTab";
const AdminLeaveManagement = memo(() => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab    = searchParams.get("tab") || "calendar";
  const setTab = (t) => setSearchParams({ tab: t }, { replace: true });
  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f8f9fb",
      fontFamily: "'Inter','Plus Jakarta Sans',system-ui,sans-serif" })}>
      <div className={cssClass({ maxWidth: 1280, margin: "0 auto" })}>
        {/* Page header */}
        <div className={cssClass({ marginBottom: 22 })}>
          <h1 className={cssClass({ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827",
            fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", letterSpacing: "-0.025em" })}>
            Leave Management
          </h1>
          <p className={cssClass({ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" })}>
            Calendar view · approve requests · manage balances · configure leave types
          </p>
        </div>
        {/* Tab bar */}
        <div className={cssClass({ marginBottom: 24 })}>
          <PageTabs
            tabs={TABS.map((item) => ({ id: item.key, label: item.label }))}
            value={tab}
            onChange={setTab}
            label="Leave management sections"
          />
        </div>
        {/* Active tab content */}
        <div>
          {tab === "calendar"  && <CalendarTab />}
          {tab === "requests"  && <RequestsTab />}
          {tab === "balances"  && <BalancesTab />}
          {tab === "types"     && <LeaveTypesTab />}
        </div>
      </div>
    </div>
  );
});
AdminLeaveManagement.displayName = "AdminLeaveManagement";
export default AdminLeaveManagement;
