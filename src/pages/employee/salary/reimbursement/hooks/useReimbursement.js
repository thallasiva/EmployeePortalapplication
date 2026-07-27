import { useEffect, useMemo, useState } from "react";
import { getMySalaryStructure } from "../../../../../api/payroll.api";
import { buildSalaryBreakdown } from "../../../../../utils/salaryBreakdown";
import { getCurrentFiscalYearStart, getFiscalYearRangeLabel } from "../../../../../lib/dateUtils";

export function useReimbursement() {
  const [fiscalYearStart, setFiscalYearStart] = useState(String(getCurrentFiscalYearStart()));
  const [loading, setLoading] = useState(true);
  const [entitlements, setEntitlements] = useState([]);

  useEffect(() => {
    getMySalaryStructure().
    then((s) => {
      if (s?.basic) {
        const b = buildSalaryBreakdown(s);
        setEntitlements([
          { title: "Telephone & Internet", annual: b.telephone * 12, claimed: 1500 },
          { title: "LTA (Leave Travel)", annual: b.lta * 12, claimed: 5000 },
          { title: "Medical Allowance", annual: b.medicalAllowance * 12, claimed: 0 }
        ]);
      }
    }).
    catch(() => {}).
    finally(() => setLoading(false));
  }, []);

  const fyLabel = useMemo(() => getFiscalYearRangeLabel(fiscalYearStart), [fiscalYearStart]);
  const totalAnnual = useMemo(() => entitlements.reduce((a, e) => a + e.annual, 0), [entitlements]);
  const totalClaimed = useMemo(() => entitlements.reduce((a, e) => a + e.claimed, 0), [entitlements]);
  const totalBalance = useMemo(() => totalAnnual - totalClaimed, [totalAnnual, totalClaimed]);

  return { fiscalYearStart, setFiscalYearStart, loading, entitlements, fyLabel, totalAnnual, totalClaimed, totalBalance };
}
