import React, { useState } from "react";
import { Mail, Settings, Shield, FileText, Calendar, Activity } from "lucide-react";
import SmtpSettings      from "./tabs/SmtpSettings";
import EmailTemplates    from "./tabs/EmailTemplates";
import EmailPermissions  from "./tabs/EmailPermissions";
import EmailLogs         from "./tabs/EmailLogs";
import ScheduledEmails   from "./tabs/ScheduledEmails";

const TABS = [
  { id: "smtp",        label: "SMTP Settings",      icon: <Settings size={15}/>,  desc: "Server & auth config" },
  { id: "templates",   label: "Email Templates",    icon: <FileText size={15}/>,  desc: "Create & manage templates" },
  { id: "permissions", label: "Permissions",        icon: <Shield size={15}/>,    desc: "Role-based access" },
  { id: "logs",        label: "Email Logs",         icon: <Activity size={15}/>,  desc: "Track sent emails" },
  { id: "scheduled",  label: "Scheduled Emails",   icon: <Calendar size={15}/>,  desc: "Recurring sends" },
];

export default function EmailConfigIndex() {
  const [active, setActive] = useState("smtp");

  const current = TABS.find(t => t.id === active);

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Page header */}
      <div className="px-6 py-5 flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#fff8f0] border border-[#fed7aa] flex items-center justify-center shrink-0">
          <Mail size={20} color="#f18200"/>
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-[#1e293b]">Email Configuration</h1>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">
            Configure SMTP, manage templates, set permissions and track email activity
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="px-6 pb-5">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map((tab, i) => {
            const isActive = tab.id === active;
            return (
              <button key={tab.id} onClick={() => setActive(tab.id)}
                className={`flex items-center gap-2.5 px-4 h-[44px] rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? "bg-[#f18200] text-white border-[#f18200] shadow-md shadow-[#f18200]/20"
                    : "bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#f18200]/40 hover:text-[#f18200]"
                }`}>
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                  isActive?"bg-white/20":"bg-[#f8fafc]"}`}>
                  {i + 1}
                </span>
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area */}
      <div className="px-6 pb-10">
        {/* Section sub-header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#fff8f0] flex items-center justify-center" style={{color:"#f18200"}}>
            {current.icon}
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-[#1e293b]">{current.label}</h2>
            <p className="text-[12px] text-[#94a3b8]">{current.desc}</p>
          </div>
        </div>

        {/* Render active tab */}
        {active === "smtp"        && <SmtpSettings/>}
        {active === "templates"   && <EmailTemplates/>}
        {active === "permissions" && <EmailPermissions/>}
        {active === "logs"        && <EmailLogs/>}
        {active === "scheduled"   && <ScheduledEmails/>}
      </div>
    </div>
  );
}
