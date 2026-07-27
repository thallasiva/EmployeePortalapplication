import { memo, useEffect, useMemo, useState } from "react";
import { RefreshCw, Headphones } from "lucide-react";
import Pagination, { usePagination } from "../../../../components/Pagination";
import { BRAND } from "../utils/helpdeskUtils";
import { useHelpdeskTickets } from "../hooks/useHelpdeskTickets";
import { cssClass } from "../../../../utils/classStyles";
import TicketFilters from "./TicketFilters";
import TicketListItem from "./TicketListItem";
import ReopenModal from "./modals/ReopenModal";
import TicketDetailModal from "./modals/TicketDetailModal";

/**
 * My Tickets view — list, filter, close, reopen, and view details.
 * Delegates data-fetching to useHelpdeskTickets, rendering to child components.
 */
const MyTicketsView = memo(function MyTicketsView({ onNewRequest }) {
  const { tickets, loading, closing, load, handleClose } = useHelpdeskTickets();
  const [filter,     setFilter]     = useState("all");
  const [reopenFor,  setReopenFor]  = useState(null);
  const [viewTicket, setViewTicket] = useState(null);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(
    () => filter === "all" ? tickets : tickets.filter((t) => t.status === filter),
    [tickets, filter]
  );

  const { paged, page, setPage, totalPages, from, to, total, pageSize, setPageSize } = usePagination(visible);

  return (
    <div className={cssClass({ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "#fff", padding: "20px 28px" })}>

      {/* Header */}
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 })}>
        <div>
          <h2 className={cssClass({ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 })}>My Tickets</h2>
          <p className={cssClass({ fontSize: 12, color: "#6b7280", margin: "2px 0 0" })}>Click any ticket to view updates and comments</p>
        </div>
        <div className={cssClass({ display: "flex", gap: 8 })}>
          <button onClick={load} className={cssClass({ border: "1px solid #d1d5db", background: "#fff", borderRadius: 4, padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280" })}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={onNewRequest} className={cssClass({ background: BRAND, color: "#fff", border: "none", borderRadius: 4, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" })}>
            + New Request
          </button>
        </div>
      </div>

      <TicketFilters activeFilter={filter} onFilterChange={setFilter} />

      {/* List */}
      <div className={cssClass({ flex: 1, border: "1px solid #e5e7eb", borderRadius: 6, overflow: "auto" })}>
        {loading ? (
          <div className={cssClass({ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 })}>Loading tickets…</div>
        ) : visible.length === 0 ? (
          <div className={cssClass({ padding: 60, textAlign: "center" })}>
            <Headphones size={36} color="#e5e7eb" strokeWidth={1.2} />
            <p className={cssClass({ fontSize: 13, color: "#9ca3af", marginTop: 12 })}>No tickets found.</p>
            <button onClick={onNewRequest} className={cssClass({ marginTop: 8, background: BRAND, color: "#fff", border: "none", borderRadius: 4, padding: "8px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer" })}>
              Raise a Request
            </button>
          </div>
        ) : (
          <ul className={cssClass({ margin: 0, padding: 0, listStyle: "none" })}>
            {paged.map((t, i) => (
              <TicketListItem
                key={t.ticket_id}
                ticket={t}
                index={i}
                total={paged.length}
                isClosing={closing === t.ticket_id}
                onClick={() => setViewTicket(t.ticket_id)}
                onClose={handleClose}
                onReopen={setReopenFor}
              />
            ))}
          </ul>
        )}
        <Pagination page={page} setPage={setPage} totalPages={totalPages} from={from} to={to} total={total} pageSize={pageSize} setPageSize={setPageSize} />
      </div>

      {reopenFor && (
        <ReopenModal
          ticket={reopenFor}
          onClose={() => setReopenFor(null)}
          onReopened={() => { setReopenFor(null); load(); }}
        />
      )}

      {viewTicket && (
        <TicketDetailModal
          ticketId={viewTicket}
          onClose={() => setViewTicket(null)}
          onAction={(action, ticket) => {
            setViewTicket(null);
            if (action === "close")  handleClose(ticket.ticket_id);
            if (action === "reopen") setReopenFor(ticket);
          }}
        />
      )}
    </div>
  );
});

export default MyTicketsView;
