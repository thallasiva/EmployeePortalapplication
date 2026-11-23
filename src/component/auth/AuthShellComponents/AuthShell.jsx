import React from "react";
import { BrandPanel } from "./BrandPanel";
function AuthShell({
  children,
  wide = false,
  contentClassName = ""
}) {
  return <div className="relative flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#e8edf5_0%,#d0d9e8_50%,#c8d4e6_100%)] px-4 py-6">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(15,31,61,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className={`relative z-10 flex w-full ${wide ? "max-w-[1080px]" : "max-w-[900px]"} flex-col overflow-hidden rounded-3xl shadow-[0_32px_80px_rgba(15,31,61,0.18),0_8px_24px_rgba(15,31,61,0.1)] lg:min-h-[580px] lg:flex-row`}>
        <BrandPanel />
        <main className="flex flex-1 items-center justify-center bg-white px-6 py-9 sm:px-8 sm:py-10">
          <div className={`w-full ${wide ? "max-w-[760px]" : "max-w-[380px]"} ${contentClassName}`}>{children}</div>
        </main>
      </div>
    </div>;
}
export { AuthShell };
