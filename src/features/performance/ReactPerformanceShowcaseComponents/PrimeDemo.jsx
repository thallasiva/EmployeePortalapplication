import React, { useMemo, useState } from "react";
import { calculatePrimes } from "./shared";
function PrimeDemo() {
  const [limit, setLimit] = useState(180);
  const primes = useMemo(() => calculatePrimes(limit), [limit]);
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">useMemo</h3>
          <p className="text-sm text-slate-600">Expensive prime calculations stay cached until the limit changes.</p>
        </div>
        <input type="range" min="100" max="250" value={limit} onChange={event => setLimit(Number(event.target.value))} className="w-40" />
      </div>
      <div className="flex flex-wrap gap-2">
        {primes.slice(0, 20).map(prime => <span key={prime} className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
            {prime}
          </span>)}
      </div>
    </div>;
}
export { PrimeDemo };
