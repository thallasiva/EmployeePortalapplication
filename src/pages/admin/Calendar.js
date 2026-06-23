import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Cake, CalendarDays, ChevronLeft, ChevronRight,
  Gift, Plus, Star, Users, X, Umbrella,
} from 'lucide-react';
import { getDashboardStats, getDashboardEvents } from '../../api/dashboard.api';
import { listHolidays } from '../../api/holiday.api';
import { listLeaveRequests } from '../../api/leaveRequest.api';
import { listCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '../../api/calendar.api';
import { errorToast, successToast } from '../../utils/ToastControllers';

// ── Event type config ─────────────────────────────────────────────────────────
// Interview and Timesheet intentionally excluded
const EVENT_TYPES = {
  holiday:     { label: 'Holiday',     color: '#ef4444', bg: '#fef2f2', icon: '🏖️' },
  leave:       { label: 'Leave',       color: '#3b82f6', bg: '#eff6ff', icon: '🏝️' },
  birthday:    { label: 'Birthday',    color: '#22c55e', bg: '#f0fdf4', icon: '🎂' },
  review:      { label: 'Review',      color: '#a855f7', bg: '#faf5ff', icon: '⭐' },
  anniversary: { label: 'Anniversary', color: '#ec4899', bg: '#fdf2f8', icon: '🎉' },
  training:    { label: 'Training',    color: '#f97316', bg: '#fff7ed', icon: '📚' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

// ── Utility helpers ───────────────────────────────────────────────────────────
function toYMD(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function sameMonthDay(dateStr, day, month) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getDate() === day && (d.getMonth() + 1) === month;
}

// Returns true if a date range [from, to] overlaps with a specific calendar day
function leaveCoversDay(from, to, year, month, day) {
  const target = new Date(year, month - 1, day);
  const f = new Date(from);
  const t = new Date(to);
  f.setHours(0, 0, 0, 0);
  t.setHours(23, 59, 59, 999);
  return target >= f && target <= t;
}

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();
  const grid = [];
  let day = 1;
  let nextDay = 1;

  for (let week = 0; week < 6; week++) {
    const row = [];
    for (let dow = 0; dow < 7; dow++) {
      const cell = week * 7 + dow;
      if (cell < firstDay) {
        row.push({ day: prevMonthDays - firstDay + cell + 1, current: false, prev: true });
      } else if (day > daysInMonth) {
        row.push({ day: nextDay++, current: false, next: true });
      } else {
        row.push({ day: day++, current: true });
      }
    }
    grid.push(row);
    if (day > daysInMonth && week >= 3) break;
  }
  return grid;
}

// ── Add Event Modal ───────────────────────────────────────────────────────────
const ADDABLE_TYPES = ['training', 'review', 'anniversary'];

function AddEventModal({ onClose, onSaved, defaultDate }) {
  const [form, setForm] = useState({
    title: '',
    event_date: defaultDate || toYMD(new Date()),
    event_type: 'training',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { errorToast('Title is required'); return; }
    setSaving(true);
    try {
      await createCalendarEvent(form);
      successToast('Event added');
      onSaved();
      onClose();
    } catch (err) {
      errorToast(err?.response?.data?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">Add Event</h3>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <X size={17} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Event title"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                value={form.event_date}
                onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={form.event_type}
                onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {ADDABLE_TYPES.map(t => (
                  <option key={t} value={t}>{EVENT_TYPES[t].label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Optional description"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary py-2 text-sm disabled:opacity-60">
              {saving ? 'Saving…' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Event chip ────────────────────────────────────────────────────────────────
function EventChip({ type, label, onDelete }) {
  const cfg = EVENT_TYPES[type] || EVENT_TYPES.training;
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium leading-tight cursor-default group"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span>{cfg.icon}</span>
      <span className="truncate max-w-[80px]">{label}</span>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 ml-auto shrink-0"
        >
          <X size={9} />
        </button>
      )}
    </div>
  );
}

// ── Main Calendar Component ───────────────────────────────────────────────────
export default function Calendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [viewMode, setViewMode] = useState('month');
  const [typeFilter, setTypeFilter] = useState('all');

  // Data state
  const [stats, setStats] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [customEvents, setCustomEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [clickedDate, setClickedDate] = useState(null);

  const { year, month } = currentDate;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        statsData,
        holidayData,
        leaveData,
        birthdayData,
        eventData,
      ] = await Promise.allSettled([
        getDashboardStats(),
        listHolidays({ year, limit: 200 }),
        listLeaveRequests({ status: 'approved', limit: 500 }),
        getDashboardEvents(month),
        listCalendarEvents({ year, month, limit: 200 }),
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value || {});
      if (holidayData.status === 'fulfilled') setHolidays(holidayData.value?.data || []);
      if (leaveData.status === 'fulfilled') setLeaves(leaveData.value?.data || []);
      if (birthdayData.status === 'fulfilled') setBirthdays(birthdayData.value || []);
      if (eventData.status === 'fulfilled') setCustomEvents(eventData.value?.data || []);
    } catch {
      // individual errors handled by allSettled
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Build event map: { 'YYYY-MM-DD': [...events] } ──────────────────────────
  const eventMap = useMemo(() => {
    const map = {};

    const addEvent = (dateStr, event) => {
      if (!dateStr) return;
      const key = toYMD(dateStr);
      if (!map[key]) map[key] = [];
      map[key].push(event);
    };

    // Holidays
    holidays.forEach(h => {
      addEvent(h.holiday_date, { type: 'holiday', label: h.holiday_name, id: `h-${h.holiday_id}` });
    });

    // Approved Leaves - expand each leave across its date range for this month
    const daysInMonth = new Date(year, month, 0).getDate();
    leaves.forEach(lr => {
      const empName = lr.employee_name || `${lr.first_name || ''} ${lr.last_name || ''}`.trim() || 'Employee';
      for (let d = 1; d <= daysInMonth; d++) {
        if (leaveCoversDay(lr.from_date, lr.to_date, year, month, d)) {
          const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (!map[key]) map[key] = [];
          // Avoid duplicate leave entries for same employee on same day
          if (!map[key].some(e => e.id === `l-${lr.leave_request_id}-${d}`)) {
            map[key].push({ type: 'leave', label: `${empName} Leave`, id: `l-${lr.leave_request_id}-${d}`, raw: lr });
          }
        }
      }
    });

    // Birthdays & Anniversaries
    birthdays.forEach(emp => {
      const name = emp.employee_name || 'Employee';
      if (emp.dob && sameMonthDay(emp.dob, undefined, month)) {
        // Get the day from dob
        const d = new Date(emp.dob);
        const key = `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map[key]) map[key] = [];
        map[key].push({ type: 'birthday', label: `${name} Birthday`, id: `b-${emp.employee_id}` });
      }
      if (emp.emp_joining_date && sameMonthDay(emp.emp_joining_date, undefined, month)) {
        const d = new Date(emp.emp_joining_date);
        const key = `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map[key]) map[key] = [];
        map[key].push({ type: 'anniversary', label: `${name} Anniversary`, id: `a-${emp.employee_id}` });
      }
    });

    // Custom calendar events
    customEvents.forEach(ce => {
      addEvent(ce.event_date, {
        type: ce.event_type?.toLowerCase() || 'training',
        label: ce.title,
        id: `ce-${ce.event_id}`,
        event_id: ce.event_id,
        deletable: true,
      });
    });

    return map;
  }, [holidays, leaves, birthdays, customEvents, year, month]);

  // ── Filtered event map ────────────────────────────────────────────────────────
  const filteredMap = useMemo(() => {
    if (typeFilter === 'all') return eventMap;
    const filtered = {};
    Object.entries(eventMap).forEach(([date, events]) => {
      const evts = events.filter(e => e.type === typeFilter);
      if (evts.length) filtered[date] = evts;
    });
    return filtered;
  }, [eventMap, typeFilter]);

  // ── Stats for top cards ───────────────────────────────────────────────────────
  const totalEmployees = stats.employees_count ?? stats.total_employees ?? '—';

  const onLeaveTodayCount = useMemo(() => {
    const todayStr = toYMD(today);
    return (filteredMap[todayStr] || []).filter(e => e.type === 'leave').length ||
      leaves.filter(lr => leaveCoversDay(lr.from_date, lr.to_date,
        today.getFullYear(), today.getMonth() + 1, today.getDate())).length;
  }, [leaves, filteredMap]);

  const birthdaysThisMonth = useMemo(() =>
    Object.values(eventMap).flat().filter(e => e.type === 'birthday').length,
  [eventMap]);

  const holidaysThisMonth = useMemo(() =>
    holidays.filter(h => {
      const d = new Date(h.holiday_date);
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    }).length,
  [holidays, year, month]);

  // ── Upcoming events (next 30 days from today) ─────────────────────────────────
  const upcomingEvents = useMemo(() => {
    const results = [];
    const now = new Date();
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 30);

    Object.entries(eventMap).forEach(([dateStr, events]) => {
      const d = new Date(dateStr);
      if (d >= now && d <= limit) {
        events.forEach(evt => results.push({ ...evt, date: dateStr, dateObj: d }));
      }
    });

    return results.sort((a, b) => a.dateObj - b.dateObj).slice(0, 6);
  }, [eventMap]);

  // ── Navigation ────────────────────────────────────────────────────────────────
  const prevMonth = () => setCurrentDate(({ year, month }) => {
    if (month === 1) return { year: year - 1, month: 12 };
    return { year, month: month - 1 };
  });
  const nextMonth = () => setCurrentDate(({ year, month }) => {
    if (month === 12) return { year: year + 1, month: 1 };
    return { year, month: month + 1 };
  });

  const handleDeleteEvent = async (event_id) => {
    try {
      await deleteCalendarEvent(event_id);
      successToast('Event removed');
      fetchData();
    } catch {
      errorToast('Failed to delete event');
    }
  };

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  // ── Mini calendar for sidebar ────────────────────────────────────────────────
  const miniGrid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayDay = today.getDate();
  const isCurrentMonthView = today.getFullYear() === year && today.getMonth() + 1 === month;

  // Days that have events (for mini calendar dots)
  const daysWithEvents = useMemo(() => {
    const days = new Set();
    Object.keys(filteredMap).forEach(key => {
      const d = new Date(key);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        days.add(d.getDate());
      }
    });
    return days;
  }, [filteredMap, year, month]);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: <Users size={22} className="text-indigo-500" />, bg: 'bg-indigo-50', label: 'Total Employees', value: totalEmployees, link: 'View all', color: 'text-indigo-600' },
          { icon: <Umbrella size={22} className="text-green-500" />, bg: 'bg-green-50', label: 'On Leave Today', value: onLeaveTodayCount, link: 'View leaves', color: 'text-green-600' },
          { icon: <Cake size={22} className="text-orange-500" />, bg: 'bg-orange-50', label: 'Birthdays', value: birthdaysThisMonth, link: 'View birthdays', color: 'text-orange-600' },
          { icon: <CalendarDays size={22} className="text-red-500" />, bg: 'bg-red-50', label: 'Holidays', value: holidaysThisMonth, link: 'View holidays', color: 'text-red-600' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="text-2xl font-bold text-slate-800 leading-tight">{loading ? '…' : card.value}</p>
              <p className={`text-xs ${card.color} cursor-pointer hover:underline mt-0.5`}>{card.link}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-5 items-start">
        {/* ── Main Calendar Panel ── */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-100">
            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="all">All Events</option>
              {Object.entries(EVENT_TYPES).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            {/* Month navigation */}
            <div className="flex items-center gap-2 ml-auto">
              <button type="button" onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold text-slate-800 min-w-[110px] text-center">
                {MONTHS[month - 1]} {year}
              </span>
              <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* View toggle */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden text-sm">
              {['month', 'week', 'list'].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setViewMode(v)}
                  className={`px-4 py-1.5 capitalize font-medium ${viewMode === v ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Month grid */}
          {viewMode === 'month' && (
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-slate-100">
                {DAYS.map(d => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {d}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {grid.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 border-b border-slate-100 last:border-b-0">
                  {week.map((cell, di) => {
                    const key = cell.current
                      ? `${year}-${String(month).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`
                      : null;
                    const dayEvents = key ? (filteredMap[key] || []) : [];
                    const isToday = isCurrentMonthView && cell.current && cell.day === todayDay;

                    return (
                      <div
                        key={di}
                        className={`min-h-[90px] p-1.5 border-r border-slate-100 last:border-r-0 ${!cell.current ? 'bg-slate-50/50' : ''} hover:bg-slate-50 cursor-pointer transition-colors`}
                        onClick={() => { if (cell.current) { setClickedDate(key); setShowAddModal(true); } }}
                      >
                        <div className={`w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full mb-1 ${
                          isToday ? 'bg-brand text-white' : cell.current ? 'text-slate-700' : 'text-slate-300'
                        }`}>
                          {cell.day}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((evt, ei) => (
                            <EventChip
                              key={evt.id || ei}
                              type={evt.type}
                              label={evt.label}
                              onDelete={evt.deletable ? () => handleDeleteEvent(evt.event_id) : null}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <p className="text-[10px] text-slate-400 pl-1">+{dayEvents.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && (
            <div className="p-4">
              {loading ? (
                <p className="text-sm text-slate-400 text-center py-8">Loading events…</p>
              ) : Object.keys(filteredMap).filter(k => {
                const d = new Date(k);
                return d.getFullYear() === year && d.getMonth() + 1 === month;
              }).length === 0 ? (
                <div className="flex flex-col items-center py-12 text-slate-400 gap-2">
                  <CalendarDays size={36} className="opacity-30" />
                  <p className="text-sm">No events this month.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(filteredMap)
                    .filter(([k]) => { const d = new Date(k); return d.getFullYear() === year && d.getMonth() + 1 === month; })
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dateStr, events]) => (
                      <div key={dateStr} className="flex gap-4 items-start py-3 border-b border-slate-100 last:border-b-0">
                        <div className="w-16 shrink-0 text-center">
                          <p className="text-xs text-slate-400">{DAYS[new Date(dateStr).getDay()]}</p>
                          <p className="text-lg font-bold text-slate-800">{new Date(dateStr).getDate()}</p>
                        </div>
                        <div className="flex-1 flex flex-wrap gap-1.5">
                          {events.map((evt, i) => (
                            <EventChip
                              key={evt.id || i}
                              type={evt.type}
                              label={evt.label}
                              onDelete={evt.deletable ? () => handleDeleteEvent(evt.event_id) : null}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Week view */}
          {viewMode === 'week' && (
            <div className="p-4 text-center text-sm text-slate-400 py-10">
              <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
              Switch to Month or List view to see all events.
            </div>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <div className="w-64 shrink-0 space-y-4">
          {/* Add Event button */}
          <button
            type="button"
            onClick={() => { setClickedDate(toYMD(today)); setShowAddModal(true); }}
            className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl shadow"
          >
            <Plus size={16} /> Add Event
          </button>

          {/* Mini Calendar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">
                <ChevronLeft size={14} />
              </button>
              <p className="text-sm font-semibold text-slate-700">
                {MONTHS[month - 1]} {year}
              </p>
              <button type="button" onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-semibold text-slate-400 py-0.5">{d}</div>
              ))}
            </div>
            {miniGrid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((cell, di) => {
                  const isToday = isCurrentMonthView && cell.current && cell.day === todayDay;
                  const hasEvt = cell.current && daysWithEvents.has(cell.day);
                  return (
                    <div
                      key={di}
                      className={`relative flex flex-col items-center justify-center h-7 text-[11px] rounded cursor-pointer transition-colors ${
                        isToday ? 'bg-brand text-white font-bold' :
                        cell.current ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300'
                      }`}
                      onClick={() => {
                        if (cell.current) {
                          const key = `${year}-${String(month).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`;
                          setClickedDate(key);
                          setShowAddModal(true);
                        }
                      }}
                    >
                      {cell.day}
                      {hasEvt && !isToday && (
                        <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-brand" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">Upcoming Events</p>
            </div>
            {loading ? (
              <p className="text-xs text-slate-400">Loading…</p>
            ) : upcomingEvents.length === 0 ? (
              <p className="text-xs text-slate-400">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((evt, i) => {
                  const cfg = EVENT_TYPES[evt.type] || EVENT_TYPES.training;
                  const d = evt.dateObj;
                  const isUpcoming = d > today;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                        style={{ background: cfg.bg }}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-slate-800 truncate">{evt.label}</p>
                        <p className="text-[11px] text-slate-400">
                          {d.getDate()} {MONTHS[d.getMonth()]} {d.getFullYear()}
                        </p>
                      </div>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {evt.type === 'leave' ? 'Approved' :
                         evt.type === 'holiday' ? 'Holiday' :
                         isUpcoming ? 'Upcoming' : 'Today'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Calendar Legend</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
              {Object.entries(EVENT_TYPES).map(([key, cfg]) => (
                <div
                  key={key}
                  className="flex items-center gap-1.5 cursor-pointer"
                  onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                  <span className={`text-[11px] ${typeFilter === key ? 'font-semibold' : 'text-slate-500'}`}>
                    {cfg.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <AddEventModal
          defaultDate={clickedDate}
          onClose={() => { setShowAddModal(false); setClickedDate(null); }}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
