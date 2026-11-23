import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { emailSchedulesApi, emailTemplatesApi } from "../../../../../../api/settings.api";
import { Btn, Toggle, Toast, ConfirmDialog } from "../../components/SharedUI";
import { FREQ_EMOJI } from "./FREQ_EMOJI";
import { ScheduleModal } from "./ScheduleModal";
function ScheduledEmails() {
  const [schedules, setSchedules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({
    open: false,
    item: null
  });
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({
      message,
      type
    });
    setTimeout(() => setToast(null), 3000);
  };
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [schRes, tmplRes] = await Promise.all([emailSchedulesApi.list(), emailTemplatesApi.list({
        limit: 200
      })]);
      setSchedules(Array.isArray(schRes) ? schRes : []);
      setTemplates(tmplRes.rows || []);
    } catch {
      showToast("Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const handleSave = async form => {
    if (modal.item?.id) {
      await emailSchedulesApi.update(modal.item.id, form);
      showToast("Schedule updated");
    } else {
      await emailSchedulesApi.create(form);
      showToast("Schedule created");
    }
    load();
  };
  const handleToggle = async id => {
    try {
      await emailSchedulesApi.toggle(id);
      load();
    } catch {
      showToast("Toggle failed", "error");
    }
  };
  const handleDelete = async id => {
    try {
      await emailSchedulesApi.delete(id);
      showToast("Deleted");
      load();
    } catch {
      showToast("Delete failed", "error");
    }
  };
  const active = schedules.filter(s => s.status === "Active").length;
  const paused = schedules.filter(s => s.status === "Paused").length;
  return <div className="space-y-5">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      {confirm && <ConfirmDialog message="Delete this schedule?" onConfirm={() => {
      handleDelete(confirm);
      setConfirm(null);
    }} onCancel={() => setConfirm(null)} />}
      <ScheduleModal open={modal.open} onClose={() => setModal({
      open: false,
      item: null
    })} onSave={handleSave} initial={modal.item} templates={templates} />
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[{
        label: "Total",
        value: schedules.length,
        color: "#e87500",
        bg: "#fff8f0"
      }, {
        label: "Active",
        value: active,
        color: "#16a34a",
        bg: "#dcfce7"
      }, {
        label: "Paused",
        value: paused,
        color: "#ca8a04",
        bg: "#fef9c3"
      }].map(({
        label,
        value,
        color,
        bg
      }) => <div key={label} className="bg-white rounded-xl border border-[#f1f5f9] p-4 text-center">
            <div className="text-[24px] font-bold" style={{
          color
        }}>{value}</div>
            <div className="text-[11px] text-[#94a3b8] mt-0.5">{label}</div>
          </div>)}
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#64748b]">Automate recurring email campaigns and reminders</p>
        <Btn icon={<Plus size={14} />} onClick={() => setModal({
        open: true,
        item: null
      })}>New Schedule</Btn>
      </div>
      {/* Schedule cards */}
      {loading ? <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-[#e87500]" />
        </div> : schedules.length === 0 ? <div className="bg-white rounded-xl border border-[#f1f5f9] py-16 text-center text-[#94a3b8] text-[13px]">
          No schedules yet. Create your first one.
        </div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map(s => <div key={s.id} className="bg-white rounded-xl border border-[#f1f5f9] p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#e87500] flex">{FREQ_EMOJI[s.freq] || <Mail size={20} />}</span>
                  <div>
                    <div className="text-[14px] font-bold text-[#e87500]">{s.name}</div>
                    <div className="text-[11px] text-[#94a3b8]">{s.freq} · {s.send_time}</div>
                  </div>
                </div>
                <Toggle on={s.status === "Active"} onToggle={() => handleToggle(s.id)} />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[["Template", s.template_name || "—"], ["Recipient", s.recipient || "—"]].map(([l, v]) => <div key={l}>
                    <div className="text-[10px] text-[#94a3b8] uppercase tracking-wide mb-0.5">{l}</div>
                    <div className="text-[12px] font-medium text-[#475569] truncate">{v}</div>
                  </div>)}
              </div>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.status === "Active" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                  {s.status === "Active" ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                  {s.status}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setModal({
              open: true,
              item: s
            })} className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b]"><Edit2 size={13} /></button>
                  <button onClick={() => setConfirm(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>)}
        </div>}
    </div>;
}
export { ScheduledEmails };
