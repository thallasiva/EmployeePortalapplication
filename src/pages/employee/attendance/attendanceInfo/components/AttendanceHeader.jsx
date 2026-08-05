import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";

const AttendanceHeader = React.memo(function AttendanceHeader({ todayRecord }) {
  const navigate = useNavigate();

  const fmt = (t) => (t ? t.slice(0, 5) : "—");
  const checkIn = todayRecord?.check_in;
  const checkOut = todayRecord?.check_out;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-semibold text-[#1f2937]">Monthly Attendance</h1>
        <p className="text-sm text-[#64748b] mt-0.5">Your attendance record for this month</p>
      </div>
      <div className="flex items-center gap-3">
        {/* Today's punch times — info only */}
        <div className="flex items-center gap-3 bg-white border border-[#e2e8f0] rounded-xl px-4 py-2 shadow-sm">
          <Clock size={15} className="text-[#f18200]" />
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[#64748b]">In: <strong className="text-[#1f2937]">{fmt(checkIn)}</strong></span>
            <span className="w-px h-4 bg-[#e2e8f0]" />
            <span className="text-[#64748b]">Out: <strong className="text-[#1f2937]">{fmt(checkOut)}</strong></span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/employee/attendance/regularizations")}
          className="h-10 px-5 rounded-xl bg-[#f18200] hover:bg-[#e07000] text-white text-sm font-semibold shadow-sm transition-colors"
        >
          My Regularizations
        </button>
      </div>
    </div>
  );
});

export default AttendanceHeader;
