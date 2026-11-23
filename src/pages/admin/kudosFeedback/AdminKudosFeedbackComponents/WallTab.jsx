import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Award } from "lucide-react";
import { getErrorMessage } from "../../../../api/client";
import { listKudos } from "../../../../api/kudosFeedback.api";
import { EmptyState, KudosItem, Loading, SecondaryButton } from "../../../employee/worklife/kudosFeedbackShared";
const WallTab = () => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await listKudos({
        scope: "wall",
        page,
        limit: 20
      });
      setRows(prev => page === 1 ? res.data : [...prev, ...res.data]);
      setMeta(res.meta);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not load kudos"));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load(1);
  }, [load]);
  if (loading && !rows.length) return <Loading />;
  if (!rows.length) return <EmptyState icon={<Award className="text-[#e87500]" />} title="No kudos yet" />;
  return <div className="space-y-3">
      <p className="text-sm text-slate-500">All kudos across the organisation, including private ones ({meta?.total}).</p>
      {rows.map(k => <KudosItem key={k.kudos_id} k={k} perspective="wall" />)}
      {meta && meta.page < meta.totalPages && <div className="flex justify-center pt-2"><SecondaryButton onClick={() => load(meta.page + 1)} disabled={loading}>Load more</SecondaryButton></div>}
    </div>;
};
export { WallTab };
