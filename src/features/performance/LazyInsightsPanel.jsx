const LazyInsightsPanel = () => (
  <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
    <div className="mb-3 flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
        ⚡
      </span>
      <div>
        <h3 className="text-lg font-semibold text-slate-800">Lazy-loaded insights</h3>
        <p className="text-sm text-slate-600">This panel was fetched only when the showcase opened.</p>
      </div>
    </div>

    <ul className="space-y-2 text-sm text-slate-700">
      <li>• Code splitting keeps the initial bundle smaller.</li>
      <li>• Suspense shows a friendly fallback during loading.</li>
      <li>• Large route modules load only when needed.</li>
    </ul>
  </div>
);

export default LazyInsightsPanel;
