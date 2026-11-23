import React, { useEffect, useState } from "react";
import { useDebounce, useThrottle } from "./shared";
function SearchAndThrottleDemo() {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(0);
  const debouncedQuery = useDebounce(query, 400);
  const throttledCount = useThrottle(count, 700);
  useEffect(() => {
    setCount(prev => prev + 1);
  }, [debouncedQuery]);
  return <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-800">Debounce</h3>
        <p className="mb-3 text-sm text-slate-600">The search value waits briefly before updating the preview.</p>
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        <p className="mt-3 text-sm text-slate-700">Live input: {query || "—"}</p>
        <p className="text-sm text-slate-700">Debounced output: {debouncedQuery || "—"}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-800">Throttle</h3>
        <p className="mb-3 text-sm text-slate-600">Actions are limited so the UI remains responsive under rapid events.</p>
        <button onClick={() => setCount(prev => prev + 1)} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
          Trigger event
        </button>
        <p className="mt-3 text-sm text-slate-700">Recent updates: {throttledCount}</p>
      </div>
    </div>;
}
export { SearchAndThrottleDemo };
