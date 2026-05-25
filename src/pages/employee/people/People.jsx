import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter, Star } from "lucide-react";
import {
  filterPeopleByCriteria,
  getPeopleDirectory,
  PEOPLE_FILTER_DEFAULTS,
} from "../../../data/peopleDirectory";
import PeopleFilterPanel from "./PeopleFilterPanel";
import { avatarDataUri } from "../../../lib/placeholders";

const STARRED_KEY = "people-starred-ids";

function loadStarredIds() {
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function StarEmptyIllustration() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="relative mb-6">
        <div className="absolute -top-2 -left-6 w-8 h-0.5 bg-sky-300/70 rounded rotate-[-25deg]" />
        <div className="absolute -top-1 right-[-1.5rem] w-6 h-0.5 bg-sky-300/70 rounded rotate-[20deg]" />
        <div className="absolute bottom-2 -left-8 w-5 h-0.5 bg-sky-300/60 rounded rotate-[15deg]" />
        <div className="absolute bottom-0 right-[-1.25rem] w-7 h-0.5 bg-sky-300/60 rounded rotate-[-18deg]" />
        <Star
          size={72}
          strokeWidth={1.25}
          className="text-amber-300 fill-amber-200/80"
        />
      </div>
      <p className="text-sm text-slate-400 max-w-xs">
        Hey, you haven&apos;t starred any peers!
      </p>
    </div>
  );
}

function ListEmptyMessage() {
  return (
    <p className="text-center text-sm text-slate-400 py-10 px-4">
      Looks like you don&apos;t have any records
    </p>
  );
}

function SectionDivider({ title }) {
  return (
    <div className="pt-5 pb-3">
      <p className="text-[11px] font-semibold tracking-wider text-sky-500 uppercase">
        {title}
      </p>
      <div className="mt-2 border-t border-slate-200" />
    </div>
  );
}

