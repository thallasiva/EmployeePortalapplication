import React from "react";

function BrandPanel() {
  return (
    <section className="relative flex min-h-[260px] w-full flex-col items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#0f1f3d_0%,#162848_50%,#1e3460_100%)] px-8 py-10 text-white lg:min-h-full lg:w-[45%] lg:self-stretch">
      <span aria-hidden="true" className="pointer-events-none absolute -right-[60px] -top-[60px] h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(241,130,0,0.25)_0%,transparent_70%)]" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-[50px] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(241,130,0,0.15)_0%,transparent_70%)]" />
      <span aria-hidden="true" className="pointer-events-none absolute -left-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-orange-500/20" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-20 right-[30px] h-[60px] w-[60px] rounded-full border border-white/10" />
      <span aria-hidden="true" className="pointer-events-none absolute left-10 top-[60px] h-[30px] w-[30px] rounded-full bg-orange-500/25" />
      <div className="relative z-10 flex h-[120px] w-[120px] items-center justify-center rounded-[20px] bg-white px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]">
        <span aria-hidden="true" className="absolute bottom-0 left-1/5 right-1/5 h-[3px] rounded bg-orange-500" />
        <span className="text-3xl font-black tracking-tight text-slate-900">HRMS</span>
      </div>
      <div className="relative z-10 mt-7 text-center">
        <h1 className="m-0 text-[1.65rem] font-bold tracking-[-0.01em] text-white">People, in one place.</h1>
        <div className="mx-auto my-3 h-[3px] w-10 rounded bg-gradient-to-r from-orange-500 to-orange-700" />
        <p className="m-0 text-[0.8rem] font-medium uppercase tracking-[0.08em] text-white/65">Human Resources Portal</p>
      </div>
      <p className="absolute bottom-6 left-0 right-0 z-10 m-0 text-center text-[0.72rem] text-white/35">
        © {new Date().getFullYear()} HRMS
      </p>
    </section>
  );
}

export default function AuthShell({ children, wide = false, contentClassName = "" }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#e8edf5_0%,#d0d9e8_50%,#c8d4e6_100%)] px-4 py-6">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(15,31,61,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className={`relative z-10 flex w-full ${wide ? "max-w-[1080px]" : "max-w-[900px]"} flex-col overflow-hidden rounded-3xl shadow-[0_32px_80px_rgba(15,31,61,0.18),0_8px_24px_rgba(15,31,61,0.1)] lg:min-h-[580px] lg:flex-row`}>
        <BrandPanel />
        <main className="flex flex-1 items-center justify-center bg-white px-6 py-9 sm:px-8 sm:py-10">
          <div className={`w-full ${wide ? "max-w-[760px]" : "max-w-[380px]"} ${contentClassName}`}>{children}</div>
        </main>
      </div>
    </div>
  );
}
