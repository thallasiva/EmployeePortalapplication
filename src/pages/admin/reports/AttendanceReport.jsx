import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  ReportPageHeader,
  ReportIconStatCard,
  ReportAvatar,
  ReportStatusBadge,
} from "../../../component/reports/ReportsLayout";
import ReportLineChart from "../../../component/reports/ReportLineChart";
import {
  applyAttendanceRegularization,
} from "../../../utils/attendanceRegularization";
import {
  buildWeekChart,
  buildWeekStats,
  formatWeekRange,
  generateWeekAttendance,
  shiftWeek,
  startOfWeek,
  summarizeWeek,
} from "../../../utils/reportWeekUtils";

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "Present", label: "Present" },
  { value: "Late", label: "Late" },
  { value: "Absent", label: "Absent" },
  { value: "On Leave", label: "On Leave" },
  { value: "Weekend", label: "Weekend" },
];

export default function AttendanceReport() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [regularizedIds, setRegularizedIds] = useState(() => new Set());
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const baseRows = useMemo(
    () => generateWeekAttendance(weekStart),
    [weekStart]
  );

  const rows = useMemo(
    () =>
      baseRows.map((row) =>
        regularizedIds.has(row.id)
          ? applyAttendanceRegularization({ ...row, status: "Present" })
          : row
      ),
    [baseRows, regularizedIds]
  );

  const summary = useMemo(() => summarizeWeek(rows), [rows]);
  const stats = useMemo(() => buildWeekStats(summary), [summary]);
  const chart = useMemo(() => buildWeekChart(weekStart, rows), [weekStart, rows]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = !statusFilter || row.status === statusFilter;
      const matchesSearch =
        !query ||
        row.name.toLowerCase().includes(query) ||
        row.role.toLowerCase().includes(query) ||
        row.date.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [rows, statusFilter, searchQuery]);

  const handleRegularize = (id) => {
    setRegularizedIds((prev) => new Set(prev).add(id));
  };

  const goPrevWeek = () => setWeekStart((w) => shiftWeek(w, -1));
  const goNextWeek = () => setWeekStart((w) => shiftWeek(w, 1));

  return (
    <div className="report-page">
      <ReportPageHeader title="Attendance Report" />

      <div className="report-top-grid">
        <div className="report-stats-grid">
          {stats.map((stat) => (
            <ReportIconStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon="📅"
              color={stat.color}
              trend={stat.trend}
            />
          ))}
        </div>
        <div className="report-chart-card">
          <div className="report-chart-card__header">
            <h3 className="report-chart-card__title">
              <span className="report-chart-card__title-dot" />
              Attendance
            </h3>
            <span className="report-chart-card__select report-week-label">
              {formatWeekRange(weekStart)}
            </span>
          </div>
          <ReportLineChart
            present={chart.present}
            absent={chart.absent}
            labels={chart.labels}
          />
        </div>
      </div>

      <div className="report-table-section">
        <h2 className="report-table-section__title">Employee Attendance</h2>
        <div className="report-table-toolbar">
          <div className="report-table-toolbar__left">
            <span className="report-table-toolbar__rows">
              Row Per Page <select defaultValue="10"><option>10</option><option>25</option><option>50</option></select> Entries
            </span>
          </div>
          <div className="report-table-toolbar__filters">
            <div className="report-week-nav">
              <button type="button" className="report-week-nav__btn" onClick={goPrevWeek} aria-label="Previous week">
                <ChevronLeft size={16} />
              </button>
              <span className="report-week-nav__range">{formatWeekRange(weekStart)}</span>
              <button type="button" className="report-week-nav__btn" onClick={goNextWeek} aria-label="Next week">
                <ChevronRight size={16} />
              </button>
            </div>
            <select
              className="report-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="search"
              className="report-search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="report-data-table">
            <thead>
              <tr>
                <th>Name ↕</th>
                <th>Day ↕</th>
                <th>Date ↕</th>
                <th>Check in ↕</th>
                <th>Status ↕</th>
                <th>Check Out ↕</th>
                <th>Break ↕</th>
                <th>Late ↕</th>
                <th>Overtime ↕</th>
                <th>Production Hours ↕</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="report-table-empty">
                    No attendance records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="report-person-cell">
                      <ReportAvatar name={row.name} />
                      <div className="report-person-cell__info">
                        <span className="report-person-cell__name">{row.name}</span>
                        <span className="report-person-cell__sub">{row.role}</span>
                      </div>
                    </div>
                  </td>
                  <td>{row.weekday}</td>
                  <td>{row.date}</td>
                  <td>{row.checkIn}</td>
                  <td><ReportStatusBadge status={row.status} /></td>
                  <td>{row.checkOut}</td>
                  <td>{row.break}</td>
                  <td>{row.late}</td>
                  <td>{row.overtime}</td>
                  <td>
                    {row.status === "Weekend" ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <span className={`report-production ${row.productionGood ? "is-good" : "is-low"}`}>
                        🕐 {row.production}
                      </span>
                    )}
                  </td>
                  <td>
                    {row.status !== "Weekend" && row.status !== "Absent" && row.status !== "On Leave" ? (
                      <button
                        type="button"
                        className="report-regularize-btn"
                        onClick={() => handleRegularize(row.id)}
                        disabled={regularizedIds.has(row.id)}
                      >
                        {regularizedIds.has(row.id) ? "Regularized" : "Regularizations"}
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
