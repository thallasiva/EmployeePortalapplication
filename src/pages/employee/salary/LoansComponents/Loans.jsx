import { useState } from "react";
import { Plus, Wallet, PiggyBank, TrendingDown, CalendarClock } from "lucide-react";
import { fmt, LOANS } from "./shared";
import { StatCard } from "./StatCard";
import { ApplyModal } from "./ApplyModal";
import { LoanCard } from "./LoanCard";
function Loans() {
  const [tab, setTab] = useState("active");
  const [showModal, setShowModal] = useState(false);
  const active = LOANS.filter(l => l.status === "Active");
  const closed = LOANS.filter(l => l.status === "Closed");
  const list = tab === "active" ? active : closed;
  const totalOutstanding = active.reduce((a, l) => a + l.outstanding, 0);
  const totalEMI = active.reduce((a, l) => a + l.emi, 0);
  const totalBorrowed = LOANS.reduce((a, l) => a + l.amount, 0);
  return <div className="min-h-screen  ">
      {showModal && <ApplyModal onClose={() => setShowModal(false)} />}
      {}
      <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-[#1f2937]">Loans & Advances</h1>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">Track your loan accounts and repayment schedule</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 h-[38px] px-5 bg-[#e87500] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold transition-colors">
          <Plus size={15} /> Apply for Loan
        </button>
      </div>
      {}
      <div className="px-6 pb-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Wallet size={20} />} label="Total Borrowed" value={fmt(totalBorrowed)} color="#e87500" bgColor="#fff8f0" />
        <StatCard icon={<TrendingDown size={20} />} label="Outstanding" value={fmt(totalOutstanding)} color="#ef4444" bgColor="#fef2f2" />
        <StatCard icon={<CalendarClock size={20} />} label="Monthly EMI" value={fmt(totalEMI)} color="#e87500" bgColor="#f5f3ff" sub="Due this month" />
        <StatCard icon={<PiggyBank size={20} />} label="Active Loans" value={active.length} color="#10b981" bgColor="#ecfdf5" sub={`${closed.length} closed`} />
      </div>
      {}
      <div className="px-6 pb-4">
        <div className="flex gap-1 bg-white rounded-xl border border-[#e8eef5] p-1 w-fit">
          {[{
          k: "active",
          l: `Active (${active.length})`
        }, {
          k: "closed",
          l: `Closed (${closed.length})`
        }].map(({
          k,
          l
        }) => <button key={k} onClick={() => setTab(k)} className={`px-5 h-[36px] rounded-lg text-[13px] font-medium transition-all ${tab === k ? "bg-[#e87500] text-white shadow-sm" : "text-[#64748b] hover:text-[#1f2937]"}`}>
              {l}
            </button>)}
        </div>
      </div>
      {}
      <div className="px-6 pb-8">
        {list.length === 0 ? <div className="bg-white rounded-xl border border-[#e8eef5] p-16 text-center">
            <PiggyBank size={48} strokeWidth={1} className="text-[#e2e8f0] mx-auto mb-3" />
            <p className="text-[#94a3b8] text-[14px]">No {tab} loans found.</p>
          </div> : <div className="flex flex-col gap-4">
            {list.map(loan => <LoanCard key={loan.id} loan={loan} />)}
          </div>}
      </div>
    </div>;
}
export { Loans };
