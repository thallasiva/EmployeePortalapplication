import React from "react";
import { Crown, Mail } from "lucide-react";
import { BRAND } from "../constants";
import Avatar from "./Avatar";
import SectionLabel from "./SectionLabel";

const ReportingManager = React.memo(function ReportingManager({ manager }) {
  return (
    <div className="bg-white rounded-[14px] border border-slate-200 p-5 flex-1">
      <SectionLabel>Reporting Manager</SectionLabel>
      {manager ? (
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <Avatar name={manager.name} color={manager.color} size={56} />
            <div
              className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white"
              style={{ backgroundColor: BRAND }}
            >
              <Crown size={9} color="#fff" />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold text-slate-800">{manager.name}</div>
            <div className="text-[12px] text-slate-500 mt-0.5">{manager.jobTitle}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{manager.departmentName}</div>
            {manager.email !== "—" && (
              <a
                href={`mailto:${manager.email}`}
                className="inline-flex items-center gap-1 mt-2 text-[12px] font-semibold no-underline"
                style={{ color: BRAND }}
              >
                <Mail size={12} />
                {manager.email}
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-slate-400">
          <Crown size={32} strokeWidth={1} className="mb-2 text-slate-200" />
          <span className="text-[13px]">No manager assigned</span>
        </div>
      )}
    </div>
  );
});

export default ReportingManager;
