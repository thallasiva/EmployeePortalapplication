import React, { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { useCalendarData } from './hooks/useCalendarData';
import { toYMD } from './utils/calendarUtils';
import StatsBar from './components/StatsBar';
import CalendarHeader from './components/CalendarHeader';
import MonthView from './components/MonthView';
import ListView from './components/ListView';
import WeekView from './components/WeekView';
import MiniCalendar from './components/MiniCalendar';
import UpcomingEvents from './components/UpcomingEvents';
import CalendarLegend from './components/CalendarLegend';
import AddEventModal from './components/AddEventModal';

export default function Calendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });
  const [viewMode, setViewMode] = useState('month');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [clickedDate, setClickedDate] = useState(null);

  const { year, month } = currentDate;

  const {
    loading,
    filteredMap,
    totalEmployees,
    onLeaveTodayCount,
    birthdaysThisMonth,
    holidaysThisMonth,
    upcomingEvents,
    fetchData,
    handleDeleteEvent,
  } = useCalendarData(year, month, typeFilter);

  const prevMonth = useCallback(() =>
    setCurrentDate(({ year, month }) =>
      month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
    ), []);

  const nextMonth = useCallback(() =>
    setCurrentDate(({ year, month }) =>
      month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
    ), []);

  const handleDayClick = useCallback((dateKey) => {
    setClickedDate(dateKey);
    setShowAddModal(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <StatsBar
        loading={loading}
        totalEmployees={totalEmployees}
        onLeaveTodayCount={onLeaveTodayCount}
        birthdaysThisMonth={birthdaysThisMonth}
        holidaysThisMonth={holidaysThisMonth}
      />

      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CalendarHeader
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            year={year}
            month={month}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />
          {viewMode === 'month' && (
            <MonthView
              year={year}
              month={month}
              today={today}
              filteredMap={filteredMap}
              onDayClick={handleDayClick}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
          {viewMode === 'list' && (
            <ListView
              year={year}
              month={month}
              loading={loading}
              filteredMap={filteredMap}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
          {viewMode === 'week' && <WeekView />}
        </div>

        <div className="w-64 shrink-0 space-y-4">
          <button
            type="button"
            onClick={() => { setClickedDate(toYMD(today)); setShowAddModal(true); }}
            className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl shadow"
          >
            <Plus size={16} /> Add Event
          </button>
          <MiniCalendar
            year={year}
            month={month}
            today={today}
            filteredMap={filteredMap}
            onDayClick={handleDayClick}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />
          <UpcomingEvents loading={loading} upcomingEvents={upcomingEvents} today={today} />
          <CalendarLegend typeFilter={typeFilter} onTypeFilterChange={setTypeFilter} />
        </div>
      </div>

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
