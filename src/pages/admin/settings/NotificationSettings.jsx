import React, { useState } from "react";
import { Bell, Mail, MessageSquare, Smartphone, Save, RotateCcw, Info } from "lucide-react";

const Toggle = ({ on, onToggle }) => (
  <button onClick={onToggle}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${on ? "bg-[#f18200]" : "bg-[#cbd5e1]"}`}>
    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-1"}`} />
  </button>
);

const CHANNELS = [
  { key:"email",  label:"Email",           icon:<Mail size={16} />,          color:"#f18200", bg:"#fff8f0" },
  { key:"inapp",  label:"In-App",          icon:<Bell size={16} />,          color:"#6366f1", bg:"#f5f3ff" },
  { key:"sms",    label:"SMS",             icon:<Smartphone size={16} />,    color:"#10b981", bg:"#ecfdf5" },
  { key:"push",   label:"Push Notification",icon:<MessageSquare size={16} />,color:"#3b82f6", bg:"#eff6ff" },
];

const NOTIF_EVENTS = [
  { group:"Leave",       events:[
    { label:"Leave Approved",                  email:true,  inapp:true,  sms:false, push:true  },
    { label:"Leave Rejected",                  email:true,  inapp:true,  sms:false, push:true  },
    { label:"Leave Request Submitted",         email:true,  inapp:true,  sms:false, push:false },
  ]},
  { group:"Attendance",  events:[
    { label:"Check-In Reminder",               email:false, inapp:true,  sms:false, push:true  },
    { label:"Regularization Approved",         email:true,  inapp:true,  sms:false, push:false },
    { label:"Attendance Marked",               email:false, inapp:true,  sms:false, push:false },
  ]},
  { group:"Payroll",     events:[
    { label:"Payslip Generated",               email:true,  inapp:true,  sms:false, push:true  },
    { label:"Salary Revision",                 email:true,  inapp:true,  sms:true,  push:true  },
    { label:"Reimbursement Approved",          email:true,  inapp:true,  sms:false, push:false },
  ]},
  { group:"Recruitment", events:[
    { label:"Interview Scheduled",             email:true,  inapp:true,  sms:true,  push:true  },
    { label:"Offer Letter Sent",               email:true,  inapp:true,  sms:false, push:false },
  ]},
  { group:"System",      events:[
    { label:"Password Reset",                  email:true,  inapp:false, sms:false, push:false },
    { label:"Login from New Device",           email:true,  inapp:true,  sms:true,  push:true  },
    { label:"Document Expiry Reminder",        email:true,  inapp:true,  sms:false, push:false },
  ]},
];

export default function NotificationSettings() {
  const [matrix, setMatrix] = useState(() =>
    NOTIF_EVENTS.map(g => ({ ...g, events: g.events.map(e => ({ ...e })) }))
  );
  const [saved, setSaved] = useState(false);

  const toggle = (gi, ei, channel) => {
    setMatrix(prev => {
      const next = prev.map((g, gIdx) => ({
        ...g,
        events: g.events.map((e, eIdx) =>
          gIdx === gi && eIdx === ei ? { ...e, [channel]: !e[channel] } : e
        ),
      }));
      return next;
    });
    setSaved(false);
  };

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

  const handleReset = () => {
    setMatrix(NOTIF_EVENTS.map(g => ({ ...g, events: g.events.map(e => ({ ...e })) })));
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#fff8f0] flex items-center justify-center">
            <Bell size={18} color="#f18200" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-[#1e293b]">Notification Settings</h1>
            <p className="text-[12px] text-[#94a3b8]">Configure which events trigger notifications and through which channels</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Channel legend */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
          <p className="text-[13px] font-bold text-[#1e293b] mb-4">Notification Channels</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CHANNELS.map(ch => (
              <div key={ch.key} className="flex items-center gap-3 p-3 rounded-xl border border-[#e8eef5]" style={{ background: ch.bg }}>
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <span style={{ color: ch.color }}>{ch.icon}</span>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#1e293b]">{ch.label}</p>
                  <p className="text-[10px] text-[#94a3b8]">Enabled</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Matrix */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e8eef5] flex items-center justify-between">
            <p className="text-[14px] font-bold text-[#1e293b]">Event Notification Matrix</p>
            <div className="flex items-center gap-2 text-[11px] text-[#94a3b8]">
              <Info size={12} />
              Toggle to enable/disable notifications per channel
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e8eef5]">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider min-w-[250px]">Event</th>
                  {CHANNELS.map(ch => (
                    <th key={ch.key} className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wider min-w-[100px]" style={{ color: ch.color }}>
                      {ch.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((group, gi) => (
                  <React.Fragment key={group.group}>
                    <tr className="bg-[#fff8f0] border-b border-[#e8eef5]">
                      <td colSpan={5} className="px-5 py-2">
                        <span className="text-[11px] font-bold text-[#f18200] uppercase tracking-wider">{group.group}</span>
                      </td>
                    </tr>
                    {group.events.map((ev, ei) => (
                      <tr key={ev.label} className="border-b border-[#f8fafc] hover:bg-[#fafbff] transition-colors">
                        <td className="px-5 py-3.5 text-[13px] text-[#1e293b]">{ev.label}</td>
                        {CHANNELS.map(ch => (
                          <td key={ch.key} className="px-5 py-3.5 text-center">
                            <div className="flex justify-center">
                              <Toggle on={ev[ch.key]} onToggle={() => toggle(gi, ei, ch.key)} />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-[#e8eef5] flex items-center gap-3">
            <button onClick={handleSave}
              className="flex items-center gap-2 h-[38px] px-5 bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold transition-colors">
              <Save size={14} /> Save Settings
            </button>
            <button onClick={handleReset}
              className="flex items-center gap-2 h-[38px] px-4 border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#374151] rounded-lg text-[13px] font-semibold transition-colors">
              <RotateCcw size={14} /> Reset to Default
            </button>
            {saved && (
              <span className="text-[12px] text-emerald-600 font-semibold flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">✓</span>
                Settings saved successfully
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
