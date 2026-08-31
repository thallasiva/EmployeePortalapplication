import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogIn, LogOut, ClipboardList } from "lucide-react";

const AttendanceHeader = React.memo(function AttendanceHeader({ todayRecord }) {
  const navigate = useNavigate();
  const fmt = (t) => (t ? t.slice(0, 5) : "—");
  const checkIn  = todayRecord?.check_in;
  const checkOut = todayRecord?.check_out;
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Monthly Attendance</h1>
        <p className="text-sm text-slate-400 mt-0.5">{today}</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Today punch pill */}
        <div className="flex items-center gap-0 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2.5 border-r border-slate-200">
            <LogIn size={14} className="text-emerald-500" />
            <span className="text-xs text-slate-500">In</span>
            <span className="text-sm font-bold text-slate-800">{fmt(checkIn)}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5">
            <LogOut size={14} className="text-[#f18200]" />
            <span className="text-xs text-slate-500">Out</span>
            <span className="text-sm font-bold text-slate-800">{fmt(checkOut)}</span>
          </div>
        </div>

        <button
          onClick={() => navigate("/employee/attendance/regularizations")}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#f18200] hover:bg-[#d97706] text-white text-sm font-bold shadow-sm transition-all hover:shadow-md active:scale-95"
        >
          <ClipboardList size={15} />
          My Regularizations
        </button>
      </div>
    </div>
  );
});

export default AttendanceHeader;
