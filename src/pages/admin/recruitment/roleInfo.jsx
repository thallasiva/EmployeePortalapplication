import { isAdmin, isRecruiter, isRecruiterLead } from "../../../data/auth";

function roleInfo(user)
{
    if (isAdmin(user)) return { id: 1, label: "Admin", tabClass: "bg-slate-800 text-white font-bold" };
    if (isRecruiterLead(user)) return { id: 4, label: "HR / Recruiter Manager", tabClass: "bg-violet-600 text-white font-bold" };
    if (isRecruiter(user)) return { id: 5, label: "Recruiter", tabClass: "bg-brand-500 text-white font-bold" };
    return { id: 1, label: "Admin", tabClass: "bg-slate-800 text-white font-bold" };
}
export default roleInfo;
