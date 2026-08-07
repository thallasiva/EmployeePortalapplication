import React, {
  Profiler,
  Suspense,
  lazy,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ErrorBoundary from "../../component/ErrorBoundary";

const LazyInsightsPanel = lazy(() => import("./LazyInsightsPanel"));
const ThemeContext = React.createContext(null);

function ThemeProvider({ children })
{
  const [theme, setTheme] = useState("light");
  const toggleTheme = useCallback(() =>
  {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useTheme()
{
  const context = useContext(ThemeContext);
  if (!context)
  {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

function useDebounce(value, delay)
{
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() =>
  {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function useThrottle(value, delay)
{
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRun = useRef(0);

  useEffect(() =>
  {
    const now = Date.now();
    if (now - lastRun.current >= delay)
    {
      lastRun.current = now;
      setThrottledValue(value);
    }
  }, [value, delay]);

  return throttledValue;
}

function calculatePrimes(limit)
{
  const primes = [];
  for (let number = 2; number <= limit; number += 1)
  {
    let isPrime = true;
    for (let factor = 2; factor * factor <= number; factor += 1)
    {
      if (number % factor === 0)
      {
        isPrime = false;
        break;
      }
    }
    if (isPrime)
    {
      primes.push(number);
    }
  }
  return primes;
}

const MemoizedSummaryCard = memo(function MemoizedSummaryCard({ title, description, value })
{
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <p className="mt-3 text-xl font-bold text-orange-500">{value}</p>
    </div>
  );
});

function PrimeDemo()
{
  const [limit, setLimit] = useState(180);
  const primes = useMemo(() => calculatePrimes(limit), [limit]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">useMemo</h3>
          <p className="text-sm text-slate-600">Expensive prime calculations stay cached until the limit changes.</p>
        </div>
        <input
          type="range"
          min="100"
          max="250"
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value))}
          className="w-40"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {primes.slice(0, 20).map((prime) => (
          <span key={prime} className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
            {prime}
          </span>
        ))}
      </div>
    </div>
  );
}

function MemoizedListDemo()
{
  const [selectedItem, setSelectedItem] = useState("Alpha");
  const handleSelect = useCallback((value) => setSelectedItem(value), []);

  const items = useMemo(
    () => ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"],
    []
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-800">React.memo + useCallback</h3>
      <p className="mb-4 text-sm text-slate-600">Memoized child rows avoid repeated rendering when the selected item changes.</p>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <MemoizedSummaryCard
            key={item}
            title={item}
            description="Stable callback keeps updates targeted"
            value={selectedItem === item ? "Selected" : "Idle"}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => handleSelect(item)}
            className="rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-700 transition hover:border-orange-400 hover:text-orange-600"
          >
            Select {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchAndThrottleDemo()
{
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(0);
  const debouncedQuery = useDebounce(query, 400);
  const throttledCount = useThrottle(count, 700);

  useEffect(() =>
  {
    setCount((prev) => prev + 1);
  }, [debouncedQuery]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-800">Debounce</h3>
        <p className="mb-3 text-sm text-slate-600">The search value waits briefly before updating the preview.</p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <p className="mt-3 text-sm text-slate-700">Live input: {query || "—"}</p>
        <p className="text-sm text-slate-700">Debounced output: {debouncedQuery || "—"}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-slate-800">Throttle</h3>
        <p className="mb-3 text-sm text-slate-600">Actions are limited so the UI remains responsive under rapid events.</p>
        <button
          onClick={() => setCount((prev) => prev + 1)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Trigger event
        </button>
        <p className="mt-3 text-sm text-slate-700">Recent updates: {throttledCount}</p>
      </div>
    </div>
  );
}

function VirtualListDemo()
{
  const items = useMemo(
    () => Array.from({ length: 5000 }, (_, index) => `Row ${index + 1}`),
    []
  );
  const [scrollTop, setScrollTop] = useState(0);
  const rowHeight = 36;
  const viewportHeight = 280;

  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(items.length, startIndex + Math.ceil(viewportHeight / rowHeight) + 4);
  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-800">Virtualization</h3>
      <p className="mb-3 text-sm text-slate-600">Only the visible rows render, which keeps large lists smooth.</p>
      <div
        className="overflow-auto rounded-xl border border-slate-200"
        style={{ height: viewportHeight }}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <div style={{ height: items.length * rowHeight, position: "relative" }}>
          <div style={{ transform: `translateY(${startIndex * rowHeight}px)` }}>
            {visibleItems.map((item, index) => (
              <div
                key={`${item}-${startIndex + index}`}
                className="flex h-9 items-center border-b border-slate-100 px-3 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorDemo({ shouldThrow })
{
  if (shouldThrow)
  {
    throw new Error("This demo intentionally triggered an error");
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
      The error boundary is ready. Click the button to see a controlled fallback.
    </div>
  );
}

function PerformanceShowcaseContent()
{
  const { theme, toggleTheme } = useTheme();
  const [shouldThrow, setShouldThrow] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">React performance showcase</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">A practical demo of modern React performance patterns</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-600">
                This page brings together lazy loading, memoization, context, throttling, debouncing, virtualization, profiling, and error handling in one place.
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
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

        <Profiler
          id="showcase-grid"
          onRender={(id, phase, actualDuration) =>
          {
            if (process.env.NODE_ENV !== "production")
            {
              console.info(`[Profiler] ${id} ${phase} in ${actualDuration.toFixed(2)}ms`);
            }
          }}
        >
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
            <button
              onClick={() => setShouldThrow(true)}
              className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white"
            >
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
    </div>
  );
}

export default function ReactPerformanceShowcase()
{
  return (
    <ThemeProvider>
      <PerformanceShowcaseContent />
    </ThemeProvider>
  );
}
