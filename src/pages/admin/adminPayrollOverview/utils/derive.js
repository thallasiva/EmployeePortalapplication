// Pure helpers that turn the raw payroll hook data into dashboard-ready shapes.

export const PROCESS_STEPS = [
  "Attendance", "Leave", "Period Lock", "Calculate Payroll",
  "Review", "Approve", "Finalize", "Payslips",
];

// Returns [{ label, status }] where status is 'done' | 'current' | 'pending'.
// Uses the run's review_status / is_locked lifecycle when available.
export function deriveSteps({ selRun, hasPayslips, attendanceReady }) {
  const rs = selRun?.review_status;
  const locked = !!selRun?.is_locked;
  const hasRun = !!selRun;
  const attDone = attendanceReady || hasRun;

  const flags = [
    ["Attendance", attDone],
    ["Leave", attDone],
    ["Period Lock", attDone],
    ["Calculate Payroll", hasRun || hasPayslips],
    ["Review", rs === "PENDING_REVIEW" || rs === "APPROVED"],
    ["Approve", rs === "APPROVED"],
    ["Finalize", locked],
    ["Payslips", hasPayslips || locked],
  ];

  const firstPending = flags.findIndex(([, done]) => !done);
  return flags.map(([label, done], i) => ({
    label,
    status: done ? "done" : i === firstPending ? "current" : "pending",
  }));
}

export function stepsCompleted(steps) {
  return steps.filter((s) => s.status === "done").length;
}

// Per-category counts PLUS a distinct-employee attention count (no double counting).
export function computeExceptions({ employees, attendanceRows, payslips }) {
  const attended = new Set(attendanceRows.map((r) => r.employee_id));
  const paid = new Set(payslips.map((p) => p.employee_id));
  const flagged = new Set();
  const items = [];

  const add = (key, label, color, pred) => {
    const ids = employees.filter(pred).map((e) => e.employee_id);
    ids.forEach((id) => flagged.add(id));
    items.push({ key, label, color, count: ids.length });
  };

  add("attendance", "Missing Attendance", "#d97706", (e) => !attended.has(e.employee_id));
  add("payslip", "Pending Payslip", "#dc2626", (e) => !paid.has(e.employee_id));

  const has = (f) => employees.some((e) => e && Object.prototype.hasOwnProperty.call(e, f));
  if (has("account_number") || has("bank_name")) {
    const f = has("account_number") ? "account_number" : "bank_name";
    add("bank", "Missing Bank Account", "#e11d48", (e) => !e?.[f]);
  }
  if (has("pan_number")) add("pan", "Missing PAN", "#7c3aed", (e) => !e?.pan_number);
  if (has("structure_id") || has("ctc")) {
    const f = has("structure_id") ? "structure_id" : "ctc";
    add("structure", "Salary Structure Missing", "#0891b2", (e) => !e?.[f]);
  }

  // attentionCount = number of DISTINCT employees with at least one issue
  return { items, attentionCount: flagged.size };
}

// Readiness checklist + a single percentage for the health gauge.
export function computeHealth({ steps, exceptionsTotal }) {
  const isDone = (label) => steps.find((s) => s.label === label)?.status === "done";
  const checks = [
    { label: "Attendance Locked", ok: isDone("Attendance") },
    { label: "Leave Locked", ok: isDone("Leave") },
    { label: "Period Locked", ok: isDone("Period Lock") },
    { label: "Employee Data Verified", ok: exceptionsTotal === 0 },
  ];
  const passed = checks.filter((c) => c.ok).length;
  return { checks, percent: Math.round((passed / checks.length) * 100) };
}

export function fmtDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d)) return String(value);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
