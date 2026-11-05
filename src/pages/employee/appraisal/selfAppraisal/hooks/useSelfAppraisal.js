import { useState, useEffect, useCallback, useMemo } from "react";
import { acknowledgeMyAppraisal, getMyAppraisal, saveMyAppraisal } from "../../../../../api/appraisal.api";
export function useSelfAppraisal() {
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [cycle, setCycle]         = useState(null);
  const [appraisal, setAppraisal] = useState(null);
  const [params, setParams]       = useState([]);
  const [ratings, setRatings]     = useState({});
  const [rawRatings, setRawRatings] = useState([]);
  const [overall, setOverall]     = useState("");
  const [toast, setToast]         = useState(null);
  const [enrolled, setEnrolled]   = useState(true);
  const [goals, setGoals] = useState([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const d = await getMyAppraisal();
      setCycle(d.cycle);
      setAppraisal(d.appraisal);
      setEnrolled(d.enrolled !== false);
      setParams(d.parameters || []);
      setRawRatings(d.ratings || []);
      setGoals((d.goals || []).map((goal) => ({
        title: goal.title || "",
        description: goal.description || "",
        success_metrics: goal.success_metrics || "",
        self_progress: goal.self_progress || "",
        evidence_url: goal.evidence_url || "",
      })));
      const map = {};
      (d.parameters || []).forEach((p) => {
        map[p.key] = { self_rating: 0, self_comments: "" };
      });
      (d.ratings || []).forEach((r) => {
        map[r.parameter_key] = {
          self_rating: r.self_rating || 0,
          self_comments: r.self_comments || "",
        };
      });
      setRatings(map);
      setOverall(d.appraisal?.overall_comments || "");
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to load your appraisal.");
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const notify = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  const handleSave = useCallback(
    async (submit = false) => {
      setSaving(true);
      try {
        const ratingsArr = params.map((p) => ({
          parameter_key: p.key,
          parameter_label: p.label,
          ...ratings[p.key],
        }));
        const d = await saveMyAppraisal({
          ratings: ratingsArr,
          goals,
          overall_comments: overall,
          submit,
        });
        setAppraisal(d.appraisal);
        setRawRatings(d.ratings || []);
        setGoals((d.goals || []).map((goal) => ({
          title: goal.title || "",
          description: goal.description || "",
          success_metrics: goal.success_metrics || "",
          self_progress: goal.self_progress || "",
          evidence_url: goal.evidence_url || "",
        })));
        setError("");
        notify(submit ? "Appraisal submitted!" : "Draft saved.");
      } catch (e) {
        const message = e?.response?.data?.message || "Failed to save.";
        setError(message);
        notify(message, "error");
      }
      setSaving(false);
    },
    [params, ratings, goals, overall, notify]
  );
  const handleAcknowledge = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const d = await acknowledgeMyAppraisal(appraisal?.appraisal_id);
      setAppraisal(d.appraisal);
      notify("Review acknowledged.");
    } catch (e) {
      const message = e?.response?.data?.message || "Unable to acknowledge the review.";
      setError(message);
      notify(message, "error");
    } finally {
      setSaving(false);
    }
  }, [appraisal?.appraisal_id, notify]);
  const updateRating = useCallback((key, rating) => {
    setRatings((prev) => ({ ...prev, [key]: rating }));
  }, []);
  const isEditable = cycle?.status === "active" && (!appraisal || ["draft", "changes_requested"].includes(appraisal.status));
  const isSubmitted = !isEditable;
  const isShared = appraisal?.status === "shared";
  const isClosed = appraisal?.status === "closed";
  const isActive    = cycle?.status === "active";
  const rated       = params.filter((p) => (ratings[p.key]?.self_rating || 0) > 0).length;
  const allRated    = rated === params.length && params.length > 0;
  const avgRating = useMemo(
    () =>
      params.length > 0
        ? (
            params.reduce((s, p) => s + (ratings[p.key]?.self_rating || 0), 0) /
            params.length
          ).toFixed(1)
        : 0,
    [params, ratings]
  );
  return {
    loading, saving, cycle, appraisal, params, ratings, rawRatings, goals, setGoals,
    overall, setOverall, toast, enrolled, error, setError,
    isEditable, isSubmitted, isShared, isClosed, isActive, rated, allRated, avgRating,
    handleSave, handleAcknowledge, updateRating,
  };
}
