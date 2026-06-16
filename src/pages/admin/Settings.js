import React, { useState } from 'react';

const defaultNotificationSettings = {
  leaveRequests: { email: true, push: true, inApp: true },
  performanceReviews: { email: true, push: false, inApp: true },
  onboarding: { email: false, push: false, inApp: true },
};

const workDays = [
  { label: 'Mon', id: 'mon' },
  { label: 'Tue', id: 'tue' },
  { label: 'Wed', id: 'wed' },
  { label: 'Thu', id: 'thu' },
  { label: 'Fri', id: 'fri' },
  { label: 'Sat', id: 'sat' },
  { label: 'Sun', id: 'sun' },
];

export default function Settings() {
  const [companyProfile, setCompanyProfile] = useState({
    name: 'TeamPulse Inc.',
    industry: 'Technology',
    size: '11-50',
    timezone: 'America/Los_Angeles',
    address: '742 Valencia St, San Francisco, CA 94110',
  });

  const [schedule, setSchedule] = useState({
    startTime: '09:00',
    endTime: '17:00',
    workDays: {
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
      sat: false,
      sun: false,
    },
  });

  const [notifications, setNotifications] = useState(defaultNotificationSettings);

  const handleProfileChange = (field, value) => {
    setCompanyProfile((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (dayId) => {
    setSchedule((prev) => ({
      ...prev,
      workDays: { ...prev.workDays, [dayId]: !prev.workDays[dayId] },
    }));
  };

  const toggleNotification = (section, channel) => {
    setNotifications((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [channel]: !prev[section][channel],
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 mb-1">Home / Settings</p>
            <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          </div>
          <button className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition">
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Company Profile</h2>
                <p className="mt-1 text-sm text-gray-500">Basic information about your organization</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Company name</span>
                <input
                  value={companyProfile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Industry</span>
                <select
                  value={companyProfile.industry}
                  onChange={(e) => handleProfileChange('industry', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                >
                  <option>Technology</option>
                  <option>Financial Services</option>
                  <option>Healthcare</option>
                  <option>Education</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Company size</span>
                <select
                  value={companyProfile.size}
                  onChange={(e) => handleProfileChange('size', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                >
                  <option>11-50</option>
                  <option>51-200</option>
                  <option>201-500</option>
                  <option>500+</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Timezone</span>
                <select
                  value={companyProfile.timezone}
                  onChange={(e) => handleProfileChange('timezone', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                >
                  <option>America/Los_Angeles</option>
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                  <option>Asia/Kolkata</option>
                </select>
              </label>

              <label className="md:col-span-2 space-y-2">
                <span className="text-sm font-medium text-slate-700">Address</span>
                <input
                  value={companyProfile.address}
                  onChange={(e) => handleProfileChange('address', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </label>
            </div>
          </section>

          <section className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Work Schedule</h2>
              <p className="mt-1 text-sm text-gray-500">Configure your company's default work hours</p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Default start time</span>
                <input
                  type="time"
                  value={schedule.startTime}
                  onChange={(e) => setSchedule((prev) => ({ ...prev, startTime: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Default end time</span>
                <input
                  type="time"
                  value={schedule.endTime}
                  onChange={(e) => setSchedule((prev) => ({ ...prev, endTime: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </label>
            </div>

            <div className="mt-6">
              <span className="text-sm font-medium text-slate-700">Work days</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {workDays.map((day) => (
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
          </section>
        </div>

        <section className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Notification Preferences</h2>
            <p className="mt-1 text-sm text-gray-500">Choose how you want to be notified</p>
          </div>

          <div className="mt-6 space-y-6">
            {[
              { key: 'leaveRequests', label: 'Leave Requests', description: 'Get notified about new leave requests and approvals' },
              { key: 'performanceReviews', label: 'Performance Reviews', description: 'Updates on review cycles, deadlines, and completions' },
              { key: 'onboarding', label: 'Onboarding', description: 'Task assignments and onboarding progress updates' },
            ].map((item) => (
              <div key={item.key} className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr_1fr] items-center rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>

                {['email', 'push', 'inApp'].map((channel) => (
                  <label key={channel} className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={notifications[item.key][channel]}
                      onChange={() => toggleNotification(item.key, channel)}
                      className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/50"
                    />
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
