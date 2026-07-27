import React, { useState, useEffect, useCallback } from "react";
import { LogOut, Clock, XCircle } from "lucide-react";
import apiClient from "../../../../api/client";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "./constants";
import { useResignationData } from "./hooks/useResignationData";
import ResignationTabs    from "./components/ResignationTabs";
import ApplyForm          from "./components/ApplyForm";
import ResignCard         from "./components/ResignCard";
import LeavingIllustration from "./components/LeavingIllustration";

const EmptyState = React.memo(function EmptyState({ icon: Icon, text }) {
  return (
    <div className={cssClass({ textAlign: "center", padding: "64px 0", color: "#94a3b8" })}>
      <div className={cssClass({ width: 64, height: 64, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" })}>
        <Icon size={28} color="#cbd5e1" />
      </div>
      <p className={cssClass({ margin: 0, fontSize: 14, color: "#64748b" })}>{text}</p>
    </div>
  );
});

export default function Resignation() {
  const { resignations, profile, loading, reload } = useResignationData();

  const [tab,       setTab]       = useState("apply");
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [apiError,  setApiError]  = useState(null);

  const pending = resignations.filter((r) => r.status === "pending");
  const history = resignations.filter((r) => r.status !== "pending");

  // Auto-switch to pending tab when there are pending resignations
  useEffect(() => {
    if (pending.length > 0 && tab === "apply" && !showForm) setTab("pending");
  }, [pending.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async (fields, file) => {
    setSaving(true);
    setApiError(null);
    try {
      if (file) {
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => { if (v) fd.append(k, String(v)); });
        fd.append("file", file);
        await apiClient.post("/resignations/my", fd, {
          transformRequest: [(data, headers) => { delete headers["Content-Type"]; return data; }],
        });
      } else {
        await apiClient.post("/resignations/my", fields);
      }
      await reload();
      setShowForm(false);
      setTab("pending");
    } catch (e) {
      setApiError(e?.response?.data?.message || "Failed to submit resignation. Please try again.");
    }
    setSaving(false);
  }, [reload]);

  const handleWithdraw = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to withdraw your resignation?")) return;
    setWithdrawing(true);
    try {
      await apiClient.put(`/resignations/my/${id}/withdraw`);
      await reload();
      setTab("history");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to withdraw");
    }
    setWithdrawing(false);
  }, [reload]);

  const changeTab = useCallback((k) => { setTab(k); setShowForm(false); setApiError(null); }, []);

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f5f7fb", padding: "28px 24px", fontFamily: "inherit" })}>
      {/* Header */}
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 })}>
        <div className={cssClass({ width: 38, height: 38, borderRadius: 10, background: `${BRAND}15`, display: "flex", alignItems: "center", justifyContent: "center" })}>
          <LogOut size={18} color={BRAND} />
        </div>
        <div>
          <h1 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e293b" })}>Resignation</h1>
          <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8" })}>Manage your exit request</p>
        </div>
      </div>

      <ResignationTabs active={tab} onChange={changeTab} pendingCount={pending.length} />

      {loading ? (
        <div className={cssClass({ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 })}>Loading…</div>
      ) : (
        <>
          {tab === "apply" && (
            showForm ? (
              <ApplyForm
                profile={profile}
                onSubmit={handleSubmit}
                saving={saving}
                onCancel={() => { setShowForm(false); setApiError(null); }}
                apiError={apiError}
              />
            ) : (
              <div className={cssClass({ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 14 })}>
                <LeavingIllustration />
                <p className={cssClass({ fontSize: 20, fontWeight: 800, color: "#1e293b", margin: 0 })}>It's sad to see you go.</p>
                <p className={cssClass({ fontSize: 13, color: "#94a3b8", margin: 0, textAlign: "center", maxWidth: 340 })}>
                  If you've made up your mind, you can proceed with your resignation below.
                </p>
                <button onClick={() => setShowForm(true)} className={cssClass({ marginTop: 8, padding: "12px 36px", borderRadius: 10, background: BRAND, color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(241,130,0,0.4)" })}>
                  Apply for Resignation
                </button>
              </div>
            )
          )}

          {tab === "pending" && (
            pending.length === 0 ? (
              <EmptyState icon={Clock} text="No pending resignation requests." />
            ) : (
              <div className={cssClass({ display: "flex", flexDirection: "column", gap: 20 })}>
                {pending.map((r) => (
                  <ResignCard key={r.resignation_id} data={r} profile={profile} onWithdraw={handleWithdraw} withdrawing={withdrawing} />
                ))}
              </div>
            )
          )}

          {tab === "history" && (
            history.length === 0 ? (
              <EmptyState icon={XCircle} text="No resignation history found." />
            ) : (
              <div className={cssClass({ display: "flex", flexDirection: "column", gap: 20 })}>
                {history.map((r) => (
                  <ResignCard key={r.resignation_id} data={r} profile={profile} isHistory />
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
