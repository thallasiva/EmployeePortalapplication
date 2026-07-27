import React, { useState, useCallback } from "react";
import { LogOut } from "lucide-react";
import apiClient from "../../../../api/client";
import { cssClass } from "../../../../utils/classStyles";
import { JUMP_LINKS } from "./constants";
import { useMyInfoData } from "./hooks/useMyInfoData";
import MyInfoSidebar    from "./components/MyInfoSidebar";
import PersonalSection  from "./components/PersonalSection";
import StatutorySection from "./components/StatutorySection";
import EmploymentSection from "./components/EmploymentSection";
import AssetsSection    from "./components/AssetsSection";
import ResignModal      from "./components/ResignModal";

export default function MyInfo() {
  const { profile, resignation, setResignation, loading, error } = useMyInfoData();

  const [activeSection, setActive]    = useState("personal");
  const [revealed,      setRevealed]  = useState({});
  const [showModal,     setShowModal] = useState(false);
  const [saving,        setSaving]    = useState(false);
  const [withdrawing,   setWithdrawing] = useState(false);

  const toggle = useCallback((key) => setRevealed((r) => ({ ...r, [key]: !r[key] })), []);

  const handleResign = useCallback(async (body) => {
    setSaving(true);
    try {
      const res = await apiClient.post("/resignations/my", body);
      setResignation(res.data);
      setShowModal(false);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to submit resignation");
    }
    setSaving(false);
  }, [setResignation]);

  const handleWithdraw = useCallback(async () => {
    if (!window.confirm("Are you sure you want to withdraw your resignation?")) return;
    setWithdrawing(true);
    try {
      const res = await apiClient.put("/resignations/my/withdraw");
      setResignation(res.data);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to withdraw");
    }
    setWithdrawing(false);
  }, [setResignation]);

  const scrollTo = useCallback((id) => {
    setActive(id);
    document.getElementById("section-" + id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (loading) {
    return (
      <div className={cssClass({ display: "flex", justifyContent: "center", alignItems: "center", height: 300 })}>
        <div className={cssClass({ color: "#f18200", fontSize: 14 })}>Loading…</div>
      </div>
    );
  }

  if (error) {
    return <div className={cssClass({ padding: 40, color: "#ef4444", textAlign: "center" })}>{error}</div>;
  }

  const e         = profile || {};
  const ci        = e.contactInfo || {};
  const bd        = e.bankDetails || {};
  const canResign = !resignation || ["rejected", "withdrawn"].includes(resignation?.status);

  const resignBtn = canResign ? (
    <button onClick={() => setShowModal(true)} className={cssClass({ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#dc2626", fontWeight: 700, fontSize: 12, cursor: "pointer" })}>
      <LogOut size={13} /> Resign
    </button>
  ) : null;

  return (
    <div className={cssClass({ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "inherit" })}>
      <MyInfoSidebar activeSection={activeSection} onSelect={scrollTo} />

      <div className={cssClass({ flex: 1, padding: "20px 28px", overflowY: "auto", maxWidth: 1100 })}>
        {/* Jump links */}
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, fontSize: 12, color: "#94a3b8" })}>
          <span className={cssClass({ fontWeight: 600 })}>JUMP TO</span>
          {(JUMP_LINKS[activeSection] || []).map((lbl) => (
            <button key={lbl} onClick={() => {
              const el = document.getElementById("card-" + lbl.toLowerCase().replace(/ /g, "-"));
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }} className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#f18200", fontWeight: 600, fontSize: 12 })}>
              {lbl}
            </button>
          ))}
        </div>

        <PersonalSection  e={e} ci={ci}   revealed={revealed} toggle={toggle} />
        <StatutorySection e={e} bd={bd}   revealed={revealed} toggle={toggle} />

        {/* Family */}
        <div id="section-family" className={cssClass({ marginTop: 8 })}>
          <p className={cssClass({ color: "#94a3b8", fontSize: 13, padding: "12px 0" })}>
            No family members added yet. Contact HR to update family details.
          </p>
        </div>

        <EmploymentSection
          e={e}
          resignation={resignation}
          resignBtn={resignBtn}
          onWithdraw={handleWithdraw}
          withdrawing={withdrawing}
        />
        <AssetsSection e={e} />
      </div>

      {showModal && (
        <ResignModal onClose={() => setShowModal(false)} onSubmit={handleResign} saving={saving} />
      )}
    </div>
  );
}
