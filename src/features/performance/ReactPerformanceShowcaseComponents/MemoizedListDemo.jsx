import React, { useCallback, useMemo, useState } from "react";
import { MemoizedSummaryCard } from "./MemoizedSummaryCard";
function MemoizedListDemo() {
  const [selectedItem, setSelectedItem] = useState("Alpha");
  const handleSelect = useCallback(value => setSelectedItem(value), []);
  const items = useMemo(() => ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"], []);
  return <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-800">React.memo + useCallback</h3>
      <p className="mb-4 text-sm text-slate-600">Memoized child rows avoid repeated rendering when the selected item changes.</p>
      <div className="flex flex-wrap gap-2">
        {items.map(item => <MemoizedSummaryCard key={item} title={item} description="Stable callback keeps updates targeted" value={selectedItem === item ? "Selected" : "Idle"} />)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map(item => <button key={item} onClick={() => handleSelect(item)} className="rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-700 transition hover:border-orange-400 hover:text-orange-600">
            Select {item}
          </button>)}
      </div>
    </div>;
}
export { MemoizedListDemo };
