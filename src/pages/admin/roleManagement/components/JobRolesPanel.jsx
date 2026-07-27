import React, { useState, useEffect } from "react";
import { Search, Briefcase, ChevronDown, ChevronRight, CheckCircle } from "lucide-react";
import apiClient from "../../../../api/client";
import { successToast, errorToast } from "../../../../utils/ToastControllers";
import { JOB_ROLES } from "../constants";

const JobRolesPanel = React.memo(function JobRolesPanel({ selected, onDesignationSaved, onEmployeesRefresh }) {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState({ Management: true, "Software Development": true });
  const [pickedDesig, setPickedDesig] = useState(null);
  const [savingDesig, setSavingDesig] = useState(false);

  useEffect(() => {
    setPickedDesig(selected?.emp_job_title || selected?.designation_name || null);
    setQ("");
  }, [selected?.employee_id]);

  const toggle = (cat) => setExpanded((p) => ({ ...p, [cat]: !p[cat] }));

  const filtered = q.trim()
    ? JOB_ROLES
        .map((g) => ({ ...g, roles: g.roles.filter((r) => r.toLowerCase().includes(q.toLowerCase())) }))
        .filter((g) => g.roles.length)
    : JOB_ROLES;

  const currentDesig = selected?.emp_job_title || selected?.designation_name || null;
  const changed = pickedDesig && pickedDesig !== currentDesig;

  async function saveDesignation() {
    if (!selected || !pickedDesig || !changed) return;
    setSavingDesig(true);
    try {
      await apiClient.put(`/employees/${selected.employee_id}`, { emp_job_title: pickedDesig });
      successToast(`Designation updated to "${pickedDesig}"`);
      onDesignationSaved?.(selected.employee_id, pickedDesig);
      onEmployeesRefresh?.();
    } catch (err) {
      errorToast(err?.response?.data?.message || "Failed to update designation");
    } finally {
      setSavingDesig(false);
    }
  }

  return (
    <div
      className="border border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col"
      style={{ maxHeight: 640 }}
    >
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Briefcase size={14} color="#f18200" />
            <span className="text-[13px] font-bold text-gray-700">Job Designation</span>
          </div>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
            119 roles
          </span>
        </div>

        {selected ? (
          <div className="text-[11px] text-gray-500 mb-2">
            Current:{" "}
            <span className="font-semibold text-gray-700">{currentDesig || "Not set"}</span>
          </div>
        ) : (
          <div className="text-[11px] text-gray-400 mb-2">
            Select an employee to change designation
          </div>
        )}

        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search roles…"
            className="w-full pl-7 pr-3 py-1.5 text-[12px] border border-gray-200 rounded-lg outline-none bg-white text-gray-700 focus:ring-1 focus:ring-orange-400"
          />
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {filtered.length === 0 && (
          <div className="p-6 text-center text-[12px] text-gray-400">No roles match</div>
        )}
        {filtered.map((group) => {
          const open = q.trim() ? true : !!expanded[group.cat];
          return (
            <div key={group.cat} className="border-b border-gray-50 last:border-0">
              <button
                onClick={() => toggle(group.cat)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
              >
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: group.bg, color: group.color }}
                >
                  {group.roles.length}
                </span>
                <span className="text-[12px] font-semibold text-gray-700 flex-1">{group.cat}</span>
                {q.trim() ? null : open ? (
                  <ChevronDown size={12} className="text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight size={12} className="text-gray-400 shrink-0" />
                )}
              </button>

              {open && (
                <div className="pb-1">
                  {group.roles.map((role) => {
                    const isPicked = pickedDesig === role;
                    const isCurrent = currentDesig === role;
                    const canClick = !!selected;
                    return (
                      <div
                        key={role}
                        onClick={() => canClick && setPickedDesig(role)}
                        className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                          canClick ? "cursor-pointer" : "cursor-default"
                        } ${
                          isPicked
                            ? "bg-orange-50 border-l-[3px] border-orange-400"
                            : "hover:bg-gray-50 border-l-[3px] border-transparent"
                        }`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            background: isPicked ? "#f18200" : group.color,
                            opacity: isPicked ? 1 : 0.5
                          }}
                        />
                        <span
                          className={`text-[12px] flex-1 ${
                            isPicked ? "font-semibold text-orange-700" : "text-gray-700"
                          }`}
                        >
                          {role}
                        </span>
                        {isCurrent && !isPicked && (
                          <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                            current
                          </span>
                        )}
                        {isPicked && <CheckCircle size={12} color="#f18200" className="shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="px-3 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
          {pickedDesig && (
            <div className="text-[11px] text-gray-500 mb-2 truncate">
              → <span className="font-semibold text-gray-800">{pickedDesig}</span>
            </div>
          )}
          <button
            onClick={saveDesignation}
            disabled={savingDesig || !changed}
            className="w-full py-2 text-[12px] font-bold text-white rounded-lg transition-colors"
            style={{
              background: savingDesig || !changed ? "#d1d5db" : "#f18200",
              cursor: savingDesig || !changed ? "not-allowed" : "pointer"
            }}
          >
            {savingDesig ? "Saving…" : !changed ? "No Change" : "Update Designation"}
          </button>
        </div>
      )}
    </div>
  );
});

export default JobRolesPanel;
