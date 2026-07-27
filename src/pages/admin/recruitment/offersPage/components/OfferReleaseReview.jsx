import React from "react";
import { fmt, fmtM } from "../utils/ctcUtils";

const OfferReleaseReview = React.memo(function OfferReleaseReview({ form, computed, candidates, checks }) {
  const ctcAnn = Number(form.ctcInput) * 12;
  const varPct = Number(form.variablePct) || 0;
  const varAnn = Math.round(ctcAnn * varPct / 100);
  const joinBonus = Number(form.joiningBonus) || 0;
  const totalCTC = (computed.ctc || 0) + varAnn + joinBonus;
  const candName = (candidates.find((x) => String(x.candidate_id) === String(form.candidateId)) || {}).name || '—';

  const fixedRows = computed._components
    ? computed._components.filter((cp) => cp.category === 'Earning' && cp.show_ctc_breakup !== false)
        .map((cp) => ({ label: cp.component_name, ann: cp.annual_amount }))
    : [
        { label: 'Basic Salary', ann: computed.basic || 0 },
        { label: 'HRA', ann: computed.hra || 0 },
        { label: 'Telephone / Internet Expenses', ann: computed.telephoneAllowance || 0 },
        { label: 'Leave Travel Allowance', ann: computed.leaveTravel || 0 },
        { label: 'Special Allowance', ann: computed.specialAllowance || 0 }
      ];

  const empRows = computed._components
    ? computed._components.filter((cp) => cp.category === 'Employer Contribution' && cp.show_ctc_breakup !== false)
        .map((cp) => ({ label: cp.component_name, ann: cp.annual_amount }))
    : [
        { label: "Company's PF Contribution", ann: computed.pfContribution || 0 },
        { label: 'Statutory Bonus', ann: computed.statutoryBonus || 0 },
        { label: 'Gratuity', ann: computed.gratuity || 0 },
        { label: 'ESI', ann: computed.esi || 0 }
      ];

  const failCount = checks.filter((ck) => ck.status === 'fail').length;
  const warnCount = checks.filter((ck) => ck.status === 'warn').length;

  return (
    <div className="space-y-3 pb-2">
      {/* Offer Summary */}
      <div className="bg-[#1e3a5f] rounded-xl px-4 py-3.5">
        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-2.5">Offer Summary</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {[
            ['Candidate', candName],
            ['Designation', form.designation || '—'],
            ['Date of Joining', form.dateOfJoining || '—'],
            ['Annual CTC', ctcAnn > 0 ? 'Rs.' + ctcAnn.toLocaleString('en-IN') : '—']
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <p className="text-[10px] text-blue-300 uppercase tracking-wider">{lbl}</p>
              <p className="text-[13px] font-semibold text-white">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Pay */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 mb-1 pl-1">&#9679; Fixed Pay (Earnings)</p>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-indigo-700 px-4 py-1.5 grid grid-cols-3">
            <span className="text-[11px] font-semibold text-white">Component</span>
            <span className="text-[10px] text-indigo-200 text-right pr-4">Monthly</span>
            <span className="text-[10px] text-indigo-200 text-right">Annual</span>
          </div>
          {fixedRows.map((row, i) => (
            <div key={i} className="grid grid-cols-3 px-4 py-2 border-b border-gray-50 hover:bg-gray-50">
              <span className="text-[12px] text-gray-600">{row.label}</span>
              <span className="text-[12px] text-gray-800 text-right pr-4">{fmtM(row.ann)}</span>
              <span className="text-[12px] text-gray-800 text-right">{fmt(row.ann)}</span>
            </div>
          ))}
          <div className="grid grid-cols-3 px-4 py-2.5 bg-indigo-50 border-t border-indigo-200">
            <span className="text-[12px] font-bold text-indigo-900">Gross Salary</span>
            <span className="text-[12px] font-bold text-indigo-900 text-right pr-4">{fmtM(computed.grossSalary || 0)}</span>
            <span className="text-[12px] font-bold text-indigo-900 text-right">{fmt(computed.grossSalary || 0)}</span>
          </div>
        </div>
      </div>

      {/* Employer Contributions */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1 pl-1">&#9679; Employer Contributions</p>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-emerald-700 px-4 py-1.5 grid grid-cols-3">
            <span className="text-[11px] font-semibold text-white">Component</span>
            <span className="text-[10px] text-emerald-200 text-right pr-4">Monthly</span>
            <span className="text-[10px] text-emerald-200 text-right">Annual</span>
          </div>
          {empRows.map((row, i) => (
            <div key={i} className="grid grid-cols-3 px-4 py-2 border-b border-gray-50 hover:bg-gray-50">
              <span className="text-[12px] text-gray-600">{row.label}</span>
              <span className="text-[12px] text-gray-800 text-right pr-4">{fmtM(row.ann)}</span>
              <span className="text-[12px] text-gray-800 text-right">{fmt(row.ann)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Variable Pay + One-time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1 pl-1">&#9679; Variable Pay</p>
          <div className={`px-3 py-3 rounded-xl border h-[84px] flex flex-col justify-center ${varPct > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
            {varPct > 0 ? (
              <>
                <p className="text-[11px] text-amber-800 font-semibold">{varPct}% of Annual CTC</p>
                <p className="text-[15px] font-bold text-amber-900 mt-0.5">Rs.{varAnn.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-amber-600">per year</p>
              </>
            ) : (
              <p className="text-[12px] text-gray-400">Not applicable (0%)</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 mb-1 pl-1">&#9679; One-time Payments</p>
          <div className={`px-3 py-3 rounded-xl border h-[84px] flex flex-col justify-center ${joinBonus > 0 ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
            {joinBonus > 0 ? (
              <>
                <p className="text-[11px] text-purple-800 font-semibold">Joining Bonus</p>
                <p className="text-[15px] font-bold text-purple-900 mt-0.5">Rs.{joinBonus.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-purple-600">one-time payment</p>
              </>
            ) : (
              <p className="text-[12px] text-gray-400">No joining bonus</p>
            )}
          </div>
        </div>
      </div>

      {/* CTC Summary */}
      <div className="bg-[#1e3a5f] rounded-xl px-4 py-3">
        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-2">CTC Summary</p>
        <div className="space-y-1">
          <div className="flex justify-between text-[12px] text-blue-200">
            <span>Fixed CTC</span>
            <span className="font-mono">Rs.{(computed.ctc || 0).toLocaleString('en-IN')}</span>
          </div>
          {varAnn > 0 && (
            <div className="flex justify-between text-[12px] text-amber-300">
              <span>+ Variable Pay</span>
              <span className="font-mono">Rs.{varAnn.toLocaleString('en-IN')}</span>
            </div>
          )}
          {joinBonus > 0 && (
            <div className="flex justify-between text-[12px] text-purple-300">
              <span>+ Joining Bonus (one-time)</span>
              <span className="font-mono">Rs.{joinBonus.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between text-[15px] font-bold text-yellow-300 border-t border-blue-600 pt-2 mt-1">
            <span>= TOTAL CTC</span>
            <span className="font-mono">Rs.{totalCTC.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Validation Checks */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Validation Checks</p>
          <div className="flex gap-2.5 text-[11px] font-semibold">
            <span className="text-emerald-600">{checks.filter((ck) => ck.status === 'ok').length} &#10003; Passed</span>
            {warnCount > 0 && <span className="text-amber-500">{warnCount} &#9888; Warning</span>}
            {failCount > 0 && <span className="text-red-600">{failCount} &#10007; Failed</span>}
          </div>
        </div>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {checks.map((ck) => (
            <div key={ck.id}
              className={`flex items-center justify-between px-3 py-2 border-b border-gray-50 last:border-0 text-[12px] ${ck.status === 'fail' ? 'bg-red-50' : ck.status === 'warn' ? 'bg-amber-50' : ''}`}>
              <div className="flex items-center gap-2">
                <span className={ck.status === 'ok' ? 'text-emerald-500 font-bold' : ck.status === 'warn' ? 'text-amber-500 font-bold' : 'text-red-500 font-bold'}>
                  {ck.status === 'ok' ? '✓' : ck.status === 'warn' ? '⚠' : '✗'}
                </span>
                <span className="text-gray-700">{ck.label}</span>
              </div>
              {ck.value ? <span className="text-[11px] text-gray-500 font-mono ml-2 shrink-0">{ck.value}</span> : null}
            </div>
          ))}
        </div>
        {failCount > 0 && (
          <p className="mt-1.5 text-[11px] text-red-600 font-semibold">
            &#10007; {failCount} check{failCount > 1 ? 's' : ''} failed — go back and fix before releasing.
          </p>
        )}
      </div>
    </div>
  );
});

export default OfferReleaseReview;
