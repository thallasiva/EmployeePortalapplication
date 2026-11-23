import React, { Profiler, Suspense, useState } from "react";
import ErrorBoundary from "../../../component/ErrorBoundary";
import { LazyInsightsPanel, useTheme } from "./shared";
import { MemoizedSummaryCard } from "./MemoizedSummaryCard";
import { PrimeDemo } from "./PrimeDemo";
import { MemoizedListDemo } from "./MemoizedListDemo";
import { SearchAndThrottleDemo } from "./SearchAndThrottleDemo";
import { VirtualListDemo } from "./VirtualListDemo";
import { ErrorDemo } from "./ErrorDemo";
function PerformanceShowcaseContent() {
  const {
    theme,
    toggleTheme
  } = useTheme();
  const [shouldThrow, setShouldThrow] = useState(false);
  return <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">React performance showcase</p>
              <h1 className="mt-2 text-3xl font-bold  text-[#e87500]">A practical demo of modern React performance patterns</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-600">
                This page brings together lazy loading, memoization, context, throttling, debouncing, virtualization, profiling, and error handling in one place.
              </p>
            </div>
            <button onClick={toggleTheme} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
              Theme: {theme}
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MemoizedSummaryCard title="Lazy Loading" description="Loads expensive modules on demand" value="On demand" />
          <MemoizedSummaryCard title="Memoization" description="Avoids repeated work in render-heavy UI" value="Cached" />
          <MemoizedSummaryCard title="Data handling" description="Debounce and throttle keep interactions smooth" value="Responsive" />
          <MemoizedSummaryCard title="Reliability" description="Error boundaries preserve the rest of the app" value="Safe" />
        </div>
        <Profiler id="showcase-grid" onRender={(id, phase, actualDuration) => {
        if (process.env.NODE_ENV !== "production") {
          console.info(`[Profiler] ${id} ${phase} in ${actualDuration.toFixed(2)}ms`);
        }
      }}>
          <div className="grid gap-6 xl:grid-cols-2">
            <PrimeDemo />
            <MemoizedListDemo />
          </div>
        </Profiler>
        <SearchAndThrottleDemo />
        <VirtualListDemo />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading lazy section…</div>}>
            <LazyInsightsPanel />
          </Suspense>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-800">Error Boundary</h3>
            <p className="mt-2 text-sm text-slate-600">Use it to isolate failures and preserve the rest of the interface.</p>
            <button onClick={() => setShouldThrow(true)} className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white">
              Trigger demo error
            </button>
            <div className="mt-4">
              <ErrorBoundary>
                <ErrorDemo shouldThrow={shouldThrow} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-800">Where to use each tool</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-800">Context API</p>
              <p className="mt-2 text-sm text-slate-600">Best for small shared state such as theme and auth.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-800">Redux Toolkit</p>
              <p className="mt-2 text-sm text-slate-600">Best for large, predictable global state in enterprise apps.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-800">TanStack Query</p>
              <p className="mt-2 text-sm text-slate-600">Best for server data, caching, refetching, and mutations.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-800">React Profiler</p>
              <p className="mt-2 text-sm text-slate-600">Best for measuring where render time is going.</p>
            </div>
          </div>
        </div>
      </div>
    </div>;
}
export { PerformanceShowcaseContent };
