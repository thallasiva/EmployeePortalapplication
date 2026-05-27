import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import HiringProfileCardsIllustration from "./HiringProfileCardsIllustration";
import { APPLIED_JOBS } from "../../../data/hiringFilters";

export default function AppliedJobs({ onApplyForJob }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return APPLIED_JOBS.filter((row) => {
      if (!q) return true;
      return (
        row.title?.toLowerCase().includes(q) ||
        row.id?.toLowerCase().includes(q)
      );
    });
  }, [search]);

  return (
    <div className="hiring-simple-page">
      <h1 className="hiring-simple-page__title">Applied Jobs</h1>

      <div className="hiring-search-wrap">
        <input
          type="search"
          className="hiring-search"
          placeholder="Search by name or job id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Search size={18} className="hiring-search__icon" />
      </div>

      <div className="hiring-results hiring-results--simple">
        <div className="hiring-results__header hiring-results__header--applied">
          <span>Job details</span>
          <span>Application Status</span>
          <span>Applied</span>
        </div>

        <div className="hiring-results__body">
          {filtered.length === 0 ? (
            <div className="hiring-empty hiring-empty--cta">
              <HiringProfileCardsIllustration />
              <p className="hiring-empty__message">
                You haven&apos;t applied for a job yet.
              </p>
              <button
                type="button"
                className="hiring-btn-primary"
                onClick={onApplyForJob}
              >
                Apply for a job
              </button>
            </div>
          ) : (
            filtered.map((row) => (
              <div
                key={row.id}
                className="hiring-results__row hiring-results__row--applied"
              >
                <div>
                  <div className="hiring-job-row__title">{row.title}</div>
                  <div className="hiring-job-row__meta">{row.id}</div>
                </div>
                <span className="hiring-applied-status">{row.status}</span>
                <span className="hiring-job-row__posted">{row.applied}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
