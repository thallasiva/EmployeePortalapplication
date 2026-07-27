import React, { useState } from "react";
import { Headphones, RefreshCw } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { getStoredUser, isAdmin } from "../../../../data/auth";
import { BRAND } from "./constants";
import { useTickets } from "./hooks/useTickets";
import SummaryCards from "./components/SummaryCards";
import FilterBar from "./components/FilterBar";
import TicketList from "./components/TicketList";
import TicketDetail from "./components/TicketDetail";

export default function HelpdeskAdmin() {
  const user        = getStoredUser();
  const isAdminUser = isAdmin(user);
  const [selected, setSelected] = useState(null);

  const {
    tickets, total, loading,
    search, statusF, teamF, page, limit,
    setPage, load,
    handleSearch, handleStatusChange, handleTeamChange, handleClear,
  } = useTickets({ isAdminUser, defaultTeam: isAdminUser ? "Admin Team" : "" });

  const counts = tickets.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});
  const summaryCards = [
    { label: "Open",        value: counts["Open"]        || 0, color: "#2563eb", bg: "#eff6ff" },
    { label: "Forwarded",   value: counts["Forwarded"]   || 0, color: "#7c3aed", bg: "#f5f3ff" },
    { label: "In Progress", value: counts["In Progress"] || 0, color: "#c2410c", bg: "#fff7ed" },
    { label: "Reopened",    value: counts["Reopened"]    || 0, color: "#be123c", bg: "#fff1f2" },
    { label: "Resolved",    value: counts["Resolved"]    || 0, color: "#15803d", bg: "#f0fdf4" },
    { label: "Total",       value: total,                      color: BRAND,     bg: "#fff7ed" },
  ];

  return (
    <div className={cssClass({ height: "calc(100vh - 4.25rem)", background: "#f5f7fb",
      display: "flex", flexDirection: "column", padding: "16px 20px 12px", overflow: "hidden" })}>

      {/* page title */}
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, flexShrink: 0 })}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
          <Headphones size={20} color={BRAND} />
          <div>
            <h1 className={cssClass({ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 })}>
              {isAdminUser ? "Helpdesk — All Tickets" : "Helpdesk — My Team's Requests"}
            </h1>
            <p className={cssClass({ fontSize: 12, color: "#64748b", margin: 0 })}>
              {isAdminUser
                ? "Work on forwarded tickets: In Progress → Resolved"
                : "Review, approve & forward — or reject — your team's requests"}
            </p>
          </div>
        </div>
        <button onClick={load} className={cssClass({ background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: 8, padding: "7px 12px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b" })}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <SummaryCards cards={summaryCards} />

      <FilterBar
        search={search} statusF={statusF} teamF={teamF} isAdminUser={isAdminUser}
        onSearch={handleSearch}
        onStatusChange={handleStatusChange}
        onTeamChange={handleTeamChange}
        onClear={handleClear}
      />

      <TicketList
        tickets={tickets} total={total} page={page} limit={limit}
        loading={loading} isAdminUser={isAdminUser}
        onSelect={setSelected}
        onPageChange={setPage}
      />

      {selected && (
        <TicketDetail
          ticket={selected}
          isAdminUser={isAdminUser}
          onClose={() => setSelected(null)}
          onUpdated={() => { load(); setSelected(null); }}
        />
      )}
    </div>
  );
}
