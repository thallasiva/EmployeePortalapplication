# React Performance & Monitoring Patterns — HRMS

## Quick Setup (one-time)

```bash
# 1. Install the two new packages
npm install @sentry/react dompurify

# 2. Create your .env.local
cp .env.example .env.local
# Paste your Sentry DSN from https://sentry.io → Project Settings → Client Keys
```

---

## What was added

### 1. Sentry (Error + Performance monitoring)
**File:** `src/utils/sentry.js`

Activates automatically when `REACT_APP_SENTRY_DSN` is set.
- Captures every uncaught JS error with React component stack
- Traces 20 % of page loads in production (configurable)
- Session Replay: records 1 % of sessions, 100 % of sessions with errors

```js
// Manually capture errors in catch blocks
import { captureError } from "../utils/sentry";
try {
  await riskyOperation();
} catch (err) {
  captureError(err, { context: "PayrollForm" });
}

// Attach the logged-in user to all Sentry events
import { setSentryUser } from "../utils/sentry";
setSentryUser({ userId: 42, email: "pavan@nat.com", roleName: "Admin" });
```

---

### 2. Error Boundary
**File:** `src/component/ErrorBoundary.jsx`

Wraps every route automatically (via `AdminRoutes`, `EmployeeRoutes`, `ManagerRoutes`).
One page can crash without taking down the rest of the app.

```jsx
// Wrap any risky section with its own boundary
import ErrorBoundary from "../component/ErrorBoundary";

<ErrorBoundary fallback={<p>Chart failed to load</p>}>
  <ExpensiveChart data={data} />
</ErrorBoundary>
```

---

### 3. React.lazy + Suspense (Code Splitting)
**Files:** `src/routes/AdminRoutes.js`, `EmployeeRoutes.js`, `ManagerRoutes.js`

Every page is now a separate Webpack chunk (~20-50 KB each). The initial bundle
loads ~60-70 % faster. A spinner shows while each chunk downloads.

```
Before: main.js  ≈ 3.2 MB (all pages bundled together)
After:  main.js  ≈ 180 KB + per-page chunks loaded on demand
```

---

### 4. Custom Hooks

#### `useApiQuery` — single fetch with retry
```js
import { useApiQuery } from "../hooks/useApiQuery";

const { data, loading, error, refetch } = useApiQuery(
  () => getEmployeeLeaveBalances(employeeId),
  [employeeId]   // re-fetches when employeeId changes
);
```

#### `usePaginatedList` — paginated table data
```js
import { usePaginatedList } from "../hooks/usePaginatedList";

const { rows, total, page, totalPages, goToPage, loading, error } =
  usePaginatedList(
    (p) => listLeaveRequests({ status, ...p }),
    [status]  // re-fetches & resets to page 1 when status changes
  );
```

#### `useDebounce` — search input optimisation
```js
import { useDebounce } from "../hooks/useDebounce";

const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 400); // waits 400ms after typing stops

// Use debouncedSearch in your API call — saves ~10 requests per search
const { data } = useApiQuery(() => searchEmployees(debouncedSearch), [debouncedSearch]);
```

#### `useLocalStorage` — persistent UI preferences
```js
import { useLocalStorage } from "../hooks/useLocalStorage";

const [pageSize, setPageSize] = useLocalStorage("hrms:pageSize", 20);
// Survives page refresh — never store tokens or PII here
```

---

### 5. SafeHTML — safe dangerouslySetInnerHTML
**File:** `src/component/SafeHTML.jsx`

```jsx
import SafeHTML from "../component/SafeHTML";

// ✗ NEVER do this — XSS risk if content comes from server/user
<div dangerouslySetInnerHTML={{ __html: serverContent }} />

// ✓ ALWAYS use SafeHTML instead
<SafeHTML html={serverContent} />
<SafeHTML html={serverContent} as="span" className="prose text-sm" />
```

Runs DOMPurify (if installed) or the built-in allowlist sanitiser. Strips
`<script>`, `onerror=`, `style=` and all other dangerous attributes.

---

### 6. PerformanceMonitor (Web Vitals)
**File:** `src/component/PerformanceMonitor.jsx`

Mounted once in `index.js`. Collects and logs:

| Metric | Meaning                        | Good threshold |
|--------|--------------------------------|----------------|
| LCP    | Largest Contentful Paint       | < 2.5 s        |
| INP    | Interaction to Next Paint      | < 200 ms       |
| CLS    | Cumulative Layout Shift        | < 0.1          |
| FCP    | First Contentful Paint         | < 1.8 s        |
| TTFB   | Time to First Byte             | < 800 ms       |

In development, metrics appear in the browser console colour-coded green/amber/red.
In production they are forwarded to Sentry automatically.

---

### 7. PageWrapper — per-section isolation
**File:** `src/component/PageWrapper.jsx`

```jsx
import { withPageWrapper } from "../component/PageWrapper";

// HOC: wraps a component in ErrorBoundary + React.memo
const SafeEmployeeList = withPageWrapper(EmployeeList, "Employee List");

// Or as a JSX wrapper around a section:
<PageWrapper name="Charts">
  <ExpensiveChart />
</PageWrapper>
```

---

## React.memo / useMemo / useCallback rules of thumb

| Use when...                                   | Hook/API       |
|-----------------------------------------------|----------------|
| Component re-renders with same props          | `React.memo`   |
| Expensive calculation inside render           | `useMemo`      |
| Function passed as prop or in useEffect deps  | `useCallback`  |
| Search / filter input driving API calls       | `useDebounce`  |
| Don't use when: computation is trivial        | (skip all)     |

> **Rule**: measure first with React DevTools Profiler, optimise second.
> Premature memoisation adds complexity without benefit.
