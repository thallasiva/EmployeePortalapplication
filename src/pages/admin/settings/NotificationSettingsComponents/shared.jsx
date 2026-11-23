const NOTIF_EVENTS = [{
  group: "Leave",
  events: [{
    label: "Leave Approved",
    email: true,
    inapp: true,
    sms: false,
    push: true
  }, {
    label: "Leave Rejected",
    email: true,
    inapp: true,
    sms: false,
    push: true
  }, {
    label: "Leave Request Submitted",
    email: true,
    inapp: true,
    sms: false,
    push: false
  }]
}, {
  group: "Attendance",
  events: [{
    label: "Check-In Reminder",
    email: false,
    inapp: true,
    sms: false,
    push: true
  }, {
    label: "Regularization Approved",
    email: true,
    inapp: true,
    sms: false,
    push: false
  }, {
    label: "Attendance Marked",
    email: false,
    inapp: true,
    sms: false,
    push: false
  }]
}, {
  group: "Payroll",
  events: [{
    label: "Payslip Generated",
    email: true,
    inapp: true,
    sms: false,
    push: true
  }, {
    label: "Salary Revision",
    email: true,
    inapp: true,
    sms: true,
    push: true
  }, {
    label: "Reimbursement Approved",
    email: true,
    inapp: true,
    sms: false,
    push: false
  }]
}, {
  group: "Recruitment",
  events: [{
    label: "Interview Scheduled",
    email: true,
    inapp: true,
    sms: true,
    push: true
  }, {
    label: "Offer Letter Sent",
    email: true,
    inapp: true,
    sms: false,
    push: false
  }]
}, {
  group: "System",
  events: [{
    label: "Password Reset",
    email: true,
    inapp: false,
    sms: false,
    push: false
  }, {
    label: "Login from New Device",
    email: true,
    inapp: true,
    sms: true,
    push: true
  }, {
    label: "Document Expiry Reminder",
    email: true,
    inapp: true,
    sms: false,
    push: false
  }]
}];
const buildDefault = () => NOTIF_EVENTS.map(g => ({
  ...g,
  events: g.events.map(e => ({
    ...e
  }))
}));
export { NOTIF_EVENTS, buildDefault };
