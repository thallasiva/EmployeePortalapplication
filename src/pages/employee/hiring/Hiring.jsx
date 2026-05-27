import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import HiringFilters from "./HiringFilters";
import HiringEmptyState from "./HiringEmptyState";
import MyReferrals from "./MyReferrals";
import AppliedJobs from "./AppliedJobs";
import { INTERNAL_JOBS } from "../../../data/hiringFilters";
import "./hiring.css";

const HEADER_TABS = [
  { id: "jobs", label: "Jobs" },
  { id: "referrals", label: "My Referrals" },
  { id: "applied", label: "Applied Jobs" },
];

const SUB_TABS = [
  { id: "internal", label: "INTERNAL JOBS" },
  { id: "referral", label: "OPEN FOR REFERRAL" },
];

export default function Hiring() {
  const [headerTab, setHeaderTab] = useState("jobs");
  const [subTab, setSubTab] = useState("internal");
  const [search, setSearch] = useState("");
  const [dateAdded, setDateAdded] = useState("anytime");
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);

  const toggleDepartment = (dept) => {
    setDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const toggleLocation = (loc) => {
    setLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return INTERNAL_JOBS.filter((job) => {
      if (q) {
        const match =
          job.title?.toLowerCase().includes(q) ||
          job.id?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (departments.length && !departments.includes(job.department)) {
        return false;
      }
      if (locations.length && !locations.includes(job.location)) {
        return false;
      }
      return true;
    });
  }, [search, departments, locations]);

  const goToJobs = () => setHeaderTab("jobs");

  return (
    <div className="hiring-portal">
      <header className="hiring-header">
        <nav className="hiring-header__nav">
          {HEADER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`hiring-header__tab ${
                headerTab === tab.id ? "hiring-header__tab--active" : ""
              }`}
              onClick={() => setHeaderTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        
      </header>

      {headerTab === "jobs" && (
        <div className="hiring-subnav">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`hiring-subnav__tab ${
                subTab === tab.id ? "hiring-subnav__tab--active" : ""
              }`}
              onClick={() => setSubTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {headerTab === "jobs" && (
        <div className="hiring-body">
          <HiringFilters
            dateAdded={dateAdded}
            onDateAddedChange={setDateAdded}
            departments={departments}
            onDepartmentToggle={toggleDepartment}
            locations={locations}
            onLocationToggle={toggleLocation}
          />

          <main className="hiring-main">
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

            <div className="hiring-results">
              <div className="hiring-results__header">
                <span>Job details</span>
                <span>Posted</span>
              </div>

              <div className="hiring-results__body">
                {filteredJobs.length === 0 ? (
                  <HiringEmptyState />
                ) : (
                  filteredJobs.map((job) => (
                    <div key={job.id} className="hiring-job-row">
                      <div>
                        <div className="hiring-job-row__title">{job.title}</div>
                        <div className="hiring-job-row__meta">
                          {job.id} · {job.department} · {job.location}
                        </div>
                      </div>
                      <span className="hiring-job-row__posted">{job.posted}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      )}

      {headerTab === "referrals" && (
        <MyReferrals onReferCandidate={goToJobs} />
      )}

      {headerTab === "applied" && (
        <AppliedJobs onApplyForJob={goToJobs} />
      )}
    </div>
  );
}
