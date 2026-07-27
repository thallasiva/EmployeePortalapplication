import { useCallback, useState } from "react";
import { myTickets, closeTicket } from "../../../../api/helpdesk.api";

/**
 * Encapsulates all data-fetching and mutation logic for the My Tickets view.
 * Keeps MyTicketsView purely presentational.
 */
export function useHelpdeskTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(null);  // ticket_id currently being closed

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await myTickets({ limit: 50 });
      setTickets(Array.isArray(data) ? data : data?.rows ?? []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClose = useCallback(async (ticketId) => {
    setClosing(ticketId);
    try {
      await closeTicket(ticketId);
      await load();
    } catch {
      /* silently fail — user can retry */
    } finally {
      setClosing(null);
    }
  }, [load]);

  return { tickets, loading, closing, load, handleClose };
}
