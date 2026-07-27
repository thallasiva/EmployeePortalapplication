import React, { useState, useCallback, useMemo } from "react";
import { Plus, CheckCircle2, TrendingUp, Wallet, FileText, Receipt } from "lucide-react";
import { FiscalYearPicker } from "../../../../component/YearPicker";
import { useReimbursement } from "./hooks/useReimbursement";
import { HISTORY, ENTITLEMENT_COLORS } from "./constants";
import { fmt } from "./utils";
import StatCard from "./components/StatCard";
import EntitlementCard from "./components/EntitlementCard";
import StatusBadge from "./components/StatusBadge";
import ClaimModal from "./components/ClaimModal";

const Reimbursement = React.memo(function Reimbursement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showModal, setShowModal] = useState(false);

  const { fiscalYearStart, setFiscalYearStart, loading, entitlements, fyLabel, totalAnnual, totalClaimed, totalBalance } = useReimbursement();

  const histApproved = useMemo(
    () => HISTORY.filter((c) => c.status === "Approved").reduce((a, c) => a + c.amount, 0),
    []
  );

  const handleOpenModal = useCallback(() => setShowModal(true), []);
  const handleCloseModal = useCallback(() => setShowModal(false), []);
  const handleTabChange = useCallback((k) => setActiveTab(k), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <p className="text-[#94a3b8] text-[14px]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {showModal && <ClaimModal onClose={handleCloseModal} />}

      {}
      <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-[#1f2937]">Reimbursements</h1>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">{fyLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <FiscalYearPicker
            value={fiscalYearStart}
            onChange={setFiscalYearStart}
            selectClassName="h-[38px] px-3 border border-[#d5dbe3] bg-white rounded-lg text-[13px] outline-none" />

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 h-[38px] px-5 bg-[#f18200] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold transition-colors">

            <Plus size={15} /> Add Claim
          </button>
        </div>
      </div>

      {}
      <div className="px-6 pb-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Wallet size={20} />} label="Total Entitlement" value={fmt(totalAnnual)} color="#f18200" bgColor="#fff8f0" />
        <StatCard icon={<TrendingUp size={20} />} label="Total Claimed" value={fmt(totalClaimed)} color="#6366f1" bgColor="#f5f3ff" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Approved" value={fmt(histApproved)} color="#10b981" bgColor="#ecfdf5" />
        <StatCard icon={<FileText size={20} />} label="Balance Left" value={fmt(totalBalance)} color="#3b82f6" bgColor="#eff6ff" />
      </div>

      {}
      <div className="px-6 pb-4">
        <div className="flex gap-1 bg-white rounded-xl border border-[#e8eef5] p-1 w-fit">
          {[{ k: "overview", l: "Overview" }, { k: "claims", l: "My Claims" }].map(({ k, l }) =>
          <button
            key={k}
            onClick={() => handleTabChange(k)}
            className={`px-5 h-[36px] rounded-lg text-[13px] font-medium transition-all ${
            activeTab === k ? "bg-[#f18200] text-white shadow-sm" : "text-[#64748b] hover:text-[#1f2937]"}`
            }>

              {l}
            </button>
          )}
        </div>
      </div>

      <div className="px-6 pb-8">

        {}
        {activeTab === "overview" &&
        <div className="flex flex-col gap-4">
            {entitlements.length === 0 ?
          <div className="bg-white rounded-xl border border-[#e8eef5] p-16 text-center">
                <Receipt size={40} className="text-[#e2e8f0] mx-auto mb-3" />
                <p className="text-[#94a3b8] text-[14px]">No reimbursement entitlements found.</p>
              </div> :

          entitlements.map((item, idx) =>
          <EntitlementCard key={item.title} item={item} color={ENTITLEMENT_COLORS[idx % ENTITLEMENT_COLORS.length]} />
          )
          }
          </div>
        }

        {}
        {activeTab === "claims" &&
        <div className="bg-white rounded-xl border border-[#e8eef5] overflow-hidden">
            {HISTORY.length === 0 ?
          <div className="p-16 text-center">
                <FileText size={40} className="text-[#e2e8f0] mx-auto mb-3" />
                <p className="text-[#94a3b8] text-[14px]">No claims submitted yet.</p>
              </div> :

          <>
                {}
                <div className="grid grid-cols-4 px-5 py-3 bg-[#f8fafc] border-b border-[#e8eef5] text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
                  <span>Type</span>
                  <span>Date</span>
                  <span>Amount</span>
                  <span>Status</span>
                </div>

                {}
                {HISTORY.map((c, i) =>
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
            )}

                {}
                <div className="px-5 py-3 bg-[#f8fafc] border-t border-[#e8eef5] flex items-center gap-6 text-[12px]">
                  <span className="text-[#64748b]">Total Claimed: <strong className="text-[#1f2937]">{fmt(HISTORY.reduce((a, c) => a + c.amount, 0))}</strong></span>
                  <span className="text-[#64748b]">Approved: <strong className="text-emerald-600">{fmt(histApproved)}</strong></span>
                  <span className="text-[#64748b]">Pending: <strong className="text-amber-600">{fmt(HISTORY.filter((c) => c.status === "Pending").reduce((a, c) => a + c.amount, 0))}</strong></span>
                </div>
              </>
          }
          </div>
        }
      </div>
    </div>
  );
});

export default Reimbursement;
