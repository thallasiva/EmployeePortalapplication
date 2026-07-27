export const CATEGORIES = ["Earning", "Deduction", "Employer Contribution"];
export const CALC_TYPES = ["Fixed", "Percentage", "Formula"];
export const FREQUENCIES = ["Monthly", "Quarterly", "Half-Yearly", "Annual", "One-Time"];

export const CAT_COLOR = {
  Earning: "bg-green-50 text-green-700 border-green-200",
  Deduction: "bg-red-50 text-red-700 border-red-200",
  "Employer Contribution": "bg-blue-50 text-blue-700 border-blue-200",
};

export const BLANK = {
  component_name: "",
  component_code: "",
  category: "Earning",
  calc_type: "Fixed",
  percentage_value: "",
  percentage_of: "",
  formula_expr: "",
  frequency: "Monthly",
  is_taxable: true,
  pf_applicable: false,
  esi_applicable: false,
  gratuity_applicable: false,
  show_offer_letter: true,
  show_ctc_breakup: true,
  show_payslip: true,
  sort_order: "100",
  description: "",
};

export const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400";
export const sel = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white";
