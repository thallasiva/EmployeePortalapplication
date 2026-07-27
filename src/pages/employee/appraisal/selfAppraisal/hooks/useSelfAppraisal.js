import { useState, useEffect, useCallback, useMemo } from "react";
import { getMyAppraisal, saveMyAppraisal } from "../../../../../api/appraisal.api";

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getMyAppraisal();
      setCycle(d.cycle);
      setAppraisal(d.appraisal);
      setEnrolled(d.enrolled !== false);
      setParams(d.parameters || []);
      setRawRatings(d.ratings || []);
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
    } catch {}
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
          overall_comments: overall,
          submit,
        });
        setAppraisal(d.appraisal);
        setRawRatings(d.ratings || []);
        notify(submit ? "Appraisal submitted!" : "Draft saved.");
      } catch (e) {
        notify(e?.response?.data?.message || "Failed to save.", "error");
      }
      setSaving(false);
    },
    [params, ratings, overall, notify]
  );

  const updateRating = useCallback((key, rating) => {
    setRatings((prev) => ({ ...prev, [key]: rating }));
  }, []);

  const isSubmitted = appraisal?.status === "submitted";
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
    loading, saving, cycle, appraisal, params, ratings, rawRatings,
    overall, setOverall, toast, enrolled,
    isSubmitted, isActive, rated, allRated, avgRating,
    handleSave, updateRating,
  };
}
