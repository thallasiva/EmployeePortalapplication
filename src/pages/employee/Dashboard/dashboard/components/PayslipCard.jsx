import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, FileText, LockKeyhole } from "lucide-react";

const PayslipCard = React.memo(function PayslipCard({ loading, sal, downloading, handleDownload, payslipLabel }) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2"><h2 className="text-xs font-bold text-slate-900">My Payslip</h2><Link to="/employee/payroll/payslips" className="inline-flex items-center gap-1 text-[9px] font-bold text-[#e87500] no-underline hover:underline">View All <ArrowRight size={10}/></Link></div>
      {loading ? <div className="grid min-h-[90px] place-items-center text-xs text-slate-400">Loading payslip…</div> : sal.basic <= 0 ? <div className="grid min-h-[90px] place-items-center text-center text-[10px] text-slate-400">Payslip is not available yet.</div> : <>
        <div className="flex min-h-[74px] items-center gap-3 rounded-lg bg-orange-50/70 p-2.5">
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white text-[#e87500] shadow-sm"><FileText size={25}/><LockKeyhole size={13} className="absolute -bottom-1 -right-1 rounded-full bg-[#e87500] p-0.5 text-white"/></span>
          <div className="min-w-0"><b className="block text-[10px] text-slate-800">{sal.fromPayslip ? "Latest Payslip" : "Salary Summary"}</b><span className="mt-1 block truncate text-[10px] text-slate-500">{payslipLabel}</span><span className="mt-1 block text-[9px] text-slate-400">Secure and private</span></div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={handleDownload} disabled={downloading} className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#e87500] px-2 py-2 text-[9px] font-bold text-white hover:bg-[#cf6900] disabled:opacity-50"><Download size={12}/>{downloading ? "Preparing…" : "Download"}</button><Link to="/employee/payroll/payslips" className="inline-flex items-center justify-center gap-1 rounded-lg border border-orange-200 bg-white px-2 py-2 text-[9px] font-bold text-[#e87500] no-underline hover:bg-orange-50">View Payslip</Link></div>
      </>}
    </section>
  );
});

export default PayslipCard;