const People = () => {
  const allPeople = useMemo(() => getPeopleDirectory(), []);
  const [tab, setTab] = useState("everyone");
  const [query, setQuery] = useState("");
  const [starredIds, setStarredIds] = useState(loadStarredIds);
  const [selectedId, setSelectedId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(PEOPLE_FILTER_DEFAULTS);
  const [draftFilters, setDraftFilters] = useState(PEOPLE_FILTER_DEFAULTS);

  const filteredList = useMemo(() => {
    const base =
      tab === "starred"
        ? allPeople.filter((p) => starredIds.includes(p.id))
        : allPeople;

    const afterFilters = filterPeopleByCriteria(base, appliedFilters);

    const q = query.trim().toLowerCase();
    if (!q) return afterFilters;

    return afterFilters.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.empCode.toLowerCase().includes(q) ||
        String(p.id).includes(q)
    );
  }, [allPeople, tab, starredIds, query, appliedFilters]);

  const openFilterPanel = () => {
    setDraftFilters(appliedFilters);
    setFilterOpen(true);
  };

  const handleApplyFilter = () => {
    setAppliedFilters(draftFilters);
    setFilterOpen(false);
  };

  const handleResetFilter = () => {
    setDraftFilters(PEOPLE_FILTER_DEFAULTS);
    setAppliedFilters(PEOPLE_FILTER_DEFAULTS);
    setFilterOpen(false);
  };

  useEffect(() => {
    if (filteredList.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!filteredList.some((p) => p.id === selectedId)) {
      setSelectedId(filteredList[0].id);
    }
  }, [filteredList, selectedId]);

  const selected =
    filteredList.find((p) => p.id === selectedId) ?? null;

  const toggleStar = (id) => {
    setStarredIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      localStorage.setItem(STARRED_KEY, JSON.stringify(next));
      return next;
    });
  };

  const isStarred = (id) => starredIds.includes(id);

  return (
    <div className="-mx-1 relative flex flex-col min-h-[calc(100vh-5.5rem)] bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-4">
        {[
          { key: "starred", label: "Starred" },
          { key: "everyone", label: "Everyone" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`relative px-4 py-3 text-sm font-medium transition-colors ${
              tab === key
                ? "text-slate-800"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {label}
            {tab === key && (
              <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-sky-500 rounded-t" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left list */}
        <div className="w-full max-w-[320px] shrink-0 border-r border-slate-200 flex flex-col min-h-0">
          <div className="p-3 flex gap-2 border-b border-slate-100">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Emp. Name or ID"
                className="w-full border border-slate-200 rounded-md py-2 pl-3 pr-9 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
              />
              <Search
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
            <button
              type="button"
              onClick={openFilterPanel}
              className={`shrink-0 w-10 h-10 border rounded-md flex items-center justify-center transition-colors ${
                filterOpen || appliedFilters.location !== "all" ||
                appliedFilters.department !== "all" ||
                appliedFilters.holidayCalendar !== "all"
                  ? "border-sky-400 bg-sky-50 text-sky-600"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
              aria-label="Filter"
            >
              <Filter size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredList.length === 0 ? (
              <ListEmptyMessage />
            ) : (
              <ul>
                {filteredList.map((person) => {
                  const active = person.id === selectedId;
                  return (
                    <li key={person.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(person.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-slate-50 transition-colors ${
                          active ? "bg-sky-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <img
                          src={avatarDataUri(person.id, 40)}
                          alt=""
                          className="w-9 h-9 rounded-full shrink-0 object-cover"
                        />
                        <span className="text-sm text-slate-700 truncate">
                          {person.name}{" "}
                          <span className="text-slate-400">
                            ({person.empCode})
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right detail */}
        <div className="flex-1 min-w-0 bg-white">
          {tab === "starred" && starredIds.length === 0 ? (
            <StarEmptyIllustration />
          ) : !selected ? (
            <ListEmptyMessage />
          ) : (
            <div className="h-full overflow-y-auto p-5 md:p-6">
              <div className="flex items-start gap-5 pb-4 border-b border-slate-100">
                <img
                  src={avatarDataUri(selected.id, 88)}
                  alt=""
                  className="w-[88px] h-[88px] rounded-full shrink-0 object-cover"
                />
                <div className="pt-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-semibold text-slate-800">
                      {selected.name}
                    </h2>
                    <button
                      type="button"
                      onClick={() => toggleStar(selected.id)}
                      className="p-1 rounded hover:bg-slate-100"
                      aria-label={
                        isStarred(selected.id)
                          ? "Remove from starred"
                          : "Add to starred"
                      }
                    >
                      <Star
                        size={20}
                        className={
                          isStarred(selected.id)
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-300"
                        }
                      />
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {selected.empCode}
                  </p>
                </div>
              </div>

              <SectionDivider title="Contact Details" />
              <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-4 text-sm py-1">
                <span className="text-slate-500">Email Id</span>
                <span className="text-slate-800 break-all">{selected.email}</span>
                <span className="text-slate-500">Mobile</span>
                <span className="text-slate-800">{selected.mobile}</span>
              </div>

              <SectionDivider title="Category" />
              <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-4 text-sm py-1">
                <span className="text-slate-500">Job Title</span>
                <span className="text-slate-800">{selected.jobTitle}</span>
                <span className="text-slate-500">Reporting To</span>
                <span className="text-slate-800">{selected.reportingTo}</span>
                <span className="text-slate-500">Status</span>
                <span className="text-slate-800">{selected.status}</span>
              </div>

              <SectionDivider title="Other Information" />
              <div className="grid grid-cols-[140px_1fr] gap-y-3 gap-x-4 text-sm py-1">
                <span className="text-slate-500">Blood Group</span>
                <span className="text-slate-800">{selected.bloodGroup}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {filterOpen && (
        <>
          <button
            type="button"
            className="absolute inset-0 z-20 bg-black/10"
            aria-label="Close filter overlay"
            onClick={() => setFilterOpen(false)}
          />
          <PeopleFilterPanel
            draft={draftFilters}
            onDraftChange={setDraftFilters}
            onApply={handleApplyFilter}
            onReset={handleResetFilter}
            onClose={() => setFilterOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export default People;
