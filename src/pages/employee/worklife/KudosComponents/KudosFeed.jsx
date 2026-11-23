import React from "react";
import { KudosItem, Loading, SecondaryButton } from ".././kudosFeedbackShared";
import { useKudosList } from "./shared";
const KudosFeed = ({
  params,
  perspective,
  empty
}) => {
  const {
    rows,
    meta,
    loading,
    loadMore
  } = useKudosList(params);
  if (loading && rows.length === 0) return <Loading />;
  if (rows.length === 0) return empty;
  return <div className="space-y-3">
      {rows.map(k => <KudosItem key={k.kudos_id} k={k} perspective={perspective} />)}
      {meta && meta.page < meta.totalPages && <div className="flex justify-center pt-2">
          <SecondaryButton onClick={loadMore} disabled={loading}>Load more</SecondaryButton>
        </div>}
    </div>;
};
export { KudosFeed };
