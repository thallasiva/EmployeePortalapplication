const fmt = n => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const LOAN_TYPES = ["Personal Loan", "Home Loan", "Vehicle Loan", "Emergency Advance", "Medical Advance"];
const LOANS = [{
  id: "LN001",
  type: "Personal Loan",
  amount: 120000,
  outstanding: 70000,
  emi: 10000,
  tenure: 12,
  remaining: 7,
  status: "Active",
  date: "01 Apr 2025"
}, {
  id: "LN002",
  type: "Emergency Advance",
  amount: 50000,
  outstanding: 0,
  emi: 5000,
  tenure: 10,
  remaining: 0,
  status: "Closed",
  date: "01 Jan 2024"
}];
const TYPE_COLORS = {
  "Personal Loan": {
    bg: "#fff7ed",
    color: "#e87500"
  },
  "Home Loan": {
    bg: "#f0fdf4",
    color: "#10b981"
  },
  "Vehicle Loan": {
    bg: "#faf5ff",
    color: "#a855f7"
  },
  "Emergency Advance": {
    bg: "#fff7ed",
    color: "#e87500"
  },
  "Medical Advance": {
    bg: "#fef2f2",
    color: "#ef4444"
  }
};
export { fmt, LOAN_TYPES, LOANS, TYPE_COLORS };
