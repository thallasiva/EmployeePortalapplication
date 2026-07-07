import { useEffect, useState } from "react";
import { Plus, X, Upload, CheckCircle2, Clock, XCircle, Receipt, TrendingUp, Wallet, FileText } from "lucide-react";
import { getMySalaryStructure } from "../../../api/payroll.api";
import { buildSalaryBreakdown } from "../../../utils/salaryBreakdown";
import { FiscalYearPicker } from "../../../component/YearPicker";
import { getCurrentFiscalYearStart, getFiscalYearRangeLabel } from "../../../lib/dateUtils";

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const STATUS_CONFIG = {
  Approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", icon: <CheckCircle2 size={12} /> },
  Pending:  { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400",  icon: <Clock size={12} /> },
  Rejected: { bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200",     dot: "bg-red-500",    icon: <XCircle size={12} /> },
};

const CLAIM_TYPES = ["Mobile / Internet", "Fuel", "LTA", "Medical", "Food", "Conveyance"];

const HISTORY = [
  { date: "01 Jun 2026", type: "Mobile / Internet", amount: 1500, status: "Approved" },
  { date: "15 May 2026", type: "Fuel",              amount: 2500, status: "Pending"  },
  { date: "10 Apr 2026", type: "LTA",               amount: 5000, status: "Approved" },
];

const ENTITLEMENT_COLORS = ["#f18200", "#6366f1", "#10b981", "#3b82f6", "#a855f7"];

/* ── Status Badge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
      {s.icon}{status}
    </span>
  );
}

/* ── Stat Card ────────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, bgColor }) {
  return (
    <div className="bg-white rounded-xl border border-[#e8eef5] p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bgColor }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">{label}</p>
        <p className="text-[20px] font-bold mt-0.5" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}

/* ── Claim Modal ──────────────────────────────────────────────────────────── */
function ClaimModal({ onClose }) {
  const [form, setForm] = useState({ type: CLAIM_TYPES[0], amount: "", remarks: "", file: null });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[440px] shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#fff8f0] flex items-center justify-center">
              <Receipt size={16} color="#f18200" />
            </div>
            <span className="text-[16px] font-bold text-[#1e293b]">New Claim</span>
          </div>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Claim type */}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Claim Type</label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="w-full h-[42px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10"
            >
              {CLAIM_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Amount (₹)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="Enter amount"
              className="w-full h-[42px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10"
            />
          </div>

          {/* Upload */}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Upload Bill</label>
            <label className="flex items-center gap-3 p-3 border-2 border-dashed border-[#e2e8f0] rounded-lg cursor-pointer hover:border-[#f18200]/40 hover:bg-[#fff8f0] transition-all">
              <Upload size={16} className="text-[#94a3b8] shrink-0" />
              <span className={`text-[13px] ${form.file ? "text-emerald-600 font-medium" : "text-[#64748b]"}`}>
                {form.file ? form.file.name : "Choose file (JPG, PDF, PNG)"}
              </span>
              <input type="file" onChange={(e) => set("file", e.target.files[0])} className="hidden" />
            </label>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-[12px] font-medium text-[#64748b] mb-1.5">Remarks <span className="text-[#cbd5e1]">(optional)</span></label>
            <input
              type="text"
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              placeholder="Add a note…"
              className="w-full h-[42px] border border-[#e2e8f0] rounded-lg px-3 text-[13px] outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 h-[42px] border border-[#e2e8f0] rounded-lg text-[13px] font-semibold text-[#64748b] hover:bg-[#f8fafc] transition-colors">
              Cancel
            </button>
            <button onClick={onClose} className="flex-1 h-[42px] bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold transition-colors">
              Submit Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Entitlement Card ─────────────────────────────────────────────────────── */
function EntitlementCard({ item, color }) {
  const balance  = item.annual - item.claimed;
  const usedPct  = Math.min(Math.round((item.claimed / (item.annual || 1)) * 100), 100);
  const r = 15.9;
  const circ = 2 * Math.PI * r;
  const dash = (usedPct / 100) * circ;

  return (
    <div className="bg-white rounded-xl border border-[#e8eef5] p-5 flex items-center gap-5 hover:shadow-md transition-shadow">
      {/* Ring */}
      <div className="relative shrink-0 w-[72px] h-[72px]">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r={r} fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
          <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3.5"
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold" style={{ color }}>
          {usedPct}%
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-[#1e293b]">{item.title}</p>
        <div className="flex items-center gap-4 mt-2 text-[12px] text-[#64748b]">
          <span>Annual: <strong className="text-[#1e293b]">{fmt(item.annual)}</strong></span>
          <span className="text-[#e2e8f0]">|</span>
          <span>Claimed: <strong className="text-[#1e293b]">{fmt(item.claimed)}</strong></span>
        </div>
        <div className="mt-3 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${usedPct}%`, background: color }} />
        </div>
      </div>

      {/* Balance */}
      <div className="text-right shrink-0 pl-4 border-l border-[#f1f5f9]">
        <p className="text-[11px] text-[#94a3b8] font-medium">Balance</p>
        <p className="text-[20px] font-extrabold mt-1" style={{ color: balance > 0 ? "#15803d" : "#ef4444" }}>
          {fmt(balance)}
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function Reimbursement() {
  const [fiscalYearStart, setFiscalYearStart] = useState(String(getCurrentFiscalYearStart()));
  const [activeTab, setActiveTab]             = useState("overview");
  const [showModal, setShowModal]             = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [entitlements, setEntitlements]       = useState([]);

  useEffect(() => {
    getMySalaryStructure()
      .then((s) => {
        if (s?.basic) {
          const b = buildSalaryBreakdown(s);
          setEntitlements([
            { title: "Telephone & Internet", annual: b.telephone * 12,       claimed: 1500, },
            { title: "LTA (Leave Travel)",   annual: b.lta * 12,             claimed: 5000, },
            { title: "Medical Allowance",    annual: b.medicalAllowance * 12, claimed: 0,   },
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fyLabel       = getFiscalYearRangeLabel(fiscalYearStart);
  const totalAnnual   = entitlements.reduce((a, e) => a + e.annual, 0);
  const totalClaimed  = entitlements.reduce((a, e) => a + e.claimed, 0);
  const totalBalance  = totalAnnual - totalClaimed;
  const histApproved  = HISTORY.filter((c) => c.status === "Approved").reduce((a, c) => a + c.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <p className="text-[#94a3b8] text-[14px]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {showModal && <ClaimModal onClose={() => setShowModal(false)} />}

      {/* ── Page Header ── */}
      <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-[#1f2937]">Reimbursements</h1>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">{fyLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <FiscalYearPicker
            value={fiscalYearStart}
            onChange={setFiscalYearStart}
            selectClassName="h-[38px] px-3 border border-[#d5dbe3] bg-white rounded-lg text-[13px] outline-none"
          />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 h-[38px] px-5 bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold transition-colors"
          >
            <Plus size={15} /> Add Claim
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="px-6 pb-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Wallet size={20} />}     label="Total Entitlement" value={fmt(totalAnnual)}   color="#f18200"  bgColor="#fff8f0" />
        <StatCard icon={<TrendingUp size={20} />} label="Total Claimed"     value={fmt(totalClaimed)}  color="#6366f1"  bgColor="#f5f3ff" />
        <StatCard icon={<CheckCircle2 size={20}/>}label="Approved"          value={fmt(histApproved)}  color="#10b981"  bgColor="#ecfdf5" />
        <StatCard icon={<FileText size={20} />}   label="Balance Left"      value={fmt(totalBalance)}  color="#3b82f6"  bgColor="#eff6ff" />
      </div>

      {/* ── Tabs ── */}
      <div className="px-6 pb-4">
        <div className="flex gap-1 bg-white rounded-xl border border-[#e8eef5] p-1 w-fit">
          {[{ k: "overview", l: "Overview" }, { k: "claims", l: "My Claims" }].map(({ k, l }) => (
            <button
              key={k}
              onClick={() => setActiveTab(k)}
              className={`px-5 h-[36px] rounded-lg text-[13px] font-medium transition-all ${
                activeTab === k ? "bg-[#f18200] text-white shadow-sm" : "text-[#64748b] hover:text-[#1f2937]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-8">

        {/* ── Overview Tab ── */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-4">
            {entitlements.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#e8eef5] p-16 text-center">
                <Receipt size={40} className="text-[#e2e8f0] mx-auto mb-3" />
                <p className="text-[#94a3b8] text-[14px]">No reimbursement entitlements found.</p>
              </div>
            ) : (
              entitlements.map((item, idx) => (
                <EntitlementCard key={item.title} item={item} color={ENTITLEMENT_COLORS[idx % ENTITLEMENT_COLORS.length]} />
              ))
            )}
          </div>
        )}

        {/* ── Claims Tab ── */}
        {activeTab === "claims" && (
          <div className="bg-white rounded-xl border border-[#e8eef5] overflow-hidden">
            {HISTORY.length === 0 ? (
              <div className="p-16 text-center">
                <FileText size={40} className="text-[#e2e8f0] mx-auto mb-3" />
                <p className="text-[#94a3b8] text-[14px]">No claims submitted yet.</p>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="grid grid-cols-4 px-5 py-3 bg-[#f8fafc] border-b border-[#e8eef5] text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                  <span>Type</span>
                  <span>Date</span>
                  <span>Amount</span>
                  <span>Status</span>
                </div>

                {/* Rows */}
                {HISTORY.map((c, i) => (
                  <div key={i} className="grid grid-cols-4 px-5 py-4 border-b border-[#f8fafc] items-center hover:bg-[#fafbff] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#fff8f0] flex items-center justify-center shrink-0">
                        <Receipt size={14} color="#f18200" />
                      </div>
                      <span className="text-[13px] font-semibold text-[#1f2937]">{c.type}</span>
                    </div>
                    <span className="text-[13px] text-[#64748b]">{c.date}</span>
                    <span className="text-[14px] font-bold text-[#1f2937]">{fmt(c.amount)}</span>
                    <StatusBadge status={c.status} />
                  </div>
                ))}

                {/* Footer totals */}
                <div className="px-5 py-3 bg-[#f8fafc] border-t border-[#e8eef5] flex items-center gap-6 text-[12px]">
                  <span className="text-[#64748b]">Total Claimed: <strong className="text-[#1f2937]">{fmt(HISTORY.reduce((a, c) => a + c.amount, 0))}</strong></span>
                  <span className="text-[#64748b]">Approved: <strong className="text-emerald-600">{fmt(histApproved)}</strong></span>
                  <span className="text-[#64748b]">Pending: <strong className="text-amber-600">{fmt(HISTORY.filter((c) => c.status === "Pending").reduce((a, c) => a + c.amount, 0))}</strong></span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
