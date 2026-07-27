import React, { useEffect } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { WORK_DAYS, INPUT_CLS } from "../constants";
import EmployeeScheduleTab from "./EmployeeScheduleTab";

const SCHEDULE_TABS = [
  { id: "company",  label: "Company Default" },
  { id: "employee", label: "Per Employee" },
];

const WorkSchedule = React.memo(function WorkSchedule({
  selectedCompany, schedule, setSchedule, toggleDay,
  scheduleTab, setScheduleTab,
  empScheduleProps,
  loadEmpSchedules,
}) {
  useEffect(() => {
    if (scheduleTab === "employee") loadEmpSchedules();
  }, [scheduleTab, loadEmpSchedules]);

  return (
    <section className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Work Schedule</h2>
          <p className="mt-1 text-sm text-gray-500">Configure work hours and days</p>
        </div>
        <div className={cssClass({ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 3, gap: 3 })}>
          {SCHEDULE_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setScheduleTab(t.id)}
              className={cssClass({
                padding: "5px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: scheduleTab === t.id ? "#fff" : "transparent",
                color: scheduleTab === t.id ? "#f18200" : "#64748b",
                boxShadow: scheduleTab === t.id ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
              })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {scheduleTab === "company" && (
        <>
          <p className="mt-4 text-sm text-gray-500">
            Default work hours for <strong>{selectedCompany.name}</strong>
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Default start time</span>
              <input type="time" value={schedule.startTime} onChange={(e) => setSchedule('startTime', e.target.value)} className={INPUT_CLS} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Default end time</span>
              <input type="time" value={schedule.endTime} onChange={(e) => setSchedule('endTime', e.target.value)} className={INPUT_CLS} />
            </label>
          </div>
          <div className="mt-5">
            <span className="text-sm font-medium text-slate-700">Work days</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {WORK_DAYS.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                    schedule.workDays[day.id]
                      ? 'border-brand bg-brand text-white'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {scheduleTab === "employee" && (
        <EmployeeScheduleTab {...empScheduleProps} />
      )}
    </section>
  );
});

export default WorkSchedule;
