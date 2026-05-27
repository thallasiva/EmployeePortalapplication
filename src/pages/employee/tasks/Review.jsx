import React, { useMemo, useState } from "react";
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
import "./reviewHub.css";

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

          <div className="review-hub__content">
            <ReviewCenterPanel
              item={activeItem}
              status={status}
              search={search}
              dateRange={dateRange}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
