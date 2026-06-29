import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Users, Check, X, RotateCcw, Save, Search } from 'lucide-react';
import { listWorkSchedules, saveEmployeeSchedule, resetEmployeeSchedule } from '../../api/workSchedule.api';
import { listEmployees } from '../../api/employee.api';
import { successToast, errorToast } from '../../utils/ToastControllers';
import { EmployeeStatusBadge } from '../../utils/employeeStatus';

// Company list — kept in sync with Company.js
const COMPANIES = [
  {
    id: 'natit',
    name: 'NAT IT Services Pvt. Ltd.',
    profile: { name: 'NAT IT Services Pvt. Ltd.', industry: 'Technology', size: '51-200', timezone: 'Asia/Kolkata', address: 'Plot no. 21, Sruthi Sadan, Gachibowli, Hyderabad, Telangana' },
    schedule: { startTime: '09:00', endTime: '18:00', workDays: { mon:true,tue:true,wed:true,thu:true,fri:true,sat:false,sun:false } },
  },
  {
    id: 'natsoft-corp',
    name: 'Natsoft Corporation',
    profile: { name: 'Natsoft Corporation', industry: 'Technology', size: '201-500', timezone: 'America/New_York', address: '100 Technology Drive, Austin, TX 78701, United States' },
    schedule: { startTime: '08:00', endTime: '17:00', workDays: { mon:true,tue:true,wed:true,thu:true,fri:true,sat:false,sun:false } },
  },
  {
    id: 'kognitic',
    name: 'Kognitic',
    profile: { name: 'Kognitic', industry: 'Healthcare', size: '11-50', timezone: 'America/Los_Angeles', address: 'United States' },
    schedule: { startTime: '09:00', endTime: '17:00', workDays: { mon:true,tue:true,wed:true,thu:true,fri:true,sat:false,sun:false } },
  },
  {
    id: 'updraftworks',
    name: 'UpdraftWorks',
    profile: { name: 'UpdraftWorks', industry: 'Technology', size: '11-50', timezone: 'America/Los_Angeles', address: 'United States' },
    schedule: { startTime: '09:00', endTime: '18:00', workDays: { mon:true,tue:true,wed:true,thu:true,fri:true,sat:false,sun:false } },
  },
];

const workDays = [
  { label: 'Mon', id: 'mon' }, { label: 'Tue', id: 'tue' }, { label: 'Wed', id: 'wed' },
  { label: 'Thu', id: 'thu' }, { label: 'Fri', id: 'fri' }, { label: 'Sat', id: 'sat' }, { label: 'Sun', id: 'sun' },
];

const defaultNotifications = {
  leaveRequests:      { email: true,  push: true,  inApp: true  },
  performanceReviews: { email: true,  push: false, inApp: true  },
  onboarding:         { email: false, push: false, inApp: true  },
};

