import { lazy } from "react";
import LazyPage from "./LazyPage";

const ReactPerformanceShowcase = lazy(() => import("../features/performance/ReactPerformanceShowcase"));

export default function PerformanceDemoRoute() {
  return (
    <LazyPage label="Loading performance showcase...">
      <ReactPerformanceShowcase />
    </LazyPage>
  );
}
