/** Static regularization records — no API */

export const REGULARIZATION_HISTORY = [
  {
    id: 1,
    regularizedBy: "admin",
    days: 1,
    status: "CLOSED",
    datesApplied: "15 May 2026",
    regularizedOn: "25 May, 2026",
    remarks: "—",
    rows: [
      {
        date: "15 May, 2026",
        decision: "APPROVED",
        approverRemarks: "—",
        shift: "General Shift",
        firstIn: "10:00",
        lastOut: "19:00",
        reason: "Early Logout",
      },
    ],
    timeline: [
      { label: "Accept by admin", time: "Today 03:46 PM" },
      { label: "Submitted", time: "Today 12:17 PM" },
    ],
  },
  {
    id: 2,
    regularizedBy: "Amrita Debashish Das",
    days: 1,
    status: "CLOSED",
    datesApplied: "08 May 2026",
    regularizedOn: "20 May, 2026",
    remarks: "—",
    rows: [
      {
        date: "08 May, 2026",
        decision: "APPROVED",
        approverRemarks: "—",
        shift: "General Shift",
        firstIn: "10:05",
        lastOut: "18:55",
        reason: "Late Login",
      },
    ],
    timeline: [
      { label: "Accept by Amrita Debashish Das", time: "20 May 10:30 AM" },
      { label: "Submitted", time: "18 May 09:15 AM" },
    ],
  },
  {
    id: 3,
    regularizedBy: "A V Sowmya",
    days: 1,
    status: "CLOSED",
    datesApplied: "02 May 2026",
    regularizedOn: "10 May, 2026",
    remarks: "—",
    rows: [
      {
        date: "02 May, 2026",
        decision: "APPROVED",
        approverRemarks: "—",
        shift: "General Shift",
        firstIn: "10:00",
        lastOut: "19:00",
        reason: "Missed punch",
      },
    ],
    timeline: [
      { label: "Accept by admin", time: "10 May 02:00 PM" },
      { label: "Submitted", time: "09 May 11:00 AM" },
    ],
  },
];

/** Dates with attendance exceptions (month-day for demo) */
export const EXCEPTION_DAYS = new Set(["5-4", "5-15"]);