export default function Settings() {
  const [selectedCompanyId, setSelectedCompanyId] = useState(COMPANIES[0].id);
  const [companyOpen, setCompanyOpen] = useState(false);

  const selectedCompany = COMPANIES.find(c => c.id === selectedCompanyId) || COMPANIES[0];

  const [profileByCompany, setProfileByCompany] = useState(() =>
    Object.fromEntries(COMPANIES.map(c => [c.id, { ...c.profile }]))
  );
  const [scheduleByCompany, setScheduleByCompany] = useState(() =>
    Object.fromEntries(COMPANIES.map(c => [c.id, { ...c.schedule, workDays: { ...c.schedule.workDays } }]))
  );
  const [notifications, setNotifications] = useState(defaultNotifications);

  const profile  = profileByCompany[selectedCompanyId];
  const schedule = scheduleByCompany[selectedCompanyId];

  const setProfile  = (field, val) => setProfileByCompany(prev => ({ ...prev, [selectedCompanyId]: { ...prev[selectedCompanyId], [field]: val } }));
  const setSchedule = (field, val) => setScheduleByCompany(prev => ({ ...prev, [selectedCompanyId]: { ...prev[selectedCompanyId], [field]: val } }));
  const toggleDay   = (id) => setScheduleByCompany(prev => ({
    ...prev,
    [selectedCompanyId]: { ...prev[selectedCompanyId], workDays: { ...prev[selectedCompanyId].workDays, [id]: !prev[selectedCompanyId].workDays[id] } }
  }));
  const toggleNotif = (section, channel) => setNotifications(prev => ({
    ...prev, [section]: { ...prev[section], [channel]: !prev[section][channel] }
  }));

  const inputCls = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  // ── Employee Work Schedules ──────────────────────────────────────────────
  const [scheduleTab, setScheduleTab] = useState("company"); // "company" | "employee"
  const [empSchedules, setEmpSchedules] = useState([]);
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedSearch, setSchedSearch] = useState("");
  const [empDropOpen,  setEmpDropOpen]  = useState(false);
  const DAYS = [
    { id:"mon", label:"Mon" }, { id:"tue", label:"Tue" }, { id:"wed", label:"Wed" },
    { id:"thu", label:"Thu" }, { id:"fri", label:"Fri" }, { id:"sat", label:"Sat" }, { id:"sun", label:"Sun" },
  ];

  // Per-employee tab state
  const [checkedEmps,  setCheckedEmps]  = useState(new Set());
  const [bulkForm,     setBulkForm]     = useState({
    schedule_type: "fixed",
    work_days: ["mon","tue","wed","thu","fri"],
    start_time: "09:00",
    end_time:   "18:00",
    rotation_pattern: "",
  });
  const [bulkSaving,   setBulkSaving]   = useState(false);

  const loadEmpSchedules = useCallback(async () => {
    setSchedLoading(true);
    try {
      const data = await listWorkSchedules();
      if (Array.isArray(data) && data.length > 0) {
        setEmpSchedules(data);
      } else {
        // Fallback: schedule table may not exist yet — load plain employee list
        const res = await listEmployees({ limit: 500 });
        const toRow = e => ({
          employee_id:    e.employee_id,
          employee_name:  `${e.first_name || ''} ${e.last_name || ''}`.trim(),
          emp_code:        e.emp_code,
          emp_job_title:   e.emp_job_title || e.designation,
          employee_status: e.employee_status,
          department_name: e.department_name,
          schedule_id:     null, schedule_type: null, work_days: null,
          start_time:      null, end_time: null,
        });
        setEmpSchedules((res?.data || []).map(toRow));
      }
    } catch {
      // Last-resort fallback: load employees directly
      try {
        const res = await listEmployees({ limit: 500 });
        const toRow = e => ({
          employee_id:    e.employee_id,
          employee_name:  `${e.first_name || ''} ${e.last_name || ''}`.trim(),
          emp_code:        e.emp_code,
          emp_job_title:   e.emp_job_title || e.designation,
          employee_status: e.employee_status,
          department_name: e.department_name,
          schedule_id:     null, schedule_type: null, work_days: null,
          start_time:      null, end_time: null,
        });
        setEmpSchedules((res?.data || []).map(toRow));
      } catch { /* nothing to do */ }
    } finally { setSchedLoading(false); }
  }, []);

  useEffect(() => {
    if (scheduleTab === "employee") loadEmpSchedules();
  }, [scheduleTab, loadEmpSchedules]);

  const toggleBulkDay = (dayId) => {
    setBulkForm(f => {
      const days = new Set(f.work_days || []);
      if (days.has(dayId)) days.delete(dayId); else days.add(dayId);
      return { ...f, work_days: [...days] };
    });
  };

  const toggleCheck = (empId) => {
    setCheckedEmps(s => {
      const n = new Set(s);
      if (n.has(empId)) n.delete(empId); else n.add(empId);
      return n;
    });
  };

  const toggleAll = () => {
    if (checkedEmps.size === filteredEmpScheds.length) {
      setCheckedEmps(new Set());
    } else {
      setCheckedEmps(new Set(filteredEmpScheds.map(e => e.employee_id)));
    }
  };

  const applyBulk = async () => {
    if (!checkedEmps.size) return;
    setBulkSaving(true);
    let saved = 0, failed = 0;
    for (const empId of checkedEmps) {
      try { await saveEmployeeSchedule(empId, bulkForm); saved++; }
      catch { failed++; }
    }
    if (failed === 0) successToast(`Schedule applied to ${saved} employee${saved > 1 ? "s" : ""}`);
    else errorToast(`${saved} saved, ${failed} failed`);
    setCheckedEmps(new Set());
    await loadEmpSchedules();
    setBulkSaving(false);
  };

  const resetSched = async (empId) => {
    try {
      await resetEmployeeSchedule(empId);
      successToast("Schedule reset to company default");
      await loadEmpSchedules();
    } catch { errorToast("Failed to reset schedule"); }
  };

  const filteredEmpScheds = empSchedules.filter(e => {
    const q = schedSearch.trim().toLowerCase();
    if (!q) return true;
    return (e.employee_name || "").toLowerCase().includes(q) ||
           (e.department_name || "").toLowerCase().includes(q) ||
           (e.emp_job_title || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Home / Settings</p>
            <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          </div>

          {/* Company dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button type="button" onClick={() => setCompanyOpen(o => !o)}
                className="flex items-center gap-2 border border-gray-300 bg-white rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-gray-50 shadow-sm min-w-[220px] justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-brand text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {selectedCompany.name[0]}
                  </span>
                  {selectedCompany.name}
                </span>
                <ChevronDown size={14} className={`transition-transform ${companyOpen ? 'rotate-180' : ''}`} />
              </button>
              {companyOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[240px] py-1">
                  {COMPANIES.map(co => (
                    <button key={co.id} type="button"
                      onClick={() => { setSelectedCompanyId(co.id); setCompanyOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 ${co.id === selectedCompanyId ? 'text-brand font-medium bg-brand-50' : 'text-slate-700'}`}>
                      <span className="w-5 h-5 rounded bg-brand text-white flex items-center justify-center text-[10px] font-bold shrink-0">{co.name[0]}</span>
                      {co.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* Company Profile */}
          <section className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900">Company Profile</h2>
            <p className="mt-1 text-sm text-gray-500">Settings for <strong>{selectedCompany.name}</strong></p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Company name</span>
                <input value={profile.name} onChange={e => setProfile('name', e.target.value)} className={inputCls} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Industry</span>
                <select value={profile.industry} onChange={e => setProfile('industry', e.target.value)} className={inputCls}>
                  <option>Technology</option><option>Financial Services</option>
                  <option>Healthcare</option><option>Education</option><option>Life Sciences</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Company size</span>
                <select value={profile.size} onChange={e => setProfile('size', e.target.value)} className={inputCls}>
                  <option>1-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>500+</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Timezone</span>
                <select value={profile.timezone} onChange={e => setProfile('timezone', e.target.value)} className={inputCls}>
                  <option>America/Los_Angeles</option><option>America/New_York</option>
                  <option>Europe/London</option><option>Asia/Kolkata</option>
                </select>
              </label>
              <label className="md:col-span-2 space-y-2">
                <span className="text-sm font-medium text-slate-700">Address</span>
                <input value={profile.address} onChange={e => setProfile('address', e.target.value)} className={inputCls} />
              </label>
            </div>
          </section>

          {/* Work Schedule */}
          <section className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Work Schedule</h2>
                <p className="mt-1 text-sm text-gray-500">Configure work hours and days</p>
              </div>
              {/* Tab switcher */}
              <div style={{ display:"flex", background:"#f1f5f9", borderRadius:10, padding:3, gap:3 }}>
                {[
                  { id:"company", label:"Company Default" },
                  { id:"employee", label:"Per Employee" },
                ].map(t => (
                  <button key={t.id} type="button" onClick={() => setScheduleTab(t.id)}
                    style={{
                      padding:"5px 14px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
                      background: scheduleTab === t.id ? "#fff" : "transparent",
                      color: scheduleTab === t.id ? "#f18200" : "#64748b",
                      boxShadow: scheduleTab === t.id ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                    }}>{t.label}</button>
                ))}
              </div>
            </div>

            {scheduleTab === "company" && (
              <>
                <p className="mt-4 text-sm text-gray-500">Default work hours for <strong>{selectedCompany.name}</strong></p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Default start time</span>
                    <input type="time" value={schedule.startTime} onChange={e => setSchedule('startTime', e.target.value)} className={inputCls} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Default end time</span>
                    <input type="time" value={schedule.endTime} onChange={e => setSchedule('endTime', e.target.value)} className={inputCls} />
                  </label>
                </div>
                <div className="mt-5">
                  <span className="text-sm font-medium text-slate-700">Work days</span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {workDays.map(day => (
                      <button key={day.id} type="button" onClick={() => toggleDay(day.id)}
                        className={`inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                          schedule.workDays[day.id] ? 'border-brand bg-brand text-white' : 'border-gray-300 bg-white text-gray-700'
                        }`}>
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {scheduleTab === "employee" && (
              <div style={{ marginTop:20, display:"flex", flexDirection:"column", gap:16 }}>

                {/* ── Row 1: Employee dropdown + Schedule type dropdown ── */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  {/* Employee multi-select dropdown */}
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Select Employees</p>
                    <div style={{ position:"relative" }}>
                      {/* Trigger button */}
                      <button type="button" onClick={() => setEmpDropOpen(o => !o)}
                        style={{
                          width:"100%", height:40, display:"flex", alignItems:"center", justifyContent:"space-between",
                          padding:"0 12px", border:"1px solid #e2e8f0", borderRadius:9, background:"#fff",
                          fontSize:13, color: checkedEmps.size > 0 ? "#1e293b" : "#94a3b8", cursor:"pointer",
                        }}>
                        <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <Users size={13} style={{ color:"#94a3b8" }} />
                          {schedLoading ? "Loading…" :
                           checkedEmps.size === 0 ? "Choose employees…" :
                           checkedEmps.size === empSchedules.length ? "All employees selected" :
                           `${checkedEmps.size} employee${checkedEmps.size > 1 ? "s" : ""} selected`}
                        </span>
                        <ChevronDown size={13} style={{ color:"#94a3b8", transform: empDropOpen ? "rotate(180deg)" : "none", transition:"0.2s" }} />
                      </button>

                      {/* Dropdown panel */}
                      {empDropOpen && (
                        <div style={{
                          position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:200,
                          background:"#fff", border:"1px solid #e2e8f0", borderRadius:10,
                          boxShadow:"0 8px 24px rgba(0,0,0,0.10)", overflow:"hidden",
                        }}>
                          {/* Search */}
                          <div style={{ padding:"8px 10px", borderBottom:"1px solid #f1f5f9" }}>
                            <div style={{ position:"relative" }}>
                              <Search size={12} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", pointerEvents:"none" }} />
                              <input type="text" value={schedSearch} onChange={e => setSchedSearch(e.target.value)}
                                placeholder="Search…"
                                style={{ width:"100%", height:30, paddingLeft:24, border:"1px solid #e2e8f0", borderRadius:7, fontSize:12, outline:"none", boxSizing:"border-box" }} />
                            </div>
                          </div>
                          {/* Select all */}
                          <div onClick={toggleAll}
                            style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
                              cursor:"pointer", background:"#f8fafc", borderBottom:"1px solid #f1f5f9" }}>
                            <div style={{
                              width:14, height:14, borderRadius:3, flexShrink:0,
                              border:`1.5px solid ${checkedEmps.size > 0 && checkedEmps.size === filteredEmpScheds.length ? "#f18200" : "#d1d5db"}`,
                              background: checkedEmps.size > 0 && checkedEmps.size === filteredEmpScheds.length ? "#f18200" : "#fff",
                              display:"flex", alignItems:"center", justifyContent:"center",
                            }}>
                              {checkedEmps.size > 0 && checkedEmps.size === filteredEmpScheds.length && <Check size={9} color="#fff" />}
                            </div>
                            <span style={{ fontSize:12, fontWeight:600, color:"#64748b" }}>
                              {checkedEmps.size === filteredEmpScheds.length && filteredEmpScheds.length > 0 ? "Deselect all" : `Select all (${filteredEmpScheds.length})`}
                            </span>
                          </div>
                          {/* Employee rows */}
                          <div style={{ maxHeight:220, overflowY:"auto" }}>
                            {filteredEmpScheds.length === 0 ? (
                              <p style={{ fontSize:12, color:"#94a3b8", padding:"16px 12px", textAlign:"center" }}>
                                {schedLoading ? "Loading employees…" : "No employees found"}
                              </p>
                            ) : filteredEmpScheds.map(emp => {
                              const checked = checkedEmps.has(emp.employee_id);
                              return (
                                <div key={emp.employee_id}
                                  onClick={() => toggleCheck(emp.employee_id)}
                                  style={{
                                    display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
                                    cursor:"pointer", background: checked ? "#fff7ed" : "#fff",
                                    borderBottom:"1px solid #f8fafc",
                                  }}>
                                  <div style={{
                                    width:14, height:14, borderRadius:3, flexShrink:0,
                                    border:`1.5px solid ${checked ? "#f18200" : "#d1d5db"}`,
                                    background: checked ? "#f18200" : "#fff",
                                    display:"flex", alignItems:"center", justifyContent:"center",
                                  }}>
                                    {checked && <Check size={9} color="#fff" />}
                                  </div>
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:13, fontWeight:600, color:"#1e293b", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                      {emp.employee_name}
                                    </div>
                                    <div style={{ fontSize:11, color:"#94a3b8" }}>
                                      {emp.department_name || "—"}{emp.work_days ? ` · ${emp.work_days.join(", ")}` : ""}
                                    </div>
                                  </div>
                                  {emp.schedule_id && (
                                    <span style={{ fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:999, background:"#fff7ed", color:"#c2410c", border:"1px solid #fed7aa", flexShrink:0 }}>Custom</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {/* Footer */}
                          <div style={{ padding:"8px 12px", borderTop:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:11, color:"#94a3b8" }}>{checkedEmps.size} selected</span>
                            <button onClick={() => setEmpDropOpen(false)}
                              style={{ fontSize:12, fontWeight:600, color:"#f18200", background:"none", border:"none", cursor:"pointer" }}>Done</button>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Selected chips */}
                    {checkedEmps.size > 0 && (
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
                        {[...checkedEmps].slice(0,5).map(id => {
                          const emp = empSchedules.find(e => e.employee_id === id);
                          return emp ? (
                            <span key={id} style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600,
                              padding:"3px 8px", borderRadius:999, background:"#fff7ed", color:"#c2410c", border:"1px solid #fed7aa" }}>
                              {emp.employee_name.split(" ")[0]}
                              <span onClick={() => toggleCheck(id)} style={{ cursor:"pointer", lineHeight:1 }}>
                                <X size={10} />
                              </span>
                            </span>
                          ) : null;
                        })}
                        {checkedEmps.size > 5 && (
                          <span style={{ fontSize:11, color:"#94a3b8", padding:"3px 8px" }}>+{checkedEmps.size - 5} more</span>
                        )}
                        <button onClick={() => setCheckedEmps(new Set())}
                          style={{ fontSize:11, color:"#94a3b8", background:"none", border:"none", cursor:"pointer", padding:"3px 4px" }}>
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Schedule type dropdown */}
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Schedule Type</p>
                    <select
                      value={bulkForm.schedule_type}
                      onChange={e => setBulkForm(f => ({ ...f, schedule_type: e.target.value }))}
                      style={{ width:"100%", height:40, padding:"0 12px", border:"1px solid #e2e8f0", borderRadius:9,
                        fontSize:13, color:"#1e293b", background:"#fff", outline:"none", cursor:"pointer" }}>
                      <option value="fixed">Fixed Schedule (Mon–Fri / Mon–Sat)</option>
                      <option value="rotational">Rotational Shift</option>
                    </select>
                  </div>
                </div>

                {/* ── Row 2: Schedule configuration ── */}
                <div style={{ border:"1px solid #e2e8f0", borderRadius:12, padding:"16px" }}>
                  {bulkForm.schedule_type === "fixed" ? (
                    <div style={{ display:"grid", gridTemplateColumns:"auto 1fr 1fr", gap:20, alignItems:"start" }}>
                      {/* Working days */}
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>Working Days</p>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {DAYS.map(d => {
                            const sel = (bulkForm.work_days || []).includes(d.id);
                            return (
                              <button key={d.id} type="button" onClick={() => toggleBulkDay(d.id)}
                                style={{
                                  padding:"7px 13px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer",
                                  border: sel ? "1.5px solid #f18200" : "1px solid #e2e8f0",
                                  background: sel ? "#f18200" : "#fff",
                                  color: sel ? "#fff" : "#64748b",
                                }}>{d.label}</button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Start time */}
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Start Time</p>
                        <input type="time" value={bulkForm.start_time}
                          onChange={e => setBulkForm(f => ({ ...f, start_time: e.target.value }))}
                          style={{ width:"100%", height:40, border:"1px solid #e2e8f0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" }} />
                      </div>
                      {/* End time */}
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>End Time</p>
                        <input type="time" value={bulkForm.end_time}
                          onChange={e => setBulkForm(f => ({ ...f, end_time: e.target.value }))}
                          style={{ width:"100%", height:40, border:"1px solid #e2e8f0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" }} />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>Rotation Pattern</p>
                      <input type="text" value={bulkForm.rotation_pattern}
                        onChange={e => setBulkForm(f => ({ ...f, rotation_pattern: e.target.value }))}
                        placeholder="e.g. Week A: Mon-Fri, Week B: Tue-Sat"
                        style={{ width:"100%", height:40, border:"1px solid #e2e8f0", borderRadius:9, padding:"0 12px", fontSize:13, outline:"none", boxSizing:"border-box" }} />
                    </div>
                  )}
                </div>

                {/* ── Row 3: Apply button ── */}
                <button type="button" onClick={applyBulk}
                  disabled={checkedEmps.size === 0 || bulkSaving}
                  style={{
                    alignSelf:"flex-start", padding:"10px 28px", borderRadius:9, border:"none",
                    background: checkedEmps.size === 0 ? "#e2e8f0" : "#f18200",
                    color: checkedEmps.size === 0 ? "#94a3b8" : "#fff",
                    fontSize:13, fontWeight:700, cursor: checkedEmps.size === 0 ? "not-allowed" : "pointer",
                    display:"flex", alignItems:"center", gap:6,
                  }}>
                  <Save size={13} />
                  {bulkSaving ? "Saving…" :
                   checkedEmps.size === 0 ? "Select employees to apply" :
                   `Apply Schedule to ${checkedEmps.size} Employee${checkedEmps.size > 1 ? "s" : ""}`}
                </button>

              </div>
            )}
          </section>
        </div>

        {/* Notification Preferences */}
        <section className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900">Notification Preferences</h2>
          <p className="mt-1 text-sm text-gray-500">Choose how you want to be notified</p>
          <div className="mt-6 space-y-6">
            {[
              { key: 'leaveRequests',      label: 'Leave Requests',      description: 'New leave requests and approvals' },
              { key: 'performanceReviews', label: 'Performance Reviews', description: 'Review cycles and deadlines' },
              { key: 'onboarding',         label: 'Onboarding',          description: 'Task assignments and progress' },
            ].map(item => (
              <div key={item.key} className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr_1fr] items-center rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                {['email', 'push', 'inApp'].map(channel => (
                  <label key={channel} className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <input type="checkbox" checked={notifications[item.key][channel]} onChange={() => toggleNotif(item.key, channel)}
                      className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/50" />
                    {channel === 'inApp' ? 'In-app' : channel.charAt(0).toUpperCase() + channel.slice(1)}
                  </label>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition">
              Save Changes
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
