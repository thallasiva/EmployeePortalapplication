import React from "react";
function BrandPanel() {
  return <section className="relative flex min-h-[260px] w-full flex-col items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#0f1f3d_0%,#162848_50%,#1e3460_100%)] px-8 py-10 text-white lg:min-h-full lg:w-[45%] lg:self-stretch">
      <span aria-hidden="true" className="pointer-events-none absolute -right-[60px] -top-[60px] h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(232,117,0,0.25)_0%,transparent_70%)]" />
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-[50px] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(232,117,0,0.15)_0%,transparent_70%)]" />
      <span aria-hidden="true" className="pointer-events-none absolute -left-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-orange-500/20" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-20 right-[30px] h-[60px] w-[60px] rounded-full border border-white/10" />
      <span aria-hidden="true" className="pointer-events-none absolute left-10 top-[60px] h-[30px] w-[30px] rounded-full bg-orange-500/25" />
      <div className="relative z-10 flex h-[120px] w-[120px] items-center justify-center rounded-[20px] bg-white px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]">
        <span aria-hidden="true" className="absolute bottom-0 left-1/5 right-1/5 h-[3px] rounded bg-orange-500" />
        <span className="text-3xl font-black tracking-tight  text-[#e87500]">HRMS</span>
      </div>
      <div className="relative z-10 mt-7 text-center">
        <h1 className="m-0 text-[1.65rem] font-bold tracking-[-0.01em] text-white">People, in one place.</h1>
        <div className="mx-auto my-3 h-[3px] w-10 rounded bg-gradient-to-r from-orange-500 to-orange-700" />
        <p className="m-0 text-[0.8rem] font-medium uppercase tracking-[0.08em] text-white/65">Human Resources Portal</p>
      </div>
      <p className="absolute bottom-6 left-0 right-0 z-10 m-0 text-center text-[0.72rem] text-white/35">
        © {new Date().getFullYear()} HRMS
      </p>
    </section>;
}
export { BrandPanel };
