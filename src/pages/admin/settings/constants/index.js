export const COMPANIES = [
  {
    id: 'natit',
    name: 'NAT IT Services Pvt. Ltd.',
    profile: { name: 'NAT IT Services Pvt. Ltd.', industry: 'Technology', size: '51-200', timezone: 'Asia/Kolkata', address: 'Plot no. 21, Sruthi Sadan, Gachibowli, Hyderabad, Telangana' },
    schedule: { startTime: '09:00', endTime: '18:00', workDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false } },
  },
  {
    id: 'natsoft-corp',
    name: 'Natsoft Corporation',
    profile: { name: 'Natsoft Corporation', industry: 'Technology', size: '201-500', timezone: 'America/New_York', address: '100 Technology Drive, Austin, TX 78701, United States' },
    schedule: { startTime: '08:00', endTime: '17:00', workDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false } },
  },
  {
    id: 'kognitic',
    name: 'Kognitic',
    profile: { name: 'Kognitic', industry: 'Healthcare', size: '11-50', timezone: 'America/Los_Angeles', address: 'United States' },
    schedule: { startTime: '09:00', endTime: '17:00', workDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false } },
  },
  {
    id: 'updraftworks',
    name: 'UpdraftWorks',
    profile: { name: 'UpdraftWorks', industry: 'Technology', size: '11-50', timezone: 'America/Los_Angeles', address: 'United States' },
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
