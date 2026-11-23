import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ROLE_RECRUITER_LEAD } from "../../../../data/auth";
import { getErrorMessage } from "../../../../api/client";
import { listKudos } from "../../../../api/kudosFeedback.api";
import { timeAgo } from ".././kudosFeedbackShared";
const PAGE_SIZE = 20;
// role 4 is "HR Manager" in the roles table (the web constant predates the rename)
// role 4 is "HR Manager" in the roles table (the web constant predates the rename)
const ROLE_HR_MANAGER = ROLE_RECRUITER_LEAD;
function useKudosList(params) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(params);
  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await listKudos({
        ...JSON.parse(key),
        page,
        limit: PAGE_SIZE
      });
      setRows(prev => page === 1 ? res.data : [...prev, ...res.data]);
      setMeta(res.meta);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not load kudos"));
    } finally {
      setLoading(false);
    }
  }, [key]);
  useEffect(() => {
    load(1);
  }, [load]);
  return {
    rows,
    meta,
    loading,
    reload: () => load(1),
    loadMore: () => load((meta?.page || 1) + 1)
  };
}
const lastRecognisedBadge = value => {
  if (!value) return {
    text: "Never",
    cls: "bg-rose-50 text-rose-700"
  };
  const days = (Date.now() - new Date(String(value).replace(" ", "T")).getTime()) / 86400000;
  if (days > 60) return {
    text: timeAgo(value),
    cls: "bg-rose-50 text-rose-700"
  };
  if (days > 30) return {
    text: timeAgo(value),
    cls: "bg-orange-50 text-orange-700"
  };
  return {
    text: timeAgo(value),
    cls: "bg-emerald-50 text-emerald-700"
  };
};
export { PAGE_SIZE, ROLE_HR_MANAGER, useKudosList, lastRecognisedBadge };
