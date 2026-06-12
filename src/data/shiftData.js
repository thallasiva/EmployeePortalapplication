/** Static shift definitions used to drive the shift-based employee dashboard. */

export const SHIFT_DASHBOARD_DATA = {
  general: {
    id: "general",
    name: "General Shift",
    timing: "09:00 AM – 06:00 PM",
    breakWindow: "1:00 PM – 2:00 PM (1h lunch break)",
    theme: {
      bg: "bg-white",
      border: "border-blue-200",
      text: "text-blue-700",
      pill: "bg-blue-600",
    },
    attendance: {
      status: "Checked In",
      checkIn: "09:04 AM",
      checkOut: "—",
    },
    notices: [
      "Town hall meeting today at 4:00 PM in Conference Room A.",
      "General shift cab pickup points have been updated for this week.",
    ],
    metrics: [
      { label: "On-time arrivals (this month)", value: "18 / 20" },
      { label: "Avg. working hours", value: "8.9h" },
      { label: "Pending regularizations", value: "0" },
    ],
  },
  mid: {
    id: "mid",
    name: "Mid Shift",
    timing: "01:00 PM – 10:00 PM",
    breakWindow: "5:30 PM – 6:30 PM (1h dinner break)",
    theme: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      pill: "bg-amber-500",
    },
    attendance: {
      status: "Checked In",
      checkIn: "01:05 PM",
      checkOut: "—",
    },
    notices: [
      "Mid shift overlaps with the General shift from 1 PM – 6 PM for handovers.",
      "Evening cab service is available after 9:30 PM.",
    ],
    metrics: [
      { label: "Handover overlap with General team", value: "5h" },
      { label: "On-time arrivals (this month)", value: "19 / 20" },
      { label: "Pending regularizations", value: "1" },
    ],
  },
  night: {
    id: "night",
    name: "Night Shift",
    timing: "10:00 PM – 07:00 AM",
    breakWindow: "2:00 AM – 3:00 AM (1h break)",
    theme: {
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-700",
      pill: "bg-indigo-600",
    },
    attendance: {
      status: "Not Checked In",
      checkIn: "—",
      checkOut: "—",
    },
    notices: [
      "Night shift allowance is credited along with the monthly payroll.",
      "Security desk contact for night shift queries: Ext. 4521.",
    ],
    metrics: [
      { label: "Night shift allowance (this month)", value: "Rs. 4,500" },
      { label: "On-time arrivals (this month)", value: "20 / 20" },
      { label: "Pending regularizations", value: "0" },
    ],
  },
};

export function getShiftDashboardData(shiftId) {
  return SHIFT_DASHBOARD_DATA[shiftId] || SHIFT_DASHBOARD_DATA.general;
}
