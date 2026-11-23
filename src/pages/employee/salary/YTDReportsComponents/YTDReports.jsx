import { DataRow } from "./DataRow";
import React, { useEffect, useMemo, useState } from "react";
import { Download, TrendingUp, Wallet, MinusCircle, DollarSign } from "lucide-react";
import { getMyPayslips, getMySalaryStructure } from "../../../../api/payroll.api";
import { buildSalaryBreakdown } from "../../../../utils/salaryBreakdown";
import { FiscalYearPicker } from "../../../../component/YearPicker";
import { getCurrentFiscalYearStart, getFiscalYearRangeLabel, getFiscalMonthColumns } from "../../../../lib/dateUtils";
import InteractivePieChart, { formatINR } from "../../../../component/charts/InteractivePieChart";
import { tblFmt, fmt, MONTH_LABELS, FISCAL_ORDER } from "./shared";
import { StatCard } from "./StatCard";
import { BarChart } from "./BarChart";
import { SectionHeader } from "./SectionHeader";
function YTDReports() {
  const [fiscalYearStart, setFiscalYearStart] = useState(String(getCurrentFiscalYearStart()));
  const [payslips, setPayslips] = useState([]);
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({
    income: true,
    deduction: true,
    days: true,
    blanks: true
  });
  const toggle = key => setExpanded(p => ({
    ...p,
    [key]: !p[key]
  }));
  useEffect(() => {
    Promise.all([getMyPayslips({
      limit: 24
    }).then(r => Array.isArray(r) ? r : r?.data ?? []), getMySalaryStructure().catch(() => null)]).then(([p, s]) => {
      setPayslips(p);
      setStructure(s);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const fiscalMonths = getFiscalMonthColumns(fiscalYearStart);
  const fyLabel = getFiscalYearRangeLabel(fiscalYearStart);
  const monthData = useMemo(() => {
    const fiscalYear = Number(fiscalYearStart);
    return FISCAL_ORDER.map(mIdx => {
      const year = mIdx >= 3 ? fiscalYear : fiscalYear + 1;
      const slip = payslips.find(p => Number(p.month) === mIdx + 1 && Number(p.year) === year);
      if (slip) {
        return {
          label: MONTH_LABELS[mIdx],
          hasData: true,
          basic: Number(slip.basic ?? 0),
          hra: Number(slip.hra ?? 0),
          special: Number(slip.special_allowance ?? 0),
          lta: Number(slip.lta ?? 0),
          telephone: Number(slip.telephone_and_internet ?? 0),
          gross: Number(slip.gross_salary ?? slip.total_earnings ?? 0),
          pf: Number(slip.pf_employee ?? slip.pf ?? 0),
          profTax: Number(slip.professional_tax ?? 200),
          incomeTax: Number(slip.income_tax ?? 0),
          netPay: Number(slip.net_salary ?? slip.net_pay ?? 0),
          workDays: Number(slip.working_days ?? 30),
          daysInMonth: Number(slip.days_in_month ?? 30)
        };
      }
      if (structure?.basic) {
        const b = buildSalaryBreakdown(structure);
        return {
          label: MONTH_LABELS[mIdx],
          hasData: false,
          basic: b.basic,
          hra: b.hra,
          special: b.special,
          lta: b.lta,
          telephone: b.telephone,
          gross: b.gross,
          pf: b.pf,
          profTax: b.profTax,
          incomeTax: 0,
          netPay: b.net,
          workDays: 26,
          daysInMonth: 30
        };
      }
      return {
        label: MONTH_LABELS[mIdx],
        hasData: false,
        basic: 0,
        hra: 0,
        special: 0,
        lta: 0,
        telephone: 0,
        gross: 0,
        pf: 0,
        profTax: 0,
        incomeTax: 0,
        netPay: 0,
        workDays: 0,
        daysInMonth: 0
      };
    });
  }, [payslips, structure, fiscalYearStart]);
  const totals = useMemo(() => {
    const sum = k => monthData.reduce((a, m) => a + (m[k] || 0), 0);
    return {
      basic: sum("basic"),
      hra: sum("hra"),
      special: sum("special"),
      lta: sum("lta"),
      telephone: sum("telephone"),
      gross: sum("gross"),
      pf: sum("pf"),
      profTax: sum("profTax"),
      incomeTax: sum("incomeTax"),
      netPay: sum("netPay"),
      workDays: sum("workDays"),
      daysInMonth: sum("daysInMonth")
    };
  }, [monthData]);
  const totalDeductions = totals.pf + totals.profTax + totals.incomeTax;
  const pieData = [{
    label: "Basic",
    value: totals.basic,
    color: "#e87500"
  }, {
    label: "HRA",
    value: totals.hra,
    color: "#fb923c"
  }, {
    label: "Special",
    value: totals.special,
    color: "#8b5cf6"
  }, {
    label: "LTA",
    value: totals.lta,
    color: "#f59e0b"
  }, {
    label: "Other",
    value: totals.telephone,
    color: "#10b981"
  }].filter(d => d.value > 0);
  const barData = monthData.map(m => ({
    label: m.label,
    value: m.netPay
  }));
  const colCount = fiscalMonths.length + 2;
  if (loading) {
    return <div className="min-h-screen   flex items-center justify-center">
        <p className="text-[#94a3b8] text-[14px]">Loading YTD data…</p>
      </div>;
  }
  /* ── Data row component ── */

  return <div className="min-h-screen  ">
      {/* ── Page Header ── */}
      <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-[#1f2937]">YTD Report</h1>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">{fyLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <FiscalYearPicker value={fiscalYearStart} onChange={setFiscalYearStart} selectClassName="h-[38px] px-3 border border-[#d5dbe3] bg-white rounded-lg text-[13px] outline-none" />
          <button className="flex items-center gap-2 h-[38px] px-5 bg-[#e87500] hover:bg-[#e07000] text-white rounded-lg text-[13px] font-bold transition-colors">
            <Download size={14} /> Download
          </button>
        </div>
      </div>
      {/* ── Summary Stat Cards ── */}
      <div className="px-6 pb-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp size={20} />} label="YTD Gross" value={fmt(totals.gross)} color="#e87500" bgColor="#fff8f0" sub="Total earnings this FY" />
        <StatCard icon={<MinusCircle size={20} />} label="YTD Deductions" value={fmt(totalDeductions)} color="#ef4444" bgColor="#fef2f2" sub={`PF + Prof Tax + TDS`} />
        <StatCard icon={<Wallet size={20} />} label="YTD Net Pay" value={fmt(totals.netPay)} color="#10b981" bgColor="#ecfdf5" sub="Take-home total" />
        <StatCard icon={<DollarSign size={20} />} label="Months Processed" value={monthData.filter(m => m.hasData).length} color="#e87500" bgColor="#f5f3ff" sub={`of 12 in ${fyLabel}`} />
      </div>
      {/* ── YTD Table ── */}
      <div className="px-6 pb-6">
        <div className="bg-white border border-[#e8eef5] rounded-xl overflow-hidden shadow-sm">
          {/* Table header bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e8eef5] bg-white">
            <span className="text-[14px] font-bold text-[#e87500]">Monthly Breakdown</span>
            <span className="text-[12px] text-[#94a3b8]">{fyLabel}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider sticky left-0 bg-[#f8fafc] z-10 min-w-[150px] border-r border-b border-[#e8eef5]">
                    Item
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider sticky bg-[#f8fafc] z-10 min-w-[110px] border-r border-b border-[#e8eef5]" style={{
                  left: 150
                }}>
                    Total (₹)
                  </th>
                  {fiscalMonths.map(col => <th key={col.key} className="px-3 py-3 text-right text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider whitespace-nowrap min-w-[90px] border-b border-[#e8eef5]">
                      {col.label}
                    </th>)}
                </tr>
              </thead>
              <tbody>
                {/* Income */}
                <SectionHeader label="Income" expanded={expanded.income} onToggle={() => toggle("income")} colCount={colCount} />
                {expanded.income && <>
                    <DataRow label="Basic" dataKey="basic" totalVal={totals.basic} monthData={monthData} />
                    <DataRow label="HRA" dataKey="hra" totalVal={totals.hra} monthData={monthData} />
                    <DataRow label="Special Allowance" dataKey="special" totalVal={totals.special} monthData={monthData} />
                    <DataRow label="LTA" dataKey="lta" totalVal={totals.lta} monthData={monthData} />
                    <DataRow label="Telephone & Internet" dataKey="telephone" totalVal={totals.telephone} monthData={monthData} />
                    <DataRow label="Gross Salary" dataKey="gross" totalVal={totals.gross} bold monthData={monthData} />
                  </>}
                {/* Deductions */}
                <SectionHeader label="Deductions" expanded={expanded.deduction} onToggle={() => toggle("deduction")} colCount={colCount} />
                {expanded.deduction && <>
                    <DataRow label="Provident Fund" dataKey="pf" totalVal={totals.pf} monthData={monthData} />
                    <DataRow label="Professional Tax" dataKey="profTax" totalVal={totals.profTax} monthData={monthData} />
                    <DataRow label="Income Tax (TDS)" dataKey="incomeTax" totalVal={totals.incomeTax} monthData={monthData} />
                    {/* Total deductions summary row */}
                    <tr className="bg-[#f1f5f9] border-b border-[#e2e8f0]">
                      <td className="px-4 py-2 font-bold text-[12px] text-[#1e293b] sticky left-0 bg-[#f1f5f9] border-r border-[#e2e8f0]" style={{
                    paddingLeft: 24
                  }}>
                        Total Deductions
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-[12px] text-[#1e293b] sticky bg-[#f1f5f9] border-r border-[#e2e8f0]" style={{
                    left: 150
                  }}>
                        {tblFmt(totalDeductions)}
                      </td>
                      {monthData.map((m, i) => <td key={i} className="px-3 py-2 text-right text-[12px] font-semibold" style={{
                    color: m.pf + m.profTax + m.incomeTax > 0 ? "#1e293b" : "#94a3b8"
                  }}>
                          {tblFmt((m.pf || 0) + (m.profTax || 0) + (m.incomeTax || 0))}
                        </td>)}
                    </tr>
                  </>}
                {/* Days */}
                <SectionHeader label="Days" expanded={expanded.days} onToggle={() => toggle("days")} colCount={colCount} />
                {expanded.days && <>
                    <DataRow label="Effective Work Days" dataKey="workDays" totalVal={totals.workDays} monthData={monthData} />
                    <DataRow label="Days in Month" dataKey="daysInMonth" totalVal={totals.daysInMonth} bold monthData={monthData} />
                  </>}
                {/* Net Pay */}
                <SectionHeader label="Net Pay" expanded={expanded.blanks} onToggle={() => toggle("blanks")} colCount={colCount} />
                {expanded.blanks && <DataRow label="Net Pay (Take-Home)" dataKey="netPay" totalVal={totals.netPay} bold highlight monthData={monthData} />}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* ── Charts ── */}
      <div className="px-6 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Earnings Breakdown */}
        <div className="bg-white border border-[#e8eef5] rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#e8eef5]">
            <p className="text-[13px] font-bold text-[#e87500]">Earnings Breakdown</p>
            <p className="text-[11px] text-[#94a3b8] mt-0.5">YTD component distribution</p>
          </div>
          <div className="p-5 flex items-center gap-6">
            <InteractivePieChart data={pieData} size={150} donut title="Earnings" valueFormatter={formatINR} />
            <div className="flex-1 space-y-1.5">
              {pieData.map(d => <div key={d.label} className="flex items-center justify-between py-1.5 border-b border-[#f8fafc]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{
                  background: d.color
                }} />
                    <span className="text-[12px] text-[#64748b]">{d.label}</span>
                  </div>
                  <span className="text-[12px] font-bold text-[#e87500]">{fmt(d.value)}</span>
                </div>)}
            </div>
          </div>
        </div>
        {/* Monthly Net Pay Trend */}
        <div className="bg-white border border-[#e8eef5] rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#e8eef5]">
            <p className="text-[13px] font-bold text-[#e87500]">Monthly Net Pay Trend</p>
            <p className="text-[11px] text-[#94a3b8] mt-0.5">Take-home pay each month</p>
          </div>
          <div className="p-5">
            <BarChart data={barData} />
          </div>
        </div>
      </div>

      {/* ── Charts (below table) ──────────────────────────────────────────────── */}
      <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16
    }}>
        <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 20
      }}>
          <p style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#1e293b",
          margin: "0 0 16px"
        }}>Earnings Breakdown</p>
          <div style={{
          display: "flex",
          alignItems: "center",
          gap: 20
        }}>
            <InteractivePieChart data={pieData} size={160} donut title="Earnings" valueFormatter={formatINR} />
            <div style={{
            flex: 1
          }}>
              {pieData.map(d => <div key={d.label} style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "5px 0",
              borderBottom: "1px solid #f8fafc"
            }}>
                  <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                    <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: d.color,
                  display: "inline-block"
                }} />
                    <span style={{
                  fontSize: 12,
                  color: "#64748b"
                }}>{d.label}</span>
                  </div>
                  <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#1e293b"
              }}>{fmt(d.value)}</span>
                </div>)}
            </div>
          </div>
        </div>

        <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 20
      }}>
          <p style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#1e293b",
          margin: "0 0 8px"
        }}>Monthly Net Pay Trend</p>
          <BarChart data={barData} />
        </div>
      </div>
    </div>;
}
export { YTDReports };
