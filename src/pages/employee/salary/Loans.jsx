import { useState } from "react";
import { Plus, X, Wallet, PiggyBank, TrendingDown, CalendarClock, CheckCircle2, Clock, ChevronRight } from "lucide-react";

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const LOAN_TYPES = ["Personal Loan", "Home Loan", "Vehicle Loan", "Emergency Advance", "Medical Advance"];

const LOANS = [
{ id: "LN001", type: "Personal Loan", amount: 120000, outstanding: 70000, emi: 10000, tenure: 12, remaining: 7, status: "Active", date: "01 Apr 2025" },
{ id: "LN002", type: "Emergency Advance", amount: 50000, outstanding: 0, emi: 5000, tenure: 10, remaining: 0, status: "Closed", date: "01 Jan 2024" }];


const TYPE_COLORS = {
  "Personal Loan": { bg: "#eff6ff", color: "#3b82f6" },
  "Home Loan": { bg: "#f0fdf4", color: "#10b981" },
  "Vehicle Loan": { bg: "#faf5ff", color: "#a855f7" },
  "Emergency Advance": { bg: "#fff7ed", color: "#f18200" },
  "Medical Advance": { bg: "#fef2f2", color: "#ef4444" }
};


function StatCard({ icon, label, value, color, bgColor, sub }) {
  return (
    <div className="bg-white rounded-xl border border-[#e8eef5] p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bgColor }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">{label}</p>
        <p className="text-[20px] font-bold mt-0.5 truncate" style={{ color }}>{value}</p>
        {sub && <p className="text-[11px] text-[#94a3b8] mt-0.5">{sub}</p>}
      </div>
    </div>);

}


