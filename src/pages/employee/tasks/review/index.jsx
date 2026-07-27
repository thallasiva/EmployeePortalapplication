import React, { useState, useMemo, useCallback } from "react";
import { findReviewNavItem } from "../../../../data/reviewHub";
import "../reviewHub.css";
import ReviewSidebar from "./components/ReviewSidebar";
import ReviewMain    from "./components/ReviewMain";

export default function Review() {
  const [activeItemId,  setActiveItemId]  = useState("leave");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [search,        setSearch]        = useState("");

  const activeItem = useMemo(() => findReviewNavItem(activeItemId), [activeItemId]);

  const handleNavClick = useCallback((id) => {
    setActiveItemId(id);
    setStatusFilter("all");
    setSearch("");
  }, []);

  const handleStatusFilter = useCallback((key) => setStatusFilter(key), []);
  const handleSearch       = useCallback((val) => setSearch(val), []);

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .rv-nav-btn:hover { background: #eef6ff !important; color: #1890ff !important; }
      `}</style>

      <div className="review-hub">
        <div className="review-hub__layout">
          <ReviewSidebar activeItemId={activeItemId} onNavClick={handleNavClick} />
          <ReviewMain
            activeItem={activeItem}
            statusFilter={statusFilter}
            onStatusFilter={handleStatusFilter}
            search={search}
            onSearch={handleSearch}
          />
        </div>
      </div>
    </>
  );
}
