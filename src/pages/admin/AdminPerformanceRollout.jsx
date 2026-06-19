import React, { useState } from "react";
import { CheckCircle2, XCircle, Megaphone, CalendarDays, Users, Lock } from "lucide-react";

const STORAGE_KEY = "hrms_appraisal_active";

function getStored() {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function setStored(val) {
  localStorage.setItem(STORAGE_KEY, val ? "true" : "false");
}

export default function AdminPerformanceRollout() {
  const [active, setActive] = useState(getStored);
  const [saved, setSaved] = useState(false);

  const toggle = (val) => {
    setActive(val);
    setStored(val);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      {/* Header */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-brand-600 p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <Megaphone size={28} />
          <div>
            <h1 className="text-[22px] font-semibold">Performance Appraisal Rollout</h1>
            <p className="mt-0.5 text-sm text-white/80">
              Enable or disable the appraisal cycle for all reporting managers
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-4">
        {/* Status card */}
        <div className="lg:col-span-1 rounded-xl border border-[#dce3eb] bg-white p-5 shadow-sm flex flex-col items-center justify-center gap-3 text-center">
          {active ? (
            <CheckCircle2 size={48} className="text-emerald-500" />
          ) : (
            <Lock size={48} className="text-gray-300" />
          )}
          <div>
            <p className="text-sm text-gray-500 mb-1">Current Status</p>
            <span
              className={`text-base font-bold px-3 py-1 rounded-full ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {active ? "Active — Appraisal Live" : "Inactive — Not Rolled Out"}
            </span>
          </div>

          {saved && (
            <p className="text-xs text-emerald-600 font-medium animate-pulse">
              ✓ Setting saved
            </p>
          )}

          <div className="flex gap-2 mt-2 w-full">
            <button
              type="button"
              onClick={() => toggle(true)}
              disabled={active}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                active
                  ? "bg-emerald-500 text-white border-emerald-500 opacity-80 cursor-default"
                  : "bg-white text-emerald-600 border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              Enable Rollout
            </button>
            <button
              type="button"
              onClick={() => toggle(false)}
              disabled={!active}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                !active
                  ? "bg-gray-200 text-gray-400 border-gray-200 opacity-80 cursor-default"
                  : "bg-white text-red-500 border-red-200 hover:bg-red-50"
              }`}
            >
              Disable Rollout
            </button>
          </div>
        </div>

        {/* Details card */}
        <div className="lg:col-span-2 rounded-xl border border-[#dce3eb] bg-white p-5 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#334155] mb-4">
            Appraisal Cycle Details
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm mb-5">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">Appraisal Period</p>
              <p className="font-semibold text-gray-800">FY 2025 – 2026</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">Rollout Date</p>
              <p className="font-semibold text-gray-800">
                {active ? new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">Submission Deadline</p>
              <p className="font-semibold text-gray-800">30 Jun 2026</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">Affected Managers</p>
              <p className="font-semibold text-gray-800">All Reporting Managers</p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-2">What enabling rollout does</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
              Unlocks the <strong>Team Attendance</strong> tab in the Reporting Manager dashboard, allowing managers to review team attendance as part of the appraisal.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
              Managers can view per-employee attendance summary (present/absent/late/hours) for the appraisal period.
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
              Performance Appraisal forms become active for managers to complete star ratings and submit reviews.
            </li>
            <li className="flex items-start gap-2">
              <XCircle size={15} className="text-gray-300 mt-0.5 shrink-0" />
              Disabling rollout hides the attendance tab and freezes new appraisal submissions.
            </li>
          </ul>
        </div>
      </div>

      {/* Workflow steps */}
      <div className="rounded-xl border border-[#dce3eb] bg-white p-5 shadow-sm">
        <h2 className="text-[15px] font-semibold text-[#334155] mb-4">Appraisal Workflow</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { icon: Megaphone, step: "1", title: "Admin Rollout", desc: "Admin enables the appraisal cycle from this page", done: true },
            { icon: Users, step: "2", title: "Manager Review", desc: "Reporting Manager reviews team attendance & completes appraisal form", done: active },
            { icon: CalendarDays, step: "3", title: "Employee Self-Appraisal", desc: "Employee fills self-assessment and submits to manager", done: false },
            { icon: CheckCircle2, step: "4", title: "HR Closure", desc: "HR reviews and closes the appraisal cycle", done: false },
          ].map(({ icon: Icon, step, title, desc, done }) => (
            <div
              key={step}
              className={`flex flex-col items-center text-center gap-2 p-4 rounded-xl border ${
                done ? "border-emerald-200 bg-emerald-50" : "border-gray-100 bg-gray-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                done ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {step}
              </div>
              <Icon size={20} className={done ? "text-emerald-500" : "text-gray-300"} />
              <p className="text-sm font-semibold text-gray-800">{title}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
