import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Trees } from "lucide-react";
import { greeting } from "../utils/formatters";

const ProfileHeader = React.memo(function ProfileHeader({ loading, initials, empName, empCode, designation, department, joinDate, photo, office, completion }) {
  return (
    <section className="relative mb-3 flex min-h-[82px] flex-wrap items-center gap-3 overflow-hidden rounded-xl border border-orange-100 bg-gradient-to-r from-orange-100 via-orange-50 to-white px-3 py-3 shadow-sm sm:px-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-white text-sm font-extrabold text-[#e87500] shadow-sm">
        {photo ? <img src={photo} alt={empName || "Employee profile"} className="h-full w-full object-cover" /> : loading ? "…" : initials}
      </div>
      <div className="z-10 min-w-[200px] flex-1">
        <div className="text-sm font-extrabold text-slate-950">{greeting()}, {loading ? "…" : empName || "Employee"} <span aria-hidden="true">👋</span></div>
        <div className="mt-1 text-[10px] font-medium text-slate-700">{empCode} &nbsp;·&nbsp; {designation} &nbsp;·&nbsp; {department}</div>
        <div className="mt-0.5 text-[10px] text-slate-500">Joined: {joinDate} &nbsp;·&nbsp; {office || "Employee Portal"}</div>
      </div>
      <div className="pointer-events-none absolute right-[230px] top-0 hidden h-full items-end gap-1 text-orange-300/70 md:flex" aria-hidden="true">
        <Trees size={28} className="mb-2" /><Building2 size={42} className="mb-1" /><Building2 size={30} className="mb-1" />
      </div>
      <div className="z-10 ml-auto w-full max-w-[190px] rounded-lg border border-white/80 bg-white/75 px-3 py-2 sm:w-auto">
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600"><span>Profile Completion</span><b className="text-[#e87500]">{completion}%</b></div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-orange-100"><div className="h-full rounded-full bg-[#e87500]" style={{ width: `${completion}%` }} /></div>
        <Link to="/employee/my-info" className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#e87500] hover:underline">Complete Profile <ArrowRight size={11}/></Link>
      </div>
    </section>
  );
});

export default ProfileHeader;
