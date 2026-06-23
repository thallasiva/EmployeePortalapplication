import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

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
            <h2 className="text-xl font-semibold text-slate-900">Work Schedule</h2>
            <p className="mt-1 text-sm text-gray-500">Default work hours for {selectedCompany.name}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Default start time</span>
                <input type="time" value={schedule.startTime} onChange={e => setSchedule('startTime', e.target.value)} className={inputCls} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Default end time</span>
                <input type="time" value={schedule.endTime} onChange={e => setSchedule('endTime', e.target.value)} className={inputCls} />
              </label>
            </div>
            <div className="mt-6">
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
