import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { useSelfAppraisal } from "./hooks/useSelfAppraisal";
import ToastNotification from "./components/ToastNotification";
import AppraisalHeader from "./components/AppraisalHeader";
import StatusBanner from "./components/StatusBanner";
import AppraisalProgress from "./components/AppraisalProgress";
import ParamCard from "./components/ParamCard";
import OverallComments from "./components/OverallComments";
import ManagerFeedback from "./components/ManagerFeedback";
import FormActions from "./components/FormActions";
import GoalsEditor from "./components/GoalsEditor";
import { NoActiveAppraisal, NotEnrolled } from "./components/EmptyStates";
export default function SelfAppraisal() {
  const {
    loading, saving, cycle, appraisal, params, ratings, rawRatings, goals, setGoals,
    overall, setOverall, toast, enrolled, error,
    isEditable, isShared, isActive, rated, allRated, avgRating,
    handleSave, handleAcknowledge, updateRating,
  } = useSelfAppraisal();
  if (loading) {
    return (
      <div className={cssClass({ padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 14 })}>
        Loading…
      </div>
    );
  }
  if (!cycle || (!isActive && !appraisal)) return <NoActiveAppraisal />;
  if (!enrolled) return <NotEnrolled cycle={cycle} />;
  return (
    <div className={cssClass({ margin: "0 auto", padding: "24px 16px" })}>
      <ToastNotification toast={toast} />
      {error && <div role="alert" className={cssClass({ marginBottom: 12, padding: "10px 14px", borderRadius: 8, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca" })}>{error}</div>}
      <AppraisalHeader cycle={cycle} />
      <StatusBanner appraisal={appraisal} params={params} cycle={cycle} />
      <AppraisalProgress rated={rated} total={params.length} avgRating={avgRating} />
      <GoalsEditor goals={goals} onChange={setGoals} disabled={!isEditable} />
      {params.map((p, i) => (
        <ParamCard
          key={p.key}
          param={p}
          idx={i + 1}
          rating={ratings[p.key] || { self_rating: 0, self_comments: "" }}
          onChange={(r) => updateRating(p.key, r)}
          disabled={!isEditable}
        />
      ))}
      <OverallComments value={overall} onChange={setOverall} disabled={!isEditable} />
      {appraisal && (
        <ManagerFeedback ratings={rawRatings} params={params} appraisal={appraisal} />
      )}
      {isEditable && (
        <FormActions
          saving={saving}
          allRated={allRated}
          onSaveDraft={() => handleSave(false)}
          onSubmit={() => handleSave(true)}
          canSubmit={allRated && goals.length > 0 && goals.every((goal) => goal.title.trim())}
        />
      )}
      {isShared && (
        <div className={cssClass({ display: "flex", justifyContent: "flex-end", marginTop: 16 })}>
          <button type="button" onClick={handleAcknowledge} disabled={saving}
            className={cssClass({ padding: "10px 18px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: saving ? "wait" : "pointer", fontWeight: 700 })}>
            {saving ? "Saving…" : "Acknowledge review"}
          </button>
        </div>
      )}
    </div>
  );
}
