import React, { useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import HiringProfileCardsIllustration from "./HiringProfileCardsIllustration";
import { MY_REFERRALS, REFERRAL_JOB_OPTIONS } from "../../../data/hiringFilters";

export default function MyReferrals({ onReferCandidate }) {
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MY_REFERRALS.filter((row) => {
      if (jobFilter !== "all" && row.jobId !== jobFilter) return false;
      if (q && !row.candidateName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, jobFilter]);

  return (
    <div className="hiring-simple-page">
      <h1 className="hiring-simple-page__title">My Referrals</h1>

      <div className="hiring-simple-page__toolbar">
        <div className="hiring-search-wrap hiring-search-wrap--inline">
          <input
            type="search"
            className="hiring-search hiring-search--md"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={18} className="hiring-search__icon" />
        </div>

        <div className="hiring-select-wrap">
          <select
            className="hiring-select"
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            aria-label="Filter by job"
          >
            {REFERRAL_JOB_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="hiring-select__chevron" />
        </div>
      </div>

      <div className="hiring-results hiring-results--simple">
        <div className="hiring-results__header hiring-results__header--3col">
          <span>Candidate Name</span>
          <span>Referred in</span>
          <span>Status</span>
        </div>

        <div className="hiring-results__body">
          {filtered.length === 0 ? (
            <div className="hiring-empty hiring-empty--cta">
              <HiringProfileCardsIllustration />
              <p className="hiring-empty__message">
                You haven&apos;t referred any candidate yet.
              </p>
              <button
                type="button"
                className="hiring-btn-primary"
                onClick={onReferCandidate}
              >
                Refer a candidate
              </button>
            </div>
          ) : (
            filtered.map((row) => (
              <div
                key={row.id}
                className="hiring-results__row hiring-results__row--3col"
              >
                <span>{row.candidateName}</span>
                <span>{row.referredIn}</span>
                <span>{row.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
