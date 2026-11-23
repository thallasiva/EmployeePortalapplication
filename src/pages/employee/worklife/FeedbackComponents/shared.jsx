import { ROLE_RECRUITER_LEAD } from "../../../../data/auth";
// role 4 is "HR Manager" in the roles table (the web constant predates the rename)
const ROLE_HR_MANAGER = ROLE_RECRUITER_LEAD;
const STATUS_STYLE = {
  pending: "bg-orange-50 text-orange-700",
  completed: "bg-emerald-50 text-emerald-700",
  declined: "bg-slate-100 text-slate-500"
};
export { ROLE_HR_MANAGER, STATUS_STYLE };
