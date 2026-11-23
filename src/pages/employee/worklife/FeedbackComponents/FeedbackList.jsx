import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { MessageSquare } from "lucide-react";
import { getErrorMessage } from "../../../../api/client";
import { listFeedback } from "../../../../api/kudosFeedback.api";
import { EmptyState, FEEDBACK_TYPES, Loading, SecondaryButton, TYPE_STYLE } from ".././kudosFeedbackShared";
// role 4 is "HR Manager" in the roles table (the web constant predates the rename)
import { FeedbackItem } from "./FeedbackItem";
const FeedbackList = ({
  scope,
  perspective,
  emptyAction
}) => {
  const [type, setType] = useState("");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await listFeedback({
        scope,
        type: type || undefined,
        page,
        limit: 20
      });
      setRows(prev => page === 1 ? res.data : [...prev, ...res.data]);
      setMeta(res.meta);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not load feedback"));
    } finally {
      setLoading(false);
    }
  }, [scope, type]);
  useEffect(() => {
    load(1);
  }, [load]);
  return <div>
      <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Filter by type">
        {["", ...FEEDBACK_TYPES].map(t => <button key={t || "all"} onClick={() => setType(t)} aria-pressed={type === t} className={`h-8 px-3 rounded-full text-xs font-bold transition-colors ${type === t ? "bg-slate-900 text-white" : t ? TYPE_STYLE[t].badge : "bg-slate-100 text-slate-600"}`}>
            {t || "All"}
          </button>)}
      </div>
      {loading && rows.length === 0 ? <Loading /> : rows.length === 0 ? <EmptyState icon={<MessageSquare className="text-[#e87500]" />} title={type ? `No ${type.toLowerCase()} feedback` : "Nothing here yet"} text={perspective === "received" ? "Ask your teammates for feedback to grow faster." : undefined} action={emptyAction} /> : <>
          {rows.map(f => <FeedbackItem key={f.feedback_id} f={f} perspective={perspective} />)}
          {meta && meta.page < meta.totalPages && <div className="flex justify-center pt-3">
              <SecondaryButton onClick={() => load(meta.page + 1)} disabled={loading}>Load more</SecondaryButton>
            </div>}
        </>}
    </div>;
};
export { FeedbackList };
