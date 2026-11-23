import React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { PerformanceShowcaseContent } from "./PerformanceShowcaseContent";
function ReactPerformanceShowcase() {
  return <ThemeProvider>
      <PerformanceShowcaseContent />
    </ThemeProvider>;
}
export { ReactPerformanceShowcase };
