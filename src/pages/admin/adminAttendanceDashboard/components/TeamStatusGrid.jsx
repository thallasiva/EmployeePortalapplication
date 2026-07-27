import React from "react";

const TeamStatusGrid = React.memo(function TeamStatusGrid({ summary, onScrollToLate }) {
  return (
    <div className="admin-dash-card lg:col-span-2">
      <p className="text-sm font-medium text-gray-600 mb-3">Team Status Today</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center p-2 rounded-lg bg-emerald-50">
          <p className="text-xl font-bold text-emerald-700">{summary.presentToday}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Present</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-pink-50">
          <p className="text-xl font-bold text-pink-600">{summary.absentToday}</p>
          <p className="text-xs text-pink-500 mt-0.5">Absent</p>
        </div>
        <button
          type="button"
          onClick={onScrollToLate}
          className="text-center p-2 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors w-full"
        >
          <p className="text-xl font-bold text-orange-600">{summary.lateToday}</p>
          <p className="text-xs text-orange-500 mt-0.5">Late — view list</p>
        </button>
        <div className="text-center p-2 rounded-lg bg-blue-50">
          <p className="text-xl font-bold text-blue-600">{summary.onLeaveToday}</p>
          <p className="text-xs text-blue-500 mt-0.5">On Leave</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        {summary.checkedInToday} of {summary.totalEmployees} employees checked in
      </p>
    </div>
  );
});

export default TeamStatusGrid;
