import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Search } from "lucide-react";
import {
  REVIEW_NAV_SECTIONS,
  DEFAULT_REVIEW_ITEM_ID,
  findReviewNavItem,
} from "../../../data/reviewHub";
import {
  RegularizationEmptyIllustration,
  GenericEmptyIllustration,
} from "./ReviewEmptyIllustration";
import { getMyLeaveRequests } from "../../../api/leaveRequest.api";
import "./reviewHub.css";

const LEAVE_STATUS_BADGE_CLASS = {
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-rose-50 text-rose-700",
};

function formatReviewDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Shows the employee's own Approved / Rejected leave requests with status and remarks. */
function LeaveDecisionsPanel({ item, search }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyLeaveRequests({ limit: 100 })
      .then(({ data }) => {
        if (cancelled) return;
        const decided = (data || []).filter(
          (r) => r.status === "Approved" || r.status === "Rejected"
        );
        setRequests(decided);
      })
      .catch(() => {
        if (!cancelled) setRequests([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((r) =>
      [r.leave_type_name, r.status, r.remarks, r.reason]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [requests, search]);

  if (loading) {
    return (
      <div className="review-hub__empty">
        <p className="review-hub__empty-text">Loading leave requests...</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="review-hub__empty">
        <GenericEmptyIllustration />
        <p className="review-hub__empty-text">{item.emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="review-hub__leave-list">
      {filtered.map((r) => (
        <div key={r.leave_request_id} className="review-hub__leave-card">
          <div>
            <p className="review-hub__leave-type">{r.leave_type_name}</p>
            <p className="review-hub__leave-meta">
              {formatReviewDate(r.from_date)} – {formatReviewDate(r.to_date)} (
              {Number(r.days) || 0} day{Number(r.days) === 1 ? "" : "s"})
            </p>
            <p className="review-hub__leave-meta">
              Reason: {r.reason || "—"}
              {r.reviewer_name && r.reviewer_name.trim()
                ? ` · Reviewed by ${r.reviewer_name.trim()}`
                : ""}
              {r.reviewed_on ? ` on ${formatReviewDate(r.reviewed_on)}` : ""}
            </p>
            {r.remarks && (
              <p className="review-hub__leave-remarks">Remarks: {r.remarks}</p>
            )}
          </div>
          <span
            className={`review-hub__leave-badge ${
              LEAVE_STATUS_BADGE_CLASS[r.status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {r.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReviewCenterPanel({ item, status, search, dateRange }) {
  if (!item) return null;

  const Illustration =
    item.emptyType === "regularization"
      ? RegularizationEmptyIllustration
      : GenericEmptyIllustration;

  const filterHint =
    search.trim() || dateRange
      ? " Try adjusting your filters."
      : "";

  return (
    <div className="review-hub__empty">
      <Illustration />
      <p className="review-hub__empty-text">
        {item.emptyMessage}
        {filterHint}
      </p>
      {status === "closed" && (
        <p className="review-hub__empty-text mt-2 text-[13px]">
          Showing closed records for {item.label}.
        </p>
      )}
    </div>
  );
}

export default function Review() {
  const [activeItemId, setActiveItemId] = useState(DEFAULT_REVIEW_ITEM_ID);
  const [status, setStatus] = useState("active");
  const [dateRange, setDateRange] = useState("");
  const [search, setSearch] = useState("");

  const activeItem = useMemo(
    () => findReviewNavItem(activeItemId),
    [activeItemId]
  );

  return (
    <div className="review-hub">
      <div className="review-hub__layout">
        <aside className="review-hub__sidebar">
          {REVIEW_NAV_SECTIONS.map((section) => (
            <div key={section.id} className="review-hub__section">
              <div className="review-hub__section-title">{section.label}</div>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`review-hub__nav-item ${
                    activeItemId === item.id
                      ? "review-hub__nav-item--active"
                      : ""
                  }`}
                  onClick={() => setActiveItemId(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <main className="review-hub__main">
          <div className="review-hub__toolbar">
            <div className="review-hub__status-toggle">
              <button
                type="button"
                className={`review-hub__status-btn ${
                  status === "active" ? "review-hub__status-btn--active" : ""
                }`}
                onClick={() => setStatus("active")}
              >
                Active
              </button>
              <button
                type="button"
                className={`review-hub__status-btn ${
                  status === "closed" ? "review-hub__status-btn--active" : ""
                }`}
                onClick={() => setStatus("closed")}
              >
                Closed
              </button>
            </div>

            <div className="review-hub__field">
              <input
                type="text"
                className="review-hub__input"
                placeholder="Select date range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              />
              <Calendar size={16} className="review-hub__field-icon" />
            </div>

            <div className="review-hub__field">
              <input
                type="search"
                className="review-hub__input"
                placeholder="Search Employee"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={16} className="review-hub__field-icon" />
            </div>
          </div>

          <div
            className={`review-hub__content ${
              activeItem?.dataType === "leave-decisions"
                ? "review-hub__content--list"
                : ""
            }`}
          >
            {activeItem?.dataType === "leave-decisions" ? (
              <LeaveDecisionsPanel item={activeItem} search={search} />
            ) : (
              <ReviewCenterPanel
                item={activeItem}
                status={status}
                search={search}
                dateRange={dateRange}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
