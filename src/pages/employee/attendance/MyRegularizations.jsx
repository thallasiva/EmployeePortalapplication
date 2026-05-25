import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Calendar, Check } from "lucide-react";
import { getLoggedInUser, toISODateString } from "../../../lib/dateUtils";
import {
  EXCEPTION_DAYS,
  REGULARIZATION_HISTORY,
} from "../../../data/regularizations";
import RegularizationDetails from "./RegularizationDetails";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let startPad = first.getDay();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, monthIndex, day));
  }
  return cells;
}

function PendingEmptyIllustration() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <svg width="160" height="100" viewBox="0 0 160 100" className="text-sky-200" aria-hidden>
        <rect x="50" y="35" width="60" height="40" rx="3" stroke="currentColor" fill="none" strokeWidth="1.5" />
        <circle cx="80" cy="52" r="8" stroke="currentColor" fill="none" strokeWidth="1.5" />
        <rect x="25" y="45" width="22" height="28" rx="2" stroke="currentColor" fill="none" strokeWidth="1.5" />
        <ellipse cx="80" cy="22" rx="14" ry="9" stroke="currentColor" fill="none" strokeWidth="1.5" />
      </svg>
      <p className="mt-6 text-sm text-slate-400 text-center max-w-xs">
        Hey, you have no regularization records to view
      </p>
    </div>
  );
}

function ApplyEmptyIllustration() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[280px] py-12">
      <Calendar size={56} strokeWidth={1} className="text-slate-300 mb-4" />
      <p className="text-sm text-slate-400">Select date to start regularizing</p>
    </div>
  );
}

