export const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
].map((label, idx) => ({ value: idx + 1, label }));

export function getYearOptions() {
  const y = new Date().getFullYear();
  return [y - 1, y, y + 1];
}

export const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (A – Z)" },
  { value: "salary-desc", label: "Salary (High – Low)" },
  { value: "salary-asc", label: "Salary (Low – High)" },
  { value: "joining-desc", label: "Joining Date (Newest)" }
];
