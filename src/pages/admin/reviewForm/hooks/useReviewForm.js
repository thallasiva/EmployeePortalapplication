import { useState, useMemo, useCallback } from "react";
import { REVIEW_CYCLES, REVIEW_STATUSES } from "../constants";

export function useReviewForm() {
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredCycles = useMemo(
    () =>
      REVIEW_CYCLES.map((cycle) => ({
        ...cycle,
        reviews:
          filterStatus === "All"
            ? cycle.reviews
            : cycle.reviews.filter((r) => r.status === filterStatus),
      })).filter((cycle) => cycle.reviews.length > 0),
    [filterStatus]
  );

  const stats = useMemo(() => {
    const allReviews = REVIEW_CYCLES.flatMap((c) => c.reviews);
    return {
      total: allReviews.length,
      completed: allReviews.filter((r) => r.status === "Completed").length,
      inProgress: allReviews.filter((r) => r.status === "In Progress").length,
      pending: allReviews.filter(
        (r) => r.status === "Pending" || r.status === "Not Started"
      ).length,
    };
  }, []);

  const handleFilterChange = useCallback((status) => {
    setFilterStatus(status);
  }, []);

  return { filterStatus, filteredCycles, stats, statuses: REVIEW_STATUSES, handleFilterChange };
}
