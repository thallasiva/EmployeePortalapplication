import React, { useEffect, useMemo, useState } from "react";
import {
    CalendarHeart,
    PartyPopper,
    Flag,
    Sparkles,
    Gift,
    Moon,
    Briefcase,
    CalendarDays,
    Clock3,
} from "lucide-react";
import { YearPicker } from "../../../component/YearPicker";
import { listHolidays } from "../../../api/holiday.api";

const MONTH_INDEX = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

const MONTH_KEYS = Object.keys(MONTH_INDEX);

function emptyMonthMap() {
    return MONTH_KEYS.reduce((acc, month) => {
        acc[month] = [];
        return acc;
    }, {});
}

/** Groups backend holiday rows (holiday_date as YYYY-MM-DD) into the per-month shape this page renders. */
function groupHolidaysByMonth(rows) {
    const grouped = emptyMonthMap();
    (rows || []).forEach((row) => {
        const d = new Date(row.holiday_date);
        if (Number.isNaN(d.getTime())) return;
        const month = MONTH_KEYS[d.getMonth()];
        grouped[month].push({
            date: String(d.getDate()).padStart(2, "0"),
            day: d.toLocaleDateString("en-US", { weekday: "short" }),
            name: row.holiday_name,
            dateObj: d,
            isRestricted: !!row.is_restricted,
        });
    });
    MONTH_KEYS.forEach((month) => {
        grouped[month].sort((a, b) => a.dateObj - b.dateObj);
    });
    return grouped;
}

const ICON_THEMES = [
    {
        match: /new year/i,
        icon: PartyPopper,
        classes: "bg-purple-50 text-purple-600",
    },
    {
        match: /republic|independence|gandhi|formation day|flag/i,
        icon: Flag,
        classes: "bg-blue-50 text-blue-600",
    },
    {
        match: /christmas/i,
        icon: Gift,
        classes: "bg-red-50 text-red-600",
    },
    {
        match: /bakrid|eid|ramzan|ramadan/i,
        icon: Moon,
        classes: "bg-teal-50 text-teal-600",
    },
    {
        match: /labour|may day|mayday/i,
        icon: Briefcase,
        classes: "bg-green-50 text-green-600",
    },
    {
        match: /pongal|ugadi|diwali|dussehra|vinayaka|ganesh|navratri|holi/i,
        icon: Sparkles,
        classes: "bg-amber-50 text-amber-600",
    },
];

const DEFAULT_THEME = { icon: CalendarHeart, classes: "bg-brand-50 text-brand" };

function getHolidayTheme(name) {
    return ICON_THEMES.find((theme) => theme.match.test(name)) || DEFAULT_THEME;
}

export default function HolidayCalendar()
{
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [holidays, setHolidays] = useState(emptyMonthMap());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        listHolidays({ year, limit: 200 })
            .then(({ data }) => {
                if (cancelled) return;
                setHolidays(groupHolidaysByMonth(data));
            })
            .catch(() => {
                if (!cancelled) setHolidays(emptyMonthMap());
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [year]);

    const monthNames = MONTH_KEYS;

    const totalHolidays = useMemo(
        () => monthNames.reduce((sum, month) => sum + (holidays[month]?.length || 0), 0),
        [holidays, monthNames]
    );

    const upcomingHoliday = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allHolidays = monthNames.flatMap((month) =>
            (holidays[month] || []).map((holiday) => ({
                ...holiday,
                month,
            }))
        );

        const upcoming = allHolidays
            .filter((holiday) => holiday.dateObj >= today)
            .sort((a, b) => a.dateObj - b.dateObj)[0];

        if (!upcoming) return null;

        const diffDays = Math.round((upcoming.dateObj - today) / (1000 * 60 * 60 * 24));
        return { ...upcoming, diffDays };
    }, [holidays, monthNames]);

    return (
        <div className="min-h-screen bg-[#f5f7fb] p-6">
            {/* TOP HEADER */}

            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-brand-600 p-6 text-white shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                            <CalendarHeart size={26} />
                        </div>
                        <div>
                            <h1 className="text-[22px] font-semibold">Holiday Calendar</h1>
                            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/80">
                                <CalendarDays size={14} />
                                {loading
                                    ? "Loading holidays..."
                                    : `${totalHolidays} holidays scheduled in ${year}`}
                            </p>
                        </div>
                    </div>

                    <YearPicker
                        value={year}
                        onChange={setYear}
                        showIcon={false}
                        selectClassName="h-[40px] w-[120px] border border-white/30 rounded-lg bg-white/15 text-white px-3 text-[14px] font-medium outline-none focus:ring-2 focus:ring-white/40 [&>option]:text-gray-800"
                    />
                </div>

                {upcomingHoliday && (
                    <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                            <Clock3 size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs uppercase tracking-wide text-white/70">Next Holiday</p>
                            <p className="truncate text-[15px] font-medium">
                                {upcomingHoliday.name} — {upcomingHoliday.month} {upcomingHoliday.date}, {year}
                            </p>
                        </div>
                        <span className="ml-auto shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                            {upcomingHoliday.diffDays === 0
                                ? "Today"
                                : upcomingHoliday.diffDays === 1
                                ? "Tomorrow"
                                : `In ${upcomingHoliday.diffDays} days`}
                        </span>
                    </div>
                )}
            </div>

            {/* MONTH GRID */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {monthNames.map((month) => (
                    <div
                        key={month}
                        className="
              bg-white
              border
              border-[#dce3eb]
              rounded-xl
              min-h-[230px]
              p-4
              shadow-sm
              transition-shadow
              hover:shadow-md
            "
                    >
                        {/* MONTH TITLE */}

                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-[14px] font-semibold text-[#64748b]">
                                {month} {year}
                            </h2>
                            {holidays[month].length > 0 && (
                                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
                                    {holidays[month].length}
                                </span>
                            )}
                        </div>

                        {/* HOLIDAY LIST */}

                        {holidays[month].length > 0 ? (
                            <div className="space-y-3">
                                {holidays[month].map((holiday, index) => {
                                    const theme = getHolidayTheme(holiday.name);
                                    const Icon = theme.icon;
                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-[#f8fafc]"
                                        >
                                            {/* ICON */}

                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${theme.classes}`}
                                            >
                                                <Icon size={18} />
                                            </div>

                                            {/* DATE */}

                                            <div className="min-w-[32px] text-center">
                                                <h3 className="text-[20px] leading-none font-semibold text-[#334155]">
                                                    {holiday.date}
                                                </h3>

                                                <p className="text-[11px] text-[#94a3b8] mt-1">
                                                    {holiday.day}
                                                </p>
                                            </div>

                                            {/* NAME */}

                                            <div className="min-w-0">
                                                <p className="truncate text-[14px] text-[#475569]">
                                                    {holiday.name}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-[160px] flex flex-col items-center justify-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f5f9]">
                                    <CalendarDays size={18} className="text-[#c0cad5]" />
                                </div>
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
