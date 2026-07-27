import { memo, useState, useEffect } from "react";
import { getMyTimesheets, getTimesheetDetail } from "../../../../api/timesheet.api";

const STATUS_COLOR = {
  draft: "bg-gray-100 text-gray-600",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

const TimesheetHistory = memo(function TimesheetHistory({ statusFilter }) {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [detailMap, setDetailMap] = useState({});

  useEffect(() => {
    setExpandedId(null);
    getMyTimesheets()
      .then((rows) => {
        const filtered = statusFilter ? rows.filter((t) => t.status === statusFilter) : rows;
        filtered.sort((a, b) => (b.week_start > a.week_start ? 1 : -1));
        setTimesheets(filtered);
      })
      .catch(() => setTimesheets([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const toggleRow = async (ts) => {
    const id = ts.timesheet_id;
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!detailMap[id]) {
      setDetailMap((m) => ({ ...m, [id]: { loading: true, entries: [] } }));
      try {
        const detail = await getTimesheetDetail(id);
        setDetailMap((m) => ({ ...m, [id]: { loading: false, entries: detail?.entries || [] } }));
      } catch {
        setDetailMap((m) => ({ ...m, [id]: { loading: false, entries: [] } }));
      }
    }
  };

  if (loading) return <div className="ts-loading">Loading…</div>;
  if (!timesheets.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
      <span className="text-4xl">📋</span>
      <p className="text-sm">No {statusFilter || ""} timesheets found.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {timesheets.map((t) => {
        const isOpen = expandedId === t.timesheet_id;
        const detail = detailMap[t.timesheet_id];
        return (
          <div key={t.timesheet_id}
            className={`rounded-xl border shadow-sm transition-all ${isOpen ? "border-brand" : "border-gray-200 hover:border-gray-300"}`}>
            <div onClick={() => toggleRow(t)}
              className="px-5 py-4 flex items-center justify-between cursor-pointer select-none">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {t.week_start ? new Date(t.week_start).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}
                  {" – "}
                  {t.week_end ? new Date(t.week_end).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                </p>
                {t.comments && t.status === "rejected" && (
                  <p className="text-xs text-red-500 mt-0.5 truncate max-w-xs">Reason: {t.comments}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{t.total_hours ?? 0}h</span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[t.status] || "bg-gray-100 text-gray-500"}`}>
                  {t.status}
                </span>
                <span className={`text-gray-400 text-sm transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>▶</span>
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-gray-100 px-5 pb-4 pt-3 bg-gray-50 rounded-b-xl">
                {detail?.loading ? (
                  <p className="text-xs text-gray-400 py-2">Loading entries…</p>
                ) : !detail?.entries?.length ? (
                  <p className="text-xs text-gray-400 py-2">No entries recorded for this week.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400 uppercase tracking-wide">
                          <th className="text-left pb-2 pr-4 font-semibold">Date</th>
                          <th className="text-left pb-2 pr-4 font-semibold">Project</th>
                          <th className="text-left pb-2 pr-4 font-semibold">Task</th>
                          <th className="text-left pb-2 pr-4 font-semibold">Activity</th>
                          <th className="text-right pb-2 font-semibold">Hours</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detail.entries.map((e, i) => (
                          <tr key={i} className="text-gray-700">
                            <td className="py-1.5 pr-4 whitespace-nowrap text-gray-500">
                              {e.work_date ? new Date(e.work_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}
                            </td>
                            <td className="py-1.5 pr-4">{e.project_name || "—"}</td>
                            <td className="py-1.5 pr-4 font-medium text-gray-800">{e.task_name || "—"}</td>
                            <td className="py-1.5 pr-4 text-gray-500 max-w-[200px] truncate">{e.activity_desc || ""}</td>
                            <td className="py-1.5 text-right font-semibold text-brand">{e.duration_hours ?? 0}h</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-gray-200 text-gray-600 font-semibold">
                          <td colSpan={4} className="pt-2 text-gray-400 text-xs uppercase tracking-wide">Total</td>
                          <td className="pt-2 text-right text-brand">{t.total_hours ?? 0}h</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
                {t.comments && (
                  <p className={`text-xs mt-3 pt-2 border-t border-gray-200 ${t.status === "rejected" ? "text-red-500" : "text-gray-500"}`}>
                    <span className="font-semibold">Manager note:</span> {t.comments}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

export default TimesheetHistory;
