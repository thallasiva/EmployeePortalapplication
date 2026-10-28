export const COMPANIES = [
  {
    id: 'hrms',
    name: 'HRMS',
    profile: { name: 'HRMS', industry: 'Human Resources', size: '—', timezone: 'Asia/Kolkata', address: '—' },
    schedule: { startTime: '09:00', endTime: '18:00', workDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false } },
  },
];
export const WORK_DAYS = [
  { label: 'Mon', id: 'mon' }, { label: 'Tue', id: 'tue' }, { label: 'Wed', id: 'wed' },
  { label: 'Thu', id: 'thu' }, { label: 'Fri', id: 'fri' }, { label: 'Sat', id: 'sat' }, { label: 'Sun', id: 'sun' },
];
export const DEFAULT_NOTIFICATIONS = {
  leaveRequests:      { email: true,  push: true,  inApp: true },
  performanceReviews: { email: true,  push: false, inApp: true },
  onboarding:         { email: false, push: false, inApp: true },
};
export const INPUT_CLS = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";
