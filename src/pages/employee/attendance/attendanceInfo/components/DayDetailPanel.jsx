import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Calendar } from "lucide-react";
import { CELL_STYLES } from "../../../../../lib/attendanceUtils";
import { SHIFT_CODE, SHIFT_NAME, SHIFT_TIME, SCHEME } from "../constants";
import DetailTable from "./DetailTable";

const PROCESSED_HEADERS = [
  "First In", "Last Out", "Late In", "Early Out",
  "Total Work Hrs", "Break Hrs", "Actual Work Hrs"
];

const SIX_HOURS_MINUTES = 360; // 6 * 60

const DayDetailPanel = React.memo(function DayDetailPanel({ selected, user }) {
  const navigate = useNavigate();

  const isWorkday = !selected.isWeekend && !selected.isHoliday && !selected.pending;
  const workedMinutes = selected?.status?.workMinutes ?? 0;
  const canRegularize = isWorkday && workedMinutes > 0 && workedMinutes < SIX_HOURS_MINUTES;

  const handleRegularize = () => {
    navigate("/employee/attendance/regularizations", {
      state: { prefillDate: selected.iso },
    });
  };

  return (
    <div className="xl:col-span-5 bg-white border border-[#dce3eb] rounded-xl shadow-sm flex flex-col min-h-[420px]">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#e8edf2]">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#1f2937]">{selected.day}</span>
          <span className="text-lg text-[#64748b]">{selected.weekday}</span>
        </div>
        <p className="text-sm text-[#475569] mt-2">
          {SHIFT_NAME}({SHIFT_CODE}) · {SHIFT_TIME}
        </p>
        <p className="text-xs text-[#94a3b8] mt-1">{SCHEME}</p>
        {!selected.pending && (
          <span
            className={`inline-flex mt-3 px-3 py-1 rounded text-xs font-bold border ${
              CELL_STYLES[selected.status.code] || CELL_STYLES.O
            } border-transparent`}
          >
            {selected.status.code} — {selected.status.label}
          </span>
        )}

        {/* Regularization alert for <6h days */}
        {canRegularize && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <AlertCircle size={15} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-800">Less than 6 hours worked</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Only {selected.processed.totalWorkHrs} recorded. You can apply for regularization.
              </p>
            </div>
            <button
              onClick={handleRegularize}
              className="shrink-0 text-xs font-bold text-[#f18200] hover:text-[#e07000] underline underline-offset-2 transition-colors"
            >
              Regularize
            </button>
          </div>
        )}

        {/* Already full-day present */}
        {isWorkday && workedMinutes >= SIX_HOURS_MINUTES && (
          <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            <p className="text-xs text-emerald-700 font-medium">
              {selected.processed.totalWorkHrs} worked — no regularization needed
            </p>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
        <section>
          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">
            Processed on
          </h3>
          <DetailTable
            headers={PROCESSED_HEADERS}
            values={[
              selected.processed.firstIn,
              selected.processed.lastOut,
              selected.processed.lateIn,
              selected.processed.earlyOut,
              selected.processed.totalWorkHrs,
              selected.processed.breakHrs,
              selected.processed.actualWorkHrs
            ]}
          />
        </section>

        <section>
          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">
            Status details
          </h3>
          <table className="w-full border border-[#e8edf2] text-sm">
            <thead>
              <tr className="bg-[#f8fafc] text-[#64748b]">
                <th className="px-3 py-2 text-left font-semibold border-b">Status</th>
                <th className="px-3 py-2 text-left font-semibold border-b">Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 font-semibold text-[#1f2937] border-b">
                  {selected.status.code}
                </td>
                <td className="px-3 py-2 text-[#475569] border-b">
                  {selected.statusRemarks}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">
            Session details
          </h3>
          {selected.sessions.length === 0 ? (
            <p className="text-[#94a3b8] py-4 text-center border border-dashed border-[#dce3eb] rounded">
              No session data for this day
            </p>
          ) : (
            <table className="w-full border border-[#e8edf2] text-sm">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b]">
                  <th className="px-3 py-2 text-left font-semibold border-b">Session</th>
                  <th className="px-3 py-2 text-left font-semibold border-b">Session Timing</th>
                  <th className="px-3 py-2 text-left font-semibold border-b">First In</th>
                  <th className="px-3 py-2 text-left font-semibold border-b">Last Out</th>
                </tr>
              </thead>
              <tbody>
                {selected.sessions.map((s) => (
                  <tr key={s.session} className="border-b border-[#e8edf2]">
                    <td className="px-3 py-2 font-medium">{s.session}</td>
                    <td className="px-3 py-2">{s.timing}</td>
                    <td className="px-3 py-2">{s.firstIn}</td>
                    <td className="px-3 py-2">{s.lastOut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <p className="px-4 py-2 text-[11px] text-[#94a3b8] border-t border-[#e8edf2]">
        {user?.name || "Employee"} · Rule: ≥9h = P · ≥6h = P:A · &lt;6h = eligible for regularization
      </p>
    </div>
  );
});

export default DayDetailPanel;
