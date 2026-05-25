import React, { useMemo, useState } from "react";
import { Headphones } from "lucide-react";
import HelpdeskEmptyIllustration from "./HelpdeskEmptyIllustration";
import NewRequestModal from "./NewRequestModal";

const PRIORITY_DOT = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-emerald-500",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const Helpdesk = () => {
  const [tab, setTab] = useState("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [tickets, setTickets] = useState([]);

  const visibleTickets = useMemo(
    () =>
      tickets.filter((t) =>
        tab === "active" ? t.status === "active" : t.status === "closed"
      ),
    [tickets, tab]
  );

  const handleNewRequest = (payload) => {
    setTickets((prev) => [
      {
        id: Date.now(),
        ...payload,
      },
      ...prev,
    ]);
    setTab("active");
  };

  const closeTicket = (id) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "closed" } : t))
    );
  };

  return (
    <div className="-mx-1 flex flex-col min-h-[calc(100vh-5.5rem)]">
      {/* Page title */}
      <div className="flex items-center gap-2 mb-4">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-teal-400 text-white">
          <Headphones size={18} strokeWidth={2} />
        </span>
        <h1 className="text-lg font-semibold text-slate-700">Helpdesk</h1>
      </div>

      {/* Toolbar */}
      <div className="relative flex items-center justify-center mb-4 min-h-[40px]">
        <div className="inline-flex rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`px-8 py-2 text-sm font-medium transition-colors ${
              tab === "active"
                ? "bg-sky-500 text-white"
                : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setTab("closed")}
            className={`px-8 py-2 text-sm font-medium border-l border-slate-200 transition-colors ${
              tab === "closed"
                ? "bg-sky-500 text-white"
                : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            Closed
          </button>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="absolute right-0 py-2 px-5 text-sm font-medium rounded-md border border-sky-500 text-sky-600 bg-white hover:bg-sky-50 transition-colors"
        >
          New Request
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white border border-slate-200 rounded-lg min-h-[420px]">
        {visibleTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[380px] py-16">
            <HelpdeskEmptyIllustration />
            <p className="mt-6 text-sm text-slate-400">No helpdesk items</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibleTickets.map((ticket) => (
              <li
                key={ticket.id}
                className="px-5 py-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          PRIORITY_DOT[ticket.priority] ?? PRIORITY_DOT.high
                        }`}
                      />
                      <h3 className="text-sm font-semibold text-slate-800 truncate">
                        {ticket.subject}
                      </h3>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {ticket.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-2">
                      {ticket.description}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                  {ticket.status === "active" && (
                    <button
                      type="button"
                      onClick={() => closeTicket(ticket.id)}
                      className="shrink-0 text-xs font-medium text-sky-600 border border-sky-400 rounded px-3 py-1.5 hover:bg-sky-50"
                    >
                      Close
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <NewRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleNewRequest}
      />
    </div>
  );
};

export default Helpdesk;
