import React, { useState } from "react";
import { YearPicker } from "../../../component/YearPicker";

export default function HolidayCalendar()
{
    const [year, setYear] = useState(String(new Date().getFullYear()));

    const holidays = {
        JAN: [
            { date: "01", day: "Thu", name: "New Year" },
            { date: "15", day: "Thu", name: "Pongal" },
            { date: "26", day: "Mon", name: "Republic Day" },
        ],

        FEB: [],

        MAR: [{ date: "19", day: "Thu", name: "Ugadi" }],

        APR: [],

        MAY: [
            { date: "01", day: "Fri", name: "Mayday / Labour Day" },
            { date: "27", day: "Wed", name: "Bakrid" },
        ],

        JUN: [
            {
                date: "02",
                day: "Tue",
                name: "Telangana Formation Day",
            },
        ],

        JUL: [],

        AUG: [],

        SEP: [
            {
                date: "14",
                day: "Mon",
                name: "Vinayaka Chavithi",
            },
        ],

        OCT: [
            {
                date: "02",
                day: "Fri",
                name: "Gandhi Jayanthi",
            },

            {
                date: "20",
                day: "Tue",
                name: "Dussehra",
            },
        ],

        NOV: [],

        DEC: [
            {
                date: "25",
                day: "Fri",
                name: "Christmas",
            },
        ],
    };

    const monthNames = Object.keys(holidays);

    return (
        <div className="min-h-screen bg-[#f5f7fb] p-6">
            {/* TOP HEADER */}

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-[22px] font-semibold text-[#1f2937]">
                    Holiday Calendar
                </h1>

                <YearPicker
                    value={year}
                    onChange={setYear}
                    selectClassName="h-[40px] w-[120px] border border-[#dbe2ea] rounded bg-white px-3 text-[14px] outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
            </div>

            {/* MONTH GRID */}

            <div className="grid grid-cols-4 gap-4">
                {monthNames.map((month) => (
                    <div
                        key={month}
                        className="
              bg-white
              border
              border-[#dce3eb]
              rounded
              min-h-[230px]
              p-4
            "
                    >
                        {/* MONTH TITLE */}

                        <h2 className="text-[14px] font-semibold text-[#64748b] mb-5">
                            {month} {year}
                        </h2>

                        {/* HOLIDAY LIST */}

                        {holidays[month].length > 0 ? (
                            <div className="space-y-5">
                                {holidays[month].map((holiday, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-4"
                                    >
                                        {/* DATE */}

                                        <div className="min-w-[32px]">
                                            <h3 className="text-[26px] leading-none font-medium text-[#334155]">
                                                {holiday.date}
                                            </h3>

                                            <p className="text-[12px] text-[#94a3b8] mt-1">
                                                {holiday.day}
                                            </p>
                                        </div>

                                        {/* NAME */}

                                        <div>
                                            <p className="text-[14px] text-[#475569] mt-1">
                                                {holiday.name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[160px] flex items-center justify-center">
                                <p className="text-[13px] text-[#c0cad5]">
                                    No Holidays
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}