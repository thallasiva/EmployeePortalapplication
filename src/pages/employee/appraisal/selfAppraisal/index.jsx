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
import { NoActiveAppraisal, NotEnrolled } from "./components/EmptyStates";

export default function SelfAppraisal() {
  const {
    loading, saving, cycle, appraisal, params, ratings, rawRatings,
    overall, setOverall, toast, enrolled,
    isSubmitted, isActive, rated, allRated, avgRating,
    handleSave, updateRating,
  } = useSelfAppraisal();

  if (loading) {
    return (
      <div className={cssClass({ padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 14 })}>
        Loading…
      </div>
    );
  }

  if (!cycle || !isActive) return <NoActiveAppraisal />;
  if (!enrolled) return <NotEnrolled cycle={cycle} />;

  return (
    <div className={cssClass({ margin: "0 auto", padding: "24px 16px" })}>
      <ToastNotification toast={toast} />
      <AppraisalHeader cycle={cycle} />
      <StatusBanner appraisal={appraisal} params={params} cycle={cycle} />
      <AppraisalProgress rated={rated} total={params.length} avgRating={avgRating} />

      {params.map((p, i) => (
        <ParamCard
          key={p.key}
          param={p}
          idx={i + 1}
          rating={ratings[p.key] || { self_rating: 0, self_comments: "" }}
          onChange={(r) => updateRating(p.key, r)}
          disabled={isSubmitted}
        />
      ))}

      <OverallComments value={overall} onChange={setOverall} disabled={isSubmitted} />

      {isSubmitted && rawRatings.some((r) => r.manager_rating) && (
        <ManagerFeedback ratings={rawRatings} params={params} />
      )}

      {!isSubmitted && (
        <FormActions
          saving={saving}
          allRated={allRated}
          onSaveDraft={() => handleSave(false)}
          onSubmit={() => handleSave(true)}
        />
      )}
    </div>
  );
}
