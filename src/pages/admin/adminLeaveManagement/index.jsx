import { memo } from "react";
import { useSearchParams } from "react-router-dom";
import { cssClass } from "../../../utils/classStyles";
import { TABS, B } from "./constants/leaveConstants";
import CalendarTab    from "./components/CalendarTab";
import RequestsTab    from "./components/RequestsTab";
import BalancesTab    from "./components/BalancesTab";
import LeaveTypesTab  from "./components/LeaveTypesTab";

const AdminLeaveManagement = memo(() => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab    = searchParams.get("tab") || "calendar";
  const setTab = (t) => setSearchParams({ tab: t }, { replace: true });

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f8f9fb", padding: "24px 28px",
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
        <div className={cssClass({ display: "flex", gap: 0, borderBottom: "2px solid #e9eaec", marginBottom: 24 })}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cssClass({
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 18px", fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? B : "#6b7280",
              background: "none", border: "none", cursor: "pointer",
              borderBottom: tab === t.key ? `2px solid ${B}` : "2px solid transparent",
              marginBottom: -2, transition: "color .15s",
            })}>
              <span className={cssClass({ color: tab === t.key ? B : "#9ca3af" })}>{t.icon}</span>
              {t.label}
            </button>
          ))}
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
