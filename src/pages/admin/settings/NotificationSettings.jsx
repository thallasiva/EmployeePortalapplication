import React, { useState, useEffect, useCallback } from "react";
import { Bell, Mail, MessageSquare, Smartphone, Save, RotateCcw, Loader2 } from "lucide-react";
import client from "../../../api/client";

const Toggle = ({ on, onToggle }) => (
  <button onClick={onToggle}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${on ? "bg-[#f18200]" : "bg-[#cbd5e1]"}`}>
    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-1"}`} />
  </button>
);

const CHANNELS = [
  { key:"email",  label:"Email",            icon:<Mail size={16}/>,           color:"#f18200" },
  { key:"inapp",  label:"In-App",           icon:<Bell size={16}/>,           color:"#6366f1" },
  { key:"sms",    label:"SMS",              icon:<Smartphone size={16}/>,     color:"#10b981" },
  { key:"push",   label:"Push",             icon:<MessageSquare size={16}/>,  color:"#3b82f6" },
];

const NOTIF_EVENTS = [
  { group:"Leave", events:[
    { label:"Leave Approved",          email:true,  inapp:true,  sms:false, push:true  },
    { label:"Leave Rejected",          email:true,  inapp:true,  sms:false, push:true  },
    { label:"Leave Request Submitted", email:true,  inapp:true,  sms:false, push:false },
  ]},
  { group:"Attendance", events:[
    { label:"Check-In Reminder",       email:false, inapp:true,  sms:false, push:true  },
    { label:"Regularization Approved", email:true,  inapp:true,  sms:false, push:false },
    { label:"Attendance Marked",       email:false, inapp:true,  sms:false, push:false },
  ]},
  { group:"Payroll", events:[
    { label:"Payslip Generated",       email:true,  inapp:true,  sms:false, push:true  },
    { label:"Salary Revision",         email:true,  inapp:true,  sms:true,  push:true  },
    { label:"Reimbursement Approved",  email:true,  inapp:true,  sms:false, push:false },
  ]},
  { group:"Recruitment", events:[
    { label:"Interview Scheduled",     email:true,  inapp:true,  sms:true,  push:true  },
    { label:"Offer Letter Sent",       email:true,  inapp:true,  sms:false, push:false },
  ]},
  { group:"System", events:[
    { label:"Password Reset",          email:true,  inapp:false, sms:false, push:false },
    { label:"Login from New Device",   email:true,  inapp:true,  sms:true,  push:true  },
    { label:"Document Expiry Reminder",email:true,  inapp:true,  sms:false, push:false },
  ]},
];

const buildDefault = () => NOTIF_EVENTS.map(g => ({ ...g, events: g.events.map(e => ({ ...e })) }));

export default function NotificationSettings() {
  const [matrix, setMatrix] = useState(buildDefault);
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);
  const [toast, setToast]      = useState(null);

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  /* Load saved settings */
  useEffect(() => {
    client.get("/settings/notification-preferences")
      .then(r => { if (r.data?.data) setMatrix(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (gi, ei, channel) => {
    setMatrix(prev =>
      prev.map((g, gIdx) => ({
        ...g,
        events: g.events.map((e, eIdx) =>
          gIdx===gi && eIdx===ei ? { ...e, [channel]: !e[channel] } : e
        ),
      }))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await client.put("/settings/notification-preferences", matrix);
      showToast("Notification settings saved!");
    } catch {
      showToast("Save failed", "error");
    } finally { setSaving(false); }
  };

  const handleReset = () => { setMatrix(buildDefault()); showToast("Reset to defaults", "info"); };

  if (loading) return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-[#f18200]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-[13px] font-semibold text-white ${toast.type==="error"?"bg-red-500":toast.type==="info"?"bg-blue-500":"bg-green-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#fff8f0] flex items-center justify-center">
              <Bell size={18} color="#f18200" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-[#1e293b]">Notification Settings</h1>
              <p className="text-[12px] text-[#94a3b8]">Configure which events trigger notifications on each channel</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleReset} className="flex items-center gap-2 px-4 h-[36px] border border-[#e2e8f0] rounded-lg text-[13px] font-medium text-[#475569] hover:bg-[#f1f5f9]">
              <RotateCcw size={13} /> Reset
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 h-[36px] bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-semibold disabled:opacity-60">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Channel legend */}
        <div className="flex flex-wrap gap-4 mb-5 bg-white rounded-xl border border-[#f1f5f9] p-4">
          {CHANNELS.map(ch => (
            <div key={ch.key} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${ch.color}18`, color: ch.color }}>
                {ch.icon}
              </div>
              <span className="text-[12px] font-semibold text-[#475569]">{ch.label}</span>
            </div>
          ))}
        </div>

        {/* Matrix */}
        <div className="space-y-4">
          {matrix.map((group, gi) => (
            <div key={group.group} className="bg-white rounded-xl border border-[#f1f5f9] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#f8fafc] bg-[#fafafa]">
                <span className="text-[13px] font-bold text-[#1e293b]">{group.group}</span>
              </div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#f8fafc]">
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">Event</th>
                    {CHANNELS.map(ch => (
                      <th key={ch.key} className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide" style={{ color: ch.color }}>{ch.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8fafc]">
                  {group.events.map((ev, ei) => (
                    <tr key={ev.label} className="hover:bg-[#fafafa]">
                      <td className="px-5 py-3 text-[#475569]">{ev.label}</td>
                      {CHANNELS.map(ch => (
                        <td key={ch.key} className="px-3 py-3 text-center">
                          <Toggle on={ev[ch.key]} onToggle={() => toggle(gi, ei, ch.key)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
