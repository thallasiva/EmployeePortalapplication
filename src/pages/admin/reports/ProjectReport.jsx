import React from "react";
import { ReportPageHeader } from "../../../component/reports/ReportsLayout";

export default function ProjectReport() {
  return (
    <div className="report-page">
      <ReportPageHeader title="Project Report" />
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="text-6xl mb-4">📂</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Project Report Coming Soon</h2>
        <p className="text-sm text-gray-400 max-w-sm mb-8">
          Track project timelines, team assignments, milestones, and delivery status across all active projects.
        </p>
        <div className="bg-white border border-gray-100 rounded-xl p-6 max-w-sm w-full shadow-sm text-left">
          <p className="text-[12px] font-semibold text-gray-500 uppercase mb-3">Planned Features</p>
          <ul className="space-y-2">
            {[
              "Project timeline & milestones",
              "Team assignments & workload",
              "Priority & status tracking",
              "Budget vs. actual tracking",
              "Delivery reports",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-[13px] text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f18200] shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[12px] text-gray-300 mt-6">Contact your administrator to enable the Projects module.</p>
      </div>
    </div>
  );
}
