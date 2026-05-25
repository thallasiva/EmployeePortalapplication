import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
} from "lucide-react";

export default function LeaveCalendar() {
  const [value, setValue] = useState(new Date());

  const holidayMonthDays = [
    { month: 5, day: 1 },
    { month: 5, day: 27 },
    { month: 1, day: 26 },
    { month: 8, day: 15 },
    { month: 10, day: 2 },
    { month: 12, day: 25 },
  ];

  const calendarYear = value.getFullYear();
  const holidays = holidayMonthDays.map(
    ({ month, day }) =>
      `${calendarYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  );

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      {/* HEADER */}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-semibold text-[#1f2937]">
          Leave Calendar
        </h1>

        <div className="flex items-center gap-4">
          <button className="text-[14px] text-[#64748b]">
            Quick Links
          </button>

          <button className="text-[#64748b]">🔔</button>

          <button className="text-[#64748b]">⏻</button>
        </div>
      </div>

      {/* FILTERS */}

      <div className="flex items-center justify-between mb-5">
        <div>
          <label className="block text-[13px] text-[#64748b] mb-2">
            Filter Type
          </label>

          <select
            className="
              h-[40px]
              w-[170px]
              border
              border-[#dbe2ea]
              rounded
              px-3
              bg-white
              text-[14px]
              outline-none
            "
          >
            <option>Me</option>
            <option>Team</option>
            <option>Department</option>
          </select>
        </div>

        <button
          className="
            h-[42px]
            px-5
            bg-[#2ea7ff]
            text-white
            rounded
            flex
            items-center
            gap-2
          "
        >
          <Download size={16} />
        </button>
      </div>

      {/* CONTENT */}

      <div className="grid grid-cols-12 gap-5">
        {/* LEFT CALENDAR */}

        <div className="col-span-7 bg-white border border-[#dce3eb] rounded">
          {/* CUSTOM CALENDAR STYLE */}

          <style>{`
            .react-calendar {
              width: 100%;
              border: none;
              font-family: inherit;
            }

            .react-calendar__navigation {
              height: 70px;
              margin-bottom: 0;
              border-bottom: 1px solid #e6edf5;
            }

            .react-calendar__navigation button {
              font-size: 16px;
              color: #334155;
              min-width: 44px;
              background: transparent;
            }

            .react-calendar__month-view__weekdays {
              text-align: center;
              border-bottom: 1px solid #e6edf5;
            }

            .react-calendar__month-view__weekdays__weekday {
              padding: 14px 0;
              font-size: 13px;
              color: #64748b;
              text-transform: uppercase;
            }

            .react-calendar__tile {
              height: 100px;
              text-align: left;
              padding: 12px;
              border-right: 1px solid #e6edf5 !important;
              border-bottom: 1px solid #e6edf5 !important;
              position: relative;
              background: white;
            }

            .react-calendar__tile:hover {
              background: #f8fbff !important;
            }

            .react-calendar__tile--active {
              background: #eef7ff !important;
              color: #1f2937 !important;
            }

            .react-calendar__tile--active abbr {
              background: #2ea7ff;
              color: white;
              border-radius: 999px;
              padding: 4px 8px;
            }

            .holiday-dot {
              width: 10px;
              height: 10px;
              background: #d9b8ff;
              border-radius: 999px;
              position: absolute;
              bottom: 10px;
              right: 10px;
            }

            .react-calendar__tile abbr {
              text-decoration: none;
              font-size: 14px;
            }
          `}</style>

          {/* CALENDAR */}

          <Calendar
            onChange={setValue}
            value={value}
            prevLabel={<ChevronLeft size={18} />}
            nextLabel={<ChevronRight size={18} />}
            tileContent={({ date, view }) => {
              if (
                view === "month" &&
                holidays.includes(formatDate(date))
              ) {
                return <div className="holiday-dot" />;
              }

              return null;
            }}
          />

          {/* LEGEND */}

          <div className="flex items-center gap-8 px-5 py-4 border-t border-[#e6edf5]">
            <div className="flex items-center gap-2 text-[13px] text-[#64748b]">
              <div className="w-3 h-3 rounded-full bg-[#2ea7ff]" />
              Team on Leave
            </div>

            <div className="flex items-center gap-2 text-[13px] text-[#64748b]">
              <div className="w-3 h-3 rounded-full bg-[#facc15]" />
              Restricted Holiday
            </div>

            <div className="flex items-center gap-2 text-[13px] text-[#64748b]">
              <div className="w-3 h-3 rounded-full bg-[#d9b8ff]" />
              General Holiday
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}

        <div className="col-span-5 bg-white border border-[#dce3eb] rounded">
          {/* SEARCH */}

          <div className="p-4 border-b border-[#e6edf5]">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search Employee"
                  className="
                    w-full
                    h-[40px]
                    border
                    border-[#dbe2ea]
                    rounded
                    pl-10
                    pr-4
                    text-[14px]
                    outline-none
                  "
                />

                <Search
                  size={16}
                  className="absolute left-3 top-3 text-[#94a3b8]"
                />
              </div>

              <button
                className="
                  h-[40px]
                  w-[40px]
                  border
                  border-[#dbe2ea]
                  rounded
                  flex
                  items-center
                  justify-center
                "
              >
                <Filter size={16} />
              </button>
            </div>
          </div>

          {/* TABLE HEADER */}

          <div className="grid grid-cols-3 bg-[#f8fafc] border-b border-[#e6edf5]">
            <div className="px-4 py-3 text-[13px] font-medium text-[#64748b]">
              Employee
            </div>

            <div className="px-4 py-3 text-[13px] font-medium text-[#64748b]">
              Number of days
            </div>

            <div className="px-4 py-3 text-[13px] font-medium text-[#64748b]">
              From-To
            </div>
          </div>

          {/* EMPTY STATE */}

          <div className="h-[600px] flex flex-col items-center justify-center">
            <div className="w-[110px] h-[110px] rounded-full bg-[#f1f5f9] flex items-center justify-center text-[40px]">
              📄
            </div>

            <p className="mt-5 text-[17px] font-medium text-[#64748b]">
              No Employees are on leave
            </p>

            <p className="mt-2 text-[14px] text-[#94a3b8]">
              Leave transactions will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}