import { useState } from "react";
import LeaveCalendar from "./LeaveCalendar";
import HolidayCalendar from "./HolidayCalendar";

const TABS = [
    { key: "leave",   label: "Leave Calendar" },
    { key: "holiday", label: "Holiday Calendar" },
];

export default function LeaveCalendarHub() {
    const [activeTab, setActiveTab] = useState("leave");

    return (
        <div className="min-h-screen bg-[#f0f4f8]">
            {/* Header */}
            <div className="px-6 py-4">
                <h1 className="text-[20px] font-bold text-[#1f2937]">Calendar</h1>
                <p className="text-[13px] text-[#94a3b8] mt-0.5">View leave and holiday calendars</p>
            </div>

            {/* Tabs */}
            <div className="px-6 mb-0">
                <div className="flex gap-1 bg-white rounded-xl border border-[#e8eef5] p-1 w-fit">
                    {TABS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-6 h-[38px] rounded-lg text-[13px] font-medium transition-all ${
                                activeTab === key
                                    ? "bg-[#f18200] text-white shadow-sm"
                                    : "text-[#64748b] hover:text-[#1f2937]"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content — render each component inline */}
            <div>
                {activeTab === "leave"   && <LeaveCalendar />}
                {activeTab === "holiday" && <HolidayCalendar />}
            </div>
        </div>
    );
}