function HistoryCard({ record, expanded, onToggle, onViewDetails }) {
  return (
    <div className="border border-sky-200 rounded-lg bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-6 text-left hover:bg-slate-50/50"
      >
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 min-w-0">
          <div>
            <p className="text-xs text-slate-400">Regularized by</p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {record.regularizedBy}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">No. of days</p>
            <p className="text-sm font-semibold text-slate-800">{record.days}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold text-slate-400 tracking-wide">
            {record.status}
          </span>
          <span className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </button>

      {expanded && (
        <>
          <div className="px-4 py-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-400">Dates applied</p>
              <p className="text-sm font-semibold text-slate-800">{record.datesApplied}</p>
            </div>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Regularized on</p>
              <p className="text-sm font-semibold text-slate-800">{record.regularizedOn}</p>
            </div>
            <button
              type="button"
              onClick={onViewDetails}
              className="text-sm font-medium text-sky-600 hover:text-sky-700"
            >
              View Details
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const DEFAULT_EXCEPTION_ISO = () => {
  const y = new Date().getFullYear();
  const m = String(new Date().getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-15`;
};

export default function MyRegularizations({ onBack }) {
  const navigate = useNavigate();
  const goBack = onBack || (() => navigate("/employee/attendance/daily"));
  const user = getLoggedInUser();

  const today = new Date();
  const [tab, setTab] = useState("apply");
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedIso, setSelectedIso] = useState(DEFAULT_EXCEPTION_ISO);
  const [expandedId, setExpandedId] = useState(1);
  const [detailRecord, setDetailRecord] = useState(null);
  const [pendingItems, setPendingItems] = useState([]);
  const [reason, setReason] = useState("Early Logout");
  const [firstIn, setFirstIn] = useState("10:00");
  const [lastOut, setLastOut] = useState("19:00");

  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();
  const monthLabel = viewDate
    .toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    .toUpperCase();

  const grid = useMemo(() => getMonthGrid(year, monthIndex), [year, monthIndex]);
  const todayIso = toISODateString(today);

  const isException = (date) => {
    const key = `${date.getMonth() + 1}-${date.getDate()}`;
    return EXCEPTION_DAYS.has(key);
  };

  if (detailRecord) {
    return (
      <div className="-mx-1 space-y-3">
        <nav className="text-sm text-sky-600">
        <button type="button" onClick={goBack} className="hover:underline">
          Attendance Info
        </button>
        <span className="text-slate-400 mx-1">/</span>
        <button
          type="button"
          onClick={() => setDetailRecord(null)}
          className="hover:underline"
        >
          My Regularizations
        </button>
          <span className="text-slate-400 mx-1">/</span>
          <span className="text-slate-600">View Details</span>
        </nav>
        <RegularizationDetails
          record={detailRecord}
          onBack={() => setDetailRecord(null)}
        />
      </div>
    );
  }

  return (
    <div className="-mx-1 flex flex-col min-h-[calc(100vh-5.5rem)]">
      <nav className="text-sm text-sky-600 mb-3">
        <button type="button" onClick={goBack} className="hover:underline">
          Attendance Info
        </button>
        <span className="text-slate-400 mx-1">/</span>
        <span className="text-slate-600">My Regularizations</span>
      </nav>

      <div className="relative flex items-center justify-center mb-4 min-h-[40px]">
        <div className="inline-flex rounded-md border border-slate-200 overflow-hidden bg-white">
          {[
            { key: "apply", label: "Apply" },
            { key: "pending", label: "Pending" },
            { key: "history", label: "History" },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-8 py-2 text-sm font-medium border-l border-slate-200 first:border-l-0 transition-colors ${
                tab === key
                  ? "bg-sky-500 text-white"
                  : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "apply" && (
        <div className="flex flex-1 gap-3 min-h-0 flex-col lg:flex-row">
          <div className="lg:w-[240px] shrink-0 bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, monthIndex - 1, 1))}
                className="text-xs text-slate-500 hover:text-sky-600"
              >
                &lt; Prev
              </button>
              <span className="text-xs font-semibold text-slate-700">{monthLabel}</span>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, monthIndex + 1, 1))}
                className="text-xs text-slate-500 hover:text-sky-600"
              >
                Next &gt;
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-slate-400 mb-1">
              {WEEKDAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {grid.map((date, idx) => {
                if (!date) {
                  return <div key={`e-${idx}`} className="h-8" />;
                }
                const iso = toISODateString(date);
                const selected = selectedIso === iso;
                const isToday = iso === todayIso;
                const exception = isException(date);
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedIso(iso)}
                    className={`relative h-8 text-xs rounded flex items-center justify-center ${
                      selected || isToday
                        ? "bg-sky-500 text-white font-semibold"
                        : "text-slate-700 hover:bg-sky-50"
                    }`}
                  >
                    {date.getDate()}
                    {exception && !selected && (
                      <span className="absolute top-0 right-0 w-0 h-0 border-t-[5px] border-t-amber-500 border-l-[5px] border-l-transparent" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 px-2 py-2 bg-emerald-50 border border-emerald-100 rounded text-[11px] text-emerald-700">
              <Check size={14} className="shrink-0" />
              All exception days are regularized
            </div>
          </div>

          <div className="flex-1 bg-white border border-slate-200 rounded-lg min-h-[320px]">
            {selectedIso && isException(new Date(selectedIso + "T12:00:00")) ? (
              <div className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">
                  Regularize —{" "}
                  {new Date(selectedIso + "T12:00:00").toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <div>
                  <label className="text-xs text-slate-500">Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 w-full max-w-md border border-slate-200 rounded-md py-2 px-3 text-sm"
                  >
                    <option>Early Logout</option>
                    <option>Late Login</option>
                    <option>Missed punch</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">First In Time</label>
                  <input
                    type="text"
                    value={firstIn}
                    onChange={(e) => setFirstIn(e.target.value)}
                    className="mt-1 w-full max-w-xs border border-slate-200 rounded-md py-2 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Last Out Time</label>
                  <input
                    type="text"
                    value={lastOut}
                    onChange={(e) => setLastOut(e.target.value)}
                    className="mt-1 w-full max-w-xs border border-slate-200 rounded-md py-2 px-3 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const dateLabel = new Date(
                      selectedIso + "T12:00:00"
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });
                    setPendingItems((prev) => [
                      {
                        id: Date.now(),
                        datesApplied: dateLabel,
                        reason,
                        firstIn,
                        lastOut,
                        status: "PENDING",
                        submittedBy: user?.name || "Employee",
                      },
                      ...prev,
                    ]);
                    setTab("pending");
                  }}
                  className="px-6 py-2 text-sm font-medium rounded-md bg-sky-500 text-white hover:bg-sky-600"
                >
                  Submit Regularization
                </button>
              </div>
            ) : (
              <ApplyEmptyIllustration />
            )}
          </div>

          <div className="lg:w-[200px] shrink-0 bg-amber-50/90 border border-amber-100 rounded-lg p-4 text-xs text-slate-600 leading-relaxed">
            <p>You can regularise for any exception day(s) on or after 05-05-2026</p>
            <p className="mt-3">You can regularise for a maximum of 5 days</p>
          </div>
        </div>
      )}

      {tab === "pending" && (
        <div className="flex-1 bg-white border border-slate-200 rounded-lg">
          {pendingItems.length === 0 ? (
            <PendingEmptyIllustration />
          ) : (
            <ul className="p-4 space-y-3">
              {pendingItems.map((item) => (
                <li
                  key={item.id}
                  className="border border-sky-200 rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.datesApplied}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.reason} · {item.firstIn} – {item.lastOut}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="flex-1 space-y-3 overflow-y-auto pb-4">
          {REGULARIZATION_HISTORY.map((record) => (
            <HistoryCard
              key={record.id}
              record={record}
              expanded={expandedId === record.id}
              onToggle={() =>
                setExpandedId((id) => (id === record.id ? null : record.id))
              }
              onViewDetails={() => setDetailRecord(record)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
