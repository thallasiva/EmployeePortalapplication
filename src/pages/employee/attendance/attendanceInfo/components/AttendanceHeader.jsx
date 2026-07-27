import React from "react";
import { useNavigate } from "react-router-dom";

const AttendanceHeader = React.memo(function AttendanceHeader({
  todayRecord,
  punching,
  handleCheckIn,
  handleCheckOut
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-[22px] font-semibold text-[#1f2937]">Attendance Info</h1>
      <div className="flex items-center gap-4">
        {!todayRecord?.check_in ? (
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={punching}
            className="h-10 px-5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm disabled:opacity-60"
          >
            {punching ? "Please wait..." : "Check In"}
          </button>
        ) : !todayRecord?.check_out ? (
          <button
            type="button"
            onClick={handleCheckOut}
            disabled={punching}
            className="h-10 px-5 rounded bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-sm disabled:opacity-60"
          >
            {punching ? "Please wait..." : "Check Out"}
          </button>
        ) : (
          <span className="h-10 px-4 inline-flex items-center rounded bg-[#f1f5f9] text-[#64748b] text-sm font-medium">
            Checked out at {todayRecord.check_out.slice(0, 5)}
          </span>
        )}
        <button
          type="button"
          onClick={() => navigate("/employee/attendance/regularizations")}
          className="h-10 px-5 rounded bg-brand hover:bg-brand-600 text-white text-sm font-semibold shadow-sm"
        >
          My Regularizations
        </button>
      </div>
    </div>
  );
});

export default AttendanceHeader;
