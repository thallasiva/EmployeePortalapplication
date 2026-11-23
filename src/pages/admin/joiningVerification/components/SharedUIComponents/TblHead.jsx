import React from "react";
const TblHead = React.memo(function TblHead({
  cols
}) {
  return <thead>
      <tr className="bg-amber-50">
        {cols.map(c => <th key={c} className="px-3 py-2 text-left text-[10px] font-bold text-amber-800 uppercase tracking-wide border-b border-amber-100">
            {c}
          </th>)}
      </tr>
    </thead>;
});
export { TblHead };
