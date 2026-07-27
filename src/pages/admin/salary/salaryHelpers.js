

export const fmtINR = (n) =>
n > 0 ? `₹ ${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—";

export const fmtPct = (n) => n != null ? `${n}%` : "—";

export const codeFromName = (name) =>
name.
toUpperCase().
replace(/[^A-Z\s]/g, "").
trim().
split(/\s+/).
map((w) => w.slice(0, 3)).
join("_").
slice(0, 10);

export const CALC_TYPES = ["Percentage", "Fixed Amount", "Formula"];
export const CATEGORIES = ["Earning", "Deduction", "Employer Contribution"];
export const FREQUENCIES = ["Monthly", "Annual", "One-Time"];
export const PCT_OF_OPTS = ["CTC_MONTHLY", "BASIC", "HRA", "GROSS", "CTC_ANNUAL"];

export const TABS = [
{ id: "fixed", label: "1. Fixed Pay" },
{ id: "variable", label: "2. Variable Pay" },
{ id: "employer", label: "3. Employer Contributions" },
{ id: "deduct", label: "4. Deductions" },
{ id: "benefits", label: "5. Employee Benefits" },
{ id: "onetime", label: "6. One-time Payments" },
{ id: "tax", label: "7. Tax & Statutory" },
{ id: "formula", label: "8. Formula Builder" },
{ id: "preview", label: "9. Salary Preview" },
{ id: "history", label: "10. History" }];


export const TAB_META = {
  fixed: { title: "1. Fixed Pay (Monthly Earnings)", sub: "Recurring monthly salary components", category: "Earning" },
  variable: { title: "2. Variable Pay", sub: "Annual, bonus and one-time pay components", category: "Earning" },
  employer: { title: "3. Employer Contributions", sub: "Employer-side statutory contributions", category: "Employer Contribution" },
  deduct: { title: "4. Deductions", sub: "Employee-side deductions", category: "Deduction" },
  benefits: { title: "5. Employee Benefits", sub: "Medical, insurance and welfare benefits", category: "Earning" },
  onetime: { title: "6. One-time Payments", sub: "Joining bonus, gratuity and ad-hoc payments", category: "Earning" },
  tax: { title: "7. Tax & Statutory", sub: "TDS, PT and statutory compliance settings", category: "Deduction" }
};

export const tabFilter = (lines, tab) => {
  if (!lines) return [];
  const s = [...lines].sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
  switch (tab) {
    case "fixed":return s.filter((l) => l.category === "Earning" && l.frequency === "Monthly");
    case "variable":return s.filter((l) => l.category === "Earning" && l.frequency !== "Monthly");
    case "employer":return s.filter((l) => l.category === "Employer Contribution");
    case "deduct":return s.filter((l) => l.category === "Deduction");
    default:return s;
  }
};


export const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400";
export const sel = `${inp} bg-white`;
