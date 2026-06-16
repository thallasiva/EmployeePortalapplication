import React from 'react';
import { getShiftDashboardData } from '../../../data/shiftData';

const ShiftDashboard = ({ shiftId,greeting }) =>
{
  const shift = getShiftDashboardData(shiftId);
  // const isCheckedIn = shift.attendance.status === "Checked In";

  return (
    <div className={`rounded-lg shadow border p-2 md:p-5 mb-4 ${shift.theme.bg} ${shift.theme.border}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            {greeting}
          </h2>
        </div>
        <div className="bg-white rounded-lg shadow-sm px-4 py-2 text-center min-w-[180px]">
          <p className="text-xs text-gray-500">Attendance Time</p>
          <p className="text-sm font-semibold text-gray-800">
            In: {shift.attendance.checkIn || '--'} · Out: {shift.attendance.checkOut || '--'}
          </p>
        </div>

        {/* RIGHT: Shift + Buttons */}
        <div className="flex items-center gap-3">
          <span className={`text-white text-xs font-semibold px-3 py-1 rounded-full ${shift.theme.pill}`}>
            {shift.name}
          </span>
          <button
            className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded"
          >
            Check In
          </button>
          <button
            className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded"
          >
            Check Out
          </button>

        </div>

      </div>
      {/* <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          {/* <span
            className={`inline-block text-white text-xs font-semibold px-2.5 py-1 rounded-full ${shift.theme.pill}`}
          >
            {shift.name}
          </span> */}
          {/* <h2 className={`text-lg font-bold mt-2 ${shift.theme.text}`}>
            Shift Timing: {shift.timing}
          </h2>
          <p className="text-xs text-gray-500 mt-1">Break window: {shift.breakWindow}</p> 
        </div>

        <div className="bg-white rounded-lg shadow-sm px-4 py-2 flex items-center gap-3">
          <CheckCircle2
            className={isCheckedIn ? 'text-emerald-500' : 'text-gray-400'}
            size={22}
          />
          <div>
            <p className="text-sm font-semibold text-gray-800">{shift.attendance.status}</p>
            <p className="text-xs text-gray-500">
              In: {shift.attendance.checkIn} · Out: {shift.attendance.checkOut}
            </p>
          </div>
        </div>
      </div> */}

      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Bell size={16} className={shift.theme.text} />
            Shift Notices
          </h3>
          <ul className="space-y-2">
            {shift.notices.map((notice) => (
              <li key={notice} className="text-xs text-gray-600 flex gap-2">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${shift.theme.pill}`} />
                {notice}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg p-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <TrendingUp size={16} className={shift.theme.text} />
            Shift Metrics
          </h3>
          <ul className="space-y-2">
            {shift.metrics.map((metric) => (
              <li key={metric.label} className="flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1.5">
                  {metric.label.toLowerCase().includes('hour') ||
                  metric.label.toLowerCase().includes('overlap') ? (
                    <Clock size={13} className="text-gray-400" />
                  ) : (
                    <Coffee size={13} className="text-gray-400" />
                  )}
                  {metric.label}
                </span>
                <span className="font-semibold text-gray-800">{metric.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div> */}
    </div>
  );
};

export default ShiftDashboard;
