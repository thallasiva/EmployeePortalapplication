import React, { useEffect, useState } from "react";
import { listHolidays } from "../../api/holiday.api";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function formatHolidayDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

function getDayName(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

export default function TimeOff() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    listHolidays({ year, limit: 200 })
      .then((data) => setHolidays(Array.isArray(data) ? data : []))
      .catch(() => setHolidays([]))
      .finally(() => setLoading(false));
  }, [year]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = holidays
    .filter((h) => new Date(h.holiday_date) >= today)
    .sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date));

  const history = holidays
    .filter((h) => new Date(h.holiday_date) < today)
    .sort((a, b) => new Date(b.holiday_date) - new Date(a.holiday_date));

  const tableData = activeTab === "upcoming" ? upcoming : history;

  // Stats from all holidays
  const totalHolidays = holidays.length;
  const totalUpcoming = upcoming.length;
  const totalPast = history.length;
  const thisMonth = holidays.filter((h) => {
    const d = new Date(h.holiday_date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;

  const yearOptions = [year - 1, year, year + 1];

  return (
    <div className="bg-[#f5f6f8] min-h-screen p-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Card — Holidays List */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-[28px] font-semibold text-[#1c2746]">Holidays List</h2>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 px-3 border border-gray-300 rounded text-sm text-gray-600 outline-none"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="p-4">
            {/* Tabs */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex shadow rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`px-8 h-11 text-[14px] font-semibold ${
                    activeTab === "upcoming" ? "bg-[#f18200] text-white" : "bg-white text-black"
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-8 h-11 text-[14px] font-semibold ${
                    activeTab === "history" ? "bg-[#f18200] text-white" : "bg-white text-black"
                  }`}
                >
                  History
                </button>
              </div>
              <span className="text-sm text-gray-500 ml-auto">
                {tableData.length} holiday{tableData.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                Loading holidays…
              </div>
            ) : tableData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <p className="text-sm">No {activeTab === "upcoming" ? "upcoming" : "past"} holidays for {year}.</p>
              </div>
            ) : (
              <div className="border border-gray-300 rounded overflow-hidden">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-300 bg-gray-50">
                    <tr className="text-[13px] text-gray-600 font-semibold">
                      <th className="px-4 py-3 w-[44px]">#</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Day</th>
                      <th className="px-4 py-3">Holiday</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((item, idx) => (
                      <tr key={item.id ?? idx} className="text-[13px] text-gray-800 border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatHolidayDate(item.holiday_date)}</td>
                        <td className="px-4 py-3 text-gray-500">{getDayName(item.holiday_date)}</td>
                        <td className="px-4 py-3 font-medium">{item.holiday_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Card — Holiday Summary */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-[24px] font-semibold text-[#1c2746] uppercase">Holiday Summary</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Year Range */}
            <div className="p-4">
              <h3 className="font-semibold text-[14px] mb-2">Year</h3>
              <p className="text-[14px] text-black">01 January – 31 December {year}</p>
            </div>

            {/* Stats */}
            <div className="p-4">
              <h3 className="font-semibold text-[14px] mb-4">Holiday Count</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total", value: totalHolidays, color: "#f18200" },
                  { label: "Upcoming", value: totalUpcoming, color: "#16a34a" },
                  { label: "Completed", value: totalPast, color: "#6b7280" },
                ].map((s) => (
                  <div key={s.label} className="text-center rounded-lg border border-gray-100 py-3 px-2">
                    <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* This month */}
            <div className="p-4">
              <h3 className="font-semibold text-[14px] mb-3">
                This Month ({MONTHS[today.getMonth()]})
              </h3>
              {thisMonth === 0 ? (
                <p className="text-[14px] text-gray-500">No holidays this month.</p>
              ) : (
                <div className="space-y-2">
                  {holidays
                    .filter((h) => {
                      const d = new Date(h.holiday_date);
                      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
                    })
                    .map((h, i) => (
                      <div key={i} className="flex items-center gap-3 text-[13px]">
                        <span className="w-2 h-2 rounded-full bg-[#f18200] shrink-0"></span>
                        <span className="font-medium">{h.holiday_name}</span>
                        <span className="text-gray-400 ml-auto whitespace-nowrap">{formatHolidayDate(h.holiday_date)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Next holiday */}
            <div className="p-4">
              <h3 className="font-semibold text-[14px] mb-3">Next Holiday</h3>
              {upcoming.length === 0 ? (
                <p className="text-[14px] text-gray-500">No upcoming holidays for {year}.</p>
              ) : (
                <div className="flex items-start gap-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="text-center bg-[#f18200] text-white rounded-lg px-3 py-2 min-w-[52px]">
                    <p className="text-xl font-bold leading-none">
                      {new Date(upcoming[0].holiday_date).getDate()}
                    </p>
                    <p className="text-[10px] uppercase mt-0.5">
                      {MONTHS[new Date(upcoming[0].holiday_date).getMonth()]?.slice(0, 3)}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-[14px] text-[#1c2746]">{upcoming[0].holiday_name}</p>
                    <p className="text-[13px] text-gray-500 mt-0.5">{getDayName(upcoming[0].holiday_date)}</p>
                    {(() => {
                      const diff = Math.ceil((new Date(upcoming[0].holiday_date) - today) / 86400000);
                      return (
                        <p className="text-[12px] text-[#f18200] font-medium mt-1">
                          {diff === 0 ? "Today!" : diff === 1 ? "Tomorrow" : `In ${diff} days`}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
