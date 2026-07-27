import { useState, useEffect, useMemo } from "react";
import { getMyPayslips, getMySalaryStructure } from "../../../../../api/payroll.api";
import { getCurrentUser } from "../../../../../api/auth.api";
import { buildSalaryBreakdown } from "../../../../../utils/salaryBreakdown";
import { getFiscalMonthColumns } from "../../../../../lib/dateUtils";
import { FISCAL_ORDER, MONTH_LABELS } from "../constants";

export function useITStatementData({ fiscalYearStart }) {
  const [payslips, setPayslips] = useState([]);
  const [structure, setStructure] = useState(null);
  const [empInfo, setEmpInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detectedRegime, setDetectedRegime] = useState(null);

  useEffect(() => {
    Promise.all([
      getMyPayslips({ limit: 24 }).then((r) => Array.isArray(r) ? r : r?.data ?? []),
      getMySalaryStructure().catch(() => null),
      getCurrentUser().catch(() => null),
    ]).then(([p, s, u]) => {
      setPayslips(p);
      setStructure(s);

      const savedRegime = u?.tax_regime || s?.tax_regime;
      if (savedRegime === "old" || savedRegime === "new") setDetectedRegime(savedRegime);

      const latestSlip = Array.isArray(p) ? p[0] : null;
      setEmpInfo({
        name: `${u?.first_name ?? u?.name ?? latestSlip?.first_name ?? ""}${
          u?.last_name ? " " + u.last_name : latestSlip?.last_name ? " " + latestSlip.last_name : ""
        }`.trim() || "—",
        bank: latestSlip?.bank_name || s?.bank_name || u?.bank_name || "—",
        bankAcc: latestSlip?.bank_account_number || s?.bank_account_number || u?.bank_account_number || "—",
        joining:
          latestSlip?.emp_joining_date || u?.emp_joining_date
            ? new Date(latestSlip?.emp_joining_date || u?.emp_joining_date).toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "numeric",
              })
            : "—",
        pfNo: latestSlip?.pf_number || s?.pf_number || u?.pf_number || "—",
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fiscalMonths = useMemo(() => getFiscalMonthColumns(fiscalYearStart), [fiscalYearStart]);

  const monthData = useMemo(() => {
    const fy = Number(fiscalYearStart);
    return FISCAL_ORDER.map((mIdx) => {
      const year = mIdx >= 3 ? fy : fy + 1;
      const slip = payslips.find((p) => Number(p.month) === mIdx + 1 && Number(p.year) === year);
      if (slip) {
        const b = buildSalaryBreakdown(structure, slip);
        return { label: MONTH_LABELS[mIdx], basic: b.basic, hra: b.hra, special: b.special, lta: b.lta, telephone: b.telephone, gross: b.gross, pf: b.pf, profTax: b.profTax, netPay: b.net };
      }
      if (structure?.basic) {
        const b = buildSalaryBreakdown(structure);
        return { label: MONTH_LABELS[mIdx], basic: b.basic, hra: b.hra, special: b.special, lta: b.lta, telephone: b.telephone, gross: b.gross, pf: b.pf, profTax: b.profTax, netPay: b.net };
      }
      return { label: MONTH_LABELS[mIdx], basic: 0, hra: 0, special: 0, lta: 0, telephone: 0, gross: 0, pf: 0, profTax: 0, netPay: 0 };
    });
  }, [payslips, structure, fiscalYearStart]);

  const T = useMemo(() => {
    const sum = (k) => monthData.reduce((a, m) => a + (m[k] || 0), 0);
    return {
      basic: sum("basic"), hra: sum("hra"), special: sum("special"), lta: sum("lta"),
      telephone: sum("telephone"), gross: sum("gross"), pf: sum("pf"), profTax: sum("profTax"), netPay: sum("netPay"),
    };
  }, [monthData]);

  return { payslips, structure, empInfo, loading, detectedRegime, fiscalMonths, monthData, T };
}
