import React from "react";
import { Search, Filter } from "lucide-react";
import { MONTH_NAMES } from "../constants";
import { avatarColor, initials, daysBetween } from "../utils";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SidePanel = React.memo(function SidePanel({
  selected,
  selectedHoliday,
  selectedLeaves,
  search,
  onSearchChange,
  monthLeaves,
  loading,
  month,
  year,
}) {
  return (
    <>
      {selectedHoliday && (
        <div className="flex items-start gap-3 p-4 border-b border-[#e6edf5] bg-purple-50/50">
          <div className="text-center min-w-[40px]">
            <p className="text-xl font-bold text-gray-800">
              {selected.getDate().toString().padStart(2, "0")}
            </p>
            <p className="text-xs text-gray-500">{DAY_NAMES[selected.getDay()]}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">
              {selectedHoliday.is_restricted ? "Restricted Holiday" : "General Holiday"}
            </p>
            <p className="text-sm font-semibold text-gray-800">{selectedHoliday.holiday_name}</p>
          </div>
        </div>
      )}

      <div className="p-3 border-b border-[#e6edf5]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search employee…"
              className="w-full h-9 border border-[#dbe2ea] rounded pl-8 pr-3 text-sm outline-none"
            />
          </div>
          <button className="h-9 w-9 border border-[#dbe2ea] rounded flex items-center justify-center text-[#64748b]">
            <Filter size={14} />
          </button>
        </div>
      </div>

      {selectedLeaves.length > 0 && (
        <div className="border-b border-[#e6edf5] px-4 py-3 bg-blue-50/40">
          <p className="text-xs font-semibold text-blue-600 mb-2">
            On leave {selected.getDate()} {MONTH_NAMES[selected.getMonth()]}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedLeaves.map((lr, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-blue-100 px-2.5 py-1 text-xs text-gray-700"
              >
                <span
                  className={`w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center ${avatarColor(lr.employee_name)}`}
                >
                  {initials(lr.employee_name || "?")}
                </span>
                {lr.employee_name || "Employee"}
                <span className="text-gray-400">· {lr.leave_type_name || lr.leave_type}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e6edf5]">
        <p className="text-[13px] font-semibold text-[#334155]">
          Leave Transactions ({monthLeaves.length})
        </p>
        <span className="text-xs text-[#94a3b8]">
          {MONTH_NAMES[month - 1]} {year}
        </span>
      </div>

      <div className="grid grid-cols-3 bg-[#f8fafc] border-b border-[#e6edf5]">
        <div className="px-4 py-2.5 text-[12px] font-medium text-[#64748b]">Employee</div>
        <div className="px-4 py-2.5 text-[12px] font-medium text-[#64748b]">Days</div>
        <div className="px-4 py-2.5 text-[12px] font-medium text-[#64748b]">From – To</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">Loading…</div>
        ) : monthLeaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center text-3xl mb-3">
              📄
            </div>
            <p className="text-[15px] font-medium text-[#64748b]">No employees on leave</p>
            <p className="mt-1 text-[13px] text-[#94a3b8]">
              Approved leaves for {MONTH_NAMES[month - 1]} will appear here.
            </p>
          </div>
        ) : (
          monthLeaves.map((lr, i) => {
            const from = lr.from_date?.split("T")[0];
            const to = lr.to_date?.split("T")[0];
            const days = from && to ? daysBetween(from, to) : lr.days || "—";
            return (
              <div
                key={lr.leave_request_id || i}
                className="grid grid-cols-3 border-b border-[#f1f5f9] hover:bg-[#f8fbff]"
              >
                <div className="px-4 py-3 flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 ${avatarColor(lr.employee_name)}`}
                  >
                    {initials(lr.employee_name || "?")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-gray-800 truncate">
                      {lr.employee_name || "Employee"}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {lr.leave_type_name || lr.leave_type || "Leave"}
                    </p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center">
                  <span className="text-[13px] font-semibold text-gray-700">{days}</span>
                  <span className="ml-1 text-[11px] text-gray-400">day{days !== 1 ? "s" : ""}</span>
                </div>
                <div className="px-4 py-3 flex items-center">
                  <p className="text-[12px] text-gray-600">
                    {from
                      ? new Date(from).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                      : "—"}
                    {from !== to && to
                      ? ` – ${new Date(to).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`
                      : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
});

export default SidePanel;