function ApplyModal({ onClose }) {
  const [form, setForm] = useState({ type: LOAN_TYPES[0], amount: "", tenure: "", reason: "" });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const emi = form.amount && form.tenure ? Math.round(Number(form.amount) / Number(form.tenure)) : 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[460px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#fff8f0] flex items-center justify-center">
              <Wallet size={16} color="#f18200" />
            </div>
            <span className="text-[16px] font-bold text-[#1e293b]">Apply for Loan</span>
          </div>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Loan Type</label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="w-full h-[42px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10">

              {LOAN_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          {}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Loan Amount (₹)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="e.g. 100000"
                className="w-full h-[42px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10" />

            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Tenure (months)</label>
              <input
                type="number"
                value={form.tenure}
                onChange={(e) => set("tenure", e.target.value)}
                placeholder="e.g. 12"
                className="w-full h-[42px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10" />

            </div>
          </div>

          {}
          {emi > 0 &&
          <div className="flex items-center gap-3 p-4 bg-[#fff8f0] border border-[#fed7aa] rounded-xl">
              <CalendarClock size={18} color="#f18200" className="shrink-0" />
              <div>
                <p className="text-[11px] text-[#92400e] font-semibold uppercase tracking-wide">Estimated Monthly EMI</p>
                <p className="text-[18px] font-extrabold text-[#f18200]">{fmt(emi)}</p>
              </div>
            </div>
          }

          {}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Reason / Purpose</label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
              placeholder="Brief reason for loan request…"
              className="w-full border border-[#e2e8f0] rounded-lg p-3 text-[13px] outline-none resize-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10" />

          </div>

          {}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 h-[42px] border border-[#e2e8f0] rounded-lg text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc] transition-colors">
              Cancel
            </button>
            <button onClick={onClose} className="flex-1 h-[42px] bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold transition-colors">
              Submit Application
            </button>
          </div>
        </div>
      </div>
    </div>);

}


function LoanCard({ loan }) {
  const paidAmt = loan.amount - loan.outstanding;
  const progress = Math.round(paidAmt / loan.amount * 100);
  const theme = TYPE_COLORS[loan.type] || { bg: "#f8fafc", color: "#64748b" };
  const isActive = loan.status === "Active";

  return (
    <div className="bg-white rounded-xl border border-[#e8eef5] overflow-hidden hover:shadow-md transition-shadow">
      {}
      <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-[#f8fafc]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: theme.bg }}>
            <Wallet size={20} style={{ color: theme.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-bold text-[#1f2937]">{loan.type}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#f1f5f9] text-[#64748b]"}`
              }>
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
        {[
        { label: "Outstanding", value: fmt(loan.outstanding), color: isActive ? "#ef4444" : "#94a3b8" },
        { label: "Monthly EMI", value: fmt(loan.emi), color: "#f18200" },
        { label: "Total Tenure", value: `${loan.tenure} mo`, color: "#64748b" },
        { label: "Remaining", value: loan.remaining > 0 ? `${loan.remaining} mo` : "—", color: isActive ? "#6366f1" : "#94a3b8" }].
        map(({ label, value, color }) =>
        <div key={label} className="px-5 py-3">
            <p className="text-[11px] text-[#94a3b8] font-medium">{label}</p>
            <p className="text-[14px] font-bold mt-0.5" style={{ color }}>{value}</p>
          </div>
        )}
      </div>

      {}
      <div className="px-5 pb-4 pt-1">
        <div className="flex items-center justify-between mb-2 text-[12px]">
          <span className="text-[#64748b] font-medium">Repayment Progress</span>
          <span className="font-bold" style={{ color: theme.color }}>{progress}%</span>
        </div>
        <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: isActive ? theme.color : "#10b981" }} />

        </div>
        <div className="flex justify-between mt-2 text-[11px]">
          <span className="text-emerald-600 font-medium">Paid: {fmt(paidAmt)}</span>
          {loan.outstanding > 0 ?
          <span className="text-red-500 font-medium">Outstanding: {fmt(loan.outstanding)}</span> :
          <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 size={11} /> Fully repaid</span>
          }
        </div>
      </div>
    </div>);

}


export default function Loans() {
  const [tab, setTab] = useState("active");
  const [showModal, setShowModal] = useState(false);

  const active = LOANS.filter((l) => l.status === "Active");
  const closed = LOANS.filter((l) => l.status === "Closed");
  const list = tab === "active" ? active : closed;

  const totalOutstanding = active.reduce((a, l) => a + l.outstanding, 0);
  const totalEMI = active.reduce((a, l) => a + l.emi, 0);
  const totalBorrowed = LOANS.reduce((a, l) => a + l.amount, 0);

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {showModal && <ApplyModal onClose={() => setShowModal(false)} />}

      {}
      <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-[#1f2937]">Loans & Advances</h1>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">Track your loan accounts and repayment schedule</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 h-[38px] px-5 bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold transition-colors">

          <Plus size={15} /> Apply for Loan
        </button>
      </div>

      {}
      <div className="px-6 pb-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Wallet size={20} />} label="Total Borrowed" value={fmt(totalBorrowed)} color="#f18200" bgColor="#fff8f0" />
        <StatCard icon={<TrendingDown size={20} />} label="Outstanding" value={fmt(totalOutstanding)} color="#ef4444" bgColor="#fef2f2" />
        <StatCard icon={<CalendarClock size={20} />} label="Monthly EMI" value={fmt(totalEMI)} color="#6366f1" bgColor="#f5f3ff" sub="Due this month" />
        <StatCard icon={<PiggyBank size={20} />} label="Active Loans" value={active.length} color="#10b981" bgColor="#ecfdf5" sub={`${closed.length} closed`} />
      </div>

      {}
      <div className="px-6 pb-4">
        <div className="flex gap-1 bg-white rounded-xl border border-[#e8eef5] p-1 w-fit">
          {[{ k: "active", l: `Active (${active.length})` }, { k: "closed", l: `Closed (${closed.length})` }].map(({ k, l }) =>
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-5 h-[36px] rounded-lg text-[13px] font-medium transition-all ${
            tab === k ? "bg-[#f18200] text-white shadow-sm" : "text-[#64748b] hover:text-[#1f2937]"}`
            }>

              {l}
            </button>
          )}
        </div>
      </div>

      {}
      <div className="px-6 pb-8">
        {list.length === 0 ?
        <div className="bg-white rounded-xl border border-[#e8eef5] p-16 text-center">
            <PiggyBank size={48} strokeWidth={1} className="text-[#e2e8f0] mx-auto mb-3" />
            <p className="text-[#94a3b8] text-[14px]">No {tab} loans found.</p>
          </div> :

        <div className="flex flex-col gap-4">
            {list.map((loan) => <LoanCard key={loan.id} loan={loan} />)}
          </div>
        }
      </div>
    </div>);

}
