import React from 'react';
import { getShiftDashboardData } from '../../../data/shiftData';

const ShiftDashboard = ({ shiftId, greeting }) =>
{
  const shift = getShiftDashboardData(shiftId);


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

        {}
        <div className="flex items-center gap-3">
          <span className={`text-white text-xs font-semibold px-3 py-1 rounded-full ${shift.theme.pill}`}>
            {shift.name}
          </span>
          <button
            className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded">

            Check In
          </button>
          <button
            className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded">

            Check Out
          </button>

        </div>

      </div>
      {





      }
          {

















      }

      {





































      }
    </div>);

};

export default ShiftDashboard;
