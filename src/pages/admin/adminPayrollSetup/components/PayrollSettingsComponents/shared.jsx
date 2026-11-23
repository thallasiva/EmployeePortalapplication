const localToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const emptyPolicy = () => ({
  effective_from: localToday(),
  currency_code: "INR",
  payroll_frequency: "MONTHLY",
  cutoff_day: 25,
  salary_payment_day: 1,
  working_days_method: "WORKING_DAYS",
  fixed_working_days: "",
  lop_calculation_method: "WORKING_DAYS",
  rounding_method: "HALF_UP",
  financial_year_start_month: 4,
  approval_employee_ids: []
});
const FIELD = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#e87500] focus:ring-2 focus:ring-orange-100";
export { localToday, emptyPolicy, FIELD };
