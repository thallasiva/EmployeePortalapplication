export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const FISCAL_ORDER = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2];

export const NEW_SLABS = [[400000, 0], [400000, 0.05], [400000, 0.10], [400000, 0.15], [400000, 0.20], [Infinity, 0.30]];
export const OLD_SLABS = [[250000, 0], [250000, 0.05], [500000, 0.20], [Infinity, 0.30]];

export const SECTION_MAP = {
  exemption: [
    { old: "Section 10(5)", new25: "Section 11 (Sch III (8))", desc: "Travel concession or assistance (LTA/LTC)", key: "lta" },
    { old: "Section 10(10)", new25: "Section 19 (1)(3)", desc: "Death-cum-retirement gratuity exemption", key: null },
    { old: "Section 10(10A)", new25: "Section 19 (1)(7)", desc: "Commuted value of pension exemption", key: null },
    { old: "Section 10(10AA)", new25: "Section 19 (1)(14)", desc: "Leave encashment on retirement", key: null },
    { old: "Section 10(10B)", new25: "Section 19 (1)(10)", desc: "Retrenchment compensation", key: null },
    { old: "Section 10(13)", new25: "Section 11 (Sch II (8))", desc: "Approved superannuation fund", key: null },
    { old: "Section 10(13A)", new25: "Section 11 (Sch III (11))", desc: "House rent allowance (HRA)", key: "hra" },
    { old: "Section 10(14)", new25: "Section 11 (Sch III (12))", desc: "Special allowances", key: "special" },
    { old: "Section 10", new25: "Section 11", desc: "Total exemption", key: null },
  ],
  deduction: [
    { old: "Section 16(ia)", new25: "Section 19 (1)(2)", desc: "Standard deduction", key: "basic" },
    { old: "Section 16(iii)", new25: "Section 19 (1)(1)", desc: "Professional tax", key: "profTax" },
    { old: "Section 24", new25: "Section 22", desc: "Housing loan interest", key: null },
    { old: "Section 80C", new25: "Section 123", desc: "Investments (PPF, ELSS, etc.)", key: "pf" },
    { old: "Section 80CCC", new25: "Section 123", desc: "Pension funds", key: null },
    { old: "Section 80CCD(1)", new25: "Section 124 (5)", desc: "NPS contribution", key: null },
    { old: "Section 80CCD(1B)", new25: "Section 124 (3)", desc: "Additional NPS ₹50,000", key: null },
    { old: "Section 80CCD(2)", new25: "Section 124 (1)", desc: "Employer NPS", key: null },
    { old: "Section 80CCE", new25: "Section 123", desc: "₹1.5 lakh aggregate limit", key: "pf" },
    { old: "Section 80CCH", new25: "Section 125", desc: "Agnipath Scheme", key: null },
    { old: "Section 80D", new25: "Section 126", desc: "Health insurance", key: null },
    { old: "Section 80DD", new25: "Section 127", desc: "Dependent disability", key: null },
    { old: "Section 80DDB", new25: "Section 128", desc: "Specified diseases", key: null },
    { old: "Section 80E", new25: "Section 129", desc: "Education loan interest", key: null },
    { old: "Section 80EE", new25: "Section 130", desc: "Home loan interest (affordable)", key: null },
    { old: "Section 80EEA", new25: "Section 131", desc: "Housing loan", key: null },
    { old: "Section 80EEB", new25: "Section 132", desc: "—", key: null },
    { old: "Section 80G", new25: "Section 133", desc: "Donations", key: null },
    { old: "Section 80GG", new25: "Section 134", desc: "Rent without HRA", key: null },
    { old: "Section 80GGA", new25: "Section 135", desc: "Scientific research donations", key: null },
    { old: "Section 80GGC", new25: "Section 137", desc: "Political contributions", key: null },
    { old: "Section 80TTA", new25: "Section 153 (2)(a)", desc: "Savings interest (₹10k)", key: null },
    { old: "Section 80TTB", new25: "Section 153 (2)(b)", desc: "Senior citizen interest (₹50k)", key: null },
    { old: "Section 80U", new25: "Section 154", desc: "Disability deduction", key: null },
    { old: "Chapter VI-A", new25: "Chapter VIII", desc: "Other deductions", key: null },
  ],
  regime: [
    { old: "Section 115BAC", new25: "Section 202", desc: "New tax regime", key: "basic" },
    { old: "Section 87A", new25: "Section 156", desc: "Tax rebate", key: null },
    { old: "Section 89", new25: "Section 157", desc: "Relief for arrears", key: null },
  ],
  tds: [
    { old: "Section 192", new25: "Section 392", desc: "TDS on salary", key: "basic" },
    { old: "Section 192(2B)", new25: "Section 392(4)", desc: "Other income declaration", key: null },
    { old: "Section 194P", new25: "Section 392(8)", desc: "Senior citizen TDS exemption", key: null },
    { old: "Section 197", new25: "Section 395", desc: "Lower TDS certificate", key: null },
    { old: "Section 234E", new25: "Section 427", desc: "Late fee for TDS", key: null },
  ],
  forms: [
    { old: "Form 16", new25: "Form 130", desc: "TDS certificate", key: "basic" },
    { old: "Form 24Q", new25: "Form 143", desc: "Quarterly TDS return", key: "basic" },
    { old: "Form 12BB", new25: "Form 124", desc: "Employee declaration", key: "basic" },
  ],
};

export const GROUPS = [
  { key: "exemption", label: "EXEMPTION", color: "#1565c0", bg: "#e8f0fe" },
  { key: "deduction", label: "DEDUCTION", color: "#6a1b9a", bg: "#f3e5f5" },
  { key: "regime", label: "REGIME / REBATE", color: "#2e7d32", bg: "#e8f5e9" },
  { key: "tds", label: "TDS", color: "#e65100", bg: "#fff3e0" },
  { key: "forms", label: "FORMS", color: "#37474f", bg: "#eceff1" },
];

// Table style constants shared across table components
export const TH = { padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#475569", borderBottom: "1px solid #d5dbe3", whiteSpace: "nowrap", background: "#e8f4fa" };
export const TS = { padding: "7px 12px", fontSize: 12, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" };
export const TSS = (left, bold) => ({ ...TS, position: "sticky", left, background: "#fff", fontWeight: bold ? 700 : 400, color: "#334155", borderRight: "1px solid #e8edf2" });
export const TN = (bold) => ({ ...TS, textAlign: "right", fontWeight: bold ? 700 : 400, color: bold ? "#1e293b" : "#334155" });
