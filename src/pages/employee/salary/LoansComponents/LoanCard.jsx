import { Wallet, CheckCircle2 } from "lucide-react";
import { fmt, TYPE_COLORS } from "./shared";
function LoanCard({
  loan
}) {
  const paidAmt = loan.amount - loan.outstanding;
  const progress = Math.round(paidAmt / loan.amount * 100);
  const theme = TYPE_COLORS[loan.type] || {
    bg: "#f8fafc",
    color: "#64748b"
  };
  const isActive = loan.status === "Active";
  return <div className="bg-white rounded-xl border border-[#e8eef5] overflow-hidden hover:shadow-md transition-shadow">
      {}
      <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-[#f8fafc]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{
          background: theme.bg
        }}>
            <Wallet size={20} style={{
            color: theme.color
          }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-bold text-[#1f2937]">{loan.type}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#f1f5f9] text-[#64748b]"}`}>
                {loan.status}
              </span>
            </div>
            <p className="text-[12px] text-[#94a3b8] mt-0.5">ID: {loan.id} · Issued: {loan.date}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-[#94a3b8]">Loan Amount</p>
          <p className="text-[20px] font-extrabold text-[#1f2937]">{fmt(loan.amount)}</p>
        </div>
      </div>
      {}
      <div className="grid grid-cols-4 divide-x divide-[#f1f5f9] px-0">
        {[{
        label: "Outstanding",
        value: fmt(loan.outstanding),
        color: isActive ? "#ef4444" : "#94a3b8"
      }, {
        label: "Monthly EMI",
        value: fmt(loan.emi),
        color: "#e87500"
      }, {
        label: "Total Tenure",
        value: `${loan.tenure} mo`,
        color: "#64748b"
      }, {
        label: "Remaining",
        value: loan.remaining > 0 ? `${loan.remaining} mo` : "—",
        color: isActive ? "#e87500" : "#94a3b8"
      }].map(({
        label,
        value,
        color
      }) => <div key={label} className="px-5 py-3">
            <p className="text-[11px] text-[#94a3b8] font-medium">{label}</p>
            <p className="text-[14px] font-bold mt-0.5" style={{
          color
        }}>{value}</p>
          </div>)}
      </div>
      {}
      <div className="px-5 pb-4 pt-1">
        <div className="flex items-center justify-between mb-2 text-[12px]">
          <span className="text-[#64748b] font-medium">Repayment Progress</span>
          <span className="font-bold" style={{
          color: theme.color
        }}>{progress}%</span>
        </div>
        <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{
          width: `${progress}%`,
          background: isActive ? theme.color : "#10b981"
        }} />
        </div>
        <div className="flex justify-between mt-2 text-[11px]">
          <span className="text-emerald-600 font-medium">Paid: {fmt(paidAmt)}</span>
          {loan.outstanding > 0 ? <span className="text-red-500 font-medium">Outstanding: {fmt(loan.outstanding)}</span> : <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 size={11} /> Fully repaid</span>}
        </div>
      </div>
    </div>;
}
export { LoanCard };
