import { useState, useCallback, useEffect } from "react";
import { getMySalaryStructure } from "../../../../../api/payroll.api";
import { buildSalaryBreakdown } from "../../../../../utils/salaryBreakdown";
import { getMyITDeclaration, saveMyITDeclaration } from "../../../../../api/itDeclaration.api";
import { SEC123_ITEMS, CH8_ITEMS, MED_ITEMS } from "../constants";
import { countMonths } from "../utils/hraHelpers";
import { buildItems, loadStateFromItems } from "../utils/declarationSerializer";

export function useITDeclaration() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [structure, setStructure] = useState(null);

  const [cycle, setCycle] = useState(null);
  const [declaration, setDeclaration] = useState(null);

  const [vals123, setVals123] = useState({});
  const [valsCh8, setValsCh8] = useState({});
  const [hraData, setHraData] = useState({ houses: [] });
  const [medVals, setMedVals] = useState({});
  const [houseData, setHouseData] = useState([{}]);
  const [selfOccupied, setSelfOccupied] = useState({});
  const [incomes, setIncomes] = useState([{ particulars: "", amount: 0 }]);
  const [tcsTds, setTcsTds] = useState({ tcs: 0, tds: 0 });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [salaryRes, declRes] = await Promise.all([
        getMySalaryStructure().catch(() => null),
        getMyITDeclaration().catch(() => null),
      ]);
      if (salaryRes?.basic) setStructure(salaryRes);
      if (declRes) {
        setCycle(declRes.cycle);
        setDeclaration(declRes.declaration);
        if (declRes.items?.length) {
          const parsed = loadStateFromItems(declRes.items);
          setVals123(parsed.vals123);
          setValsCh8(parsed.valsCh8);
          setHraData(parsed.hraData);
          setMedVals(parsed.medVals);
          setHouseData(parsed.houseData);
          setSelfOccupied(parsed.selfOccupied);
          setIncomes(parsed.incomes);
          setTcsTds(parsed.tcsTds);
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSave = async (submit = false) => {
    setSaving(true);
    try {
      const items = buildItems({ vals123, valsCh8, hraData, medVals, houseData, selfOccupied, incomes, tcsTds });
      const res = await saveMyITDeclaration({ items, submit });
      setCycle(res.cycle);
      setDeclaration(res.declaration);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to save");
    }
    setSaving(false);
  };

  const breakdown = structure?.basic ? buildSalaryBreakdown(structure) : null;
  const annualHRA = breakdown ? breakdown.hra * 12 : 0;
  const annualGross = breakdown ? breakdown.gross * 12 : 0;

  const declared123 = Math.min(
    SEC123_ITEMS.reduce((s, i) => s + (Number(vals123[i.label]) || 0), 0),
    150000
  );
  const declaredCh8 = CH8_ITEMS.reduce((s, i) => s + (Number(valsCh8[i.label]) || 0), 0);
  const declaredHRA = (hraData.houses || []).reduce(
    (s, h) => s + (Number(h.monthlyRent) || 0) * countMonths(h.from, h.to),
    0
  );
  const declaredMed = MED_ITEMS.reduce((s, i) => s + (Number(medVals[i.key]) || 0), 0);
  const declaredHouse = houseData.some((h) => h.annualValue || h.homeLoanInterest) ? 1 : null;
  const declaredIncome = incomes.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const declaredTcsTds = (Number(tcsTds.tcs) || 0) + (Number(tcsTds.tds) || 0);
  const totalDeclared = declared123 + declaredCh8 + declaredHRA + declaredMed + declaredIncome + declaredTcsTds;

  const isLocked = !cycle || cycle.status !== "active";
  const isReadOnly = declaration?.status === "submitted" || declaration?.status === "approved";
  const status = declaration?.status;

  return {
    // loading states
    loading,
    saving,
    // cycle & declaration meta
    cycle,
    declaration,
    status,
    isLocked,
    isReadOnly,
    // salary info
    annualHRA,
    annualGross,
    // form state
    vals123, setVals123,
    valsCh8, setValsCh8,
    hraData, setHraData,
    medVals, setMedVals,
    houseData, setHouseData,
    selfOccupied, setSelfOccupied,
    incomes, setIncomes,
    tcsTds, setTcsTds,
    // computed declared amounts
    declared123,
    declaredCh8,
    declaredHRA,
    declaredMed,
    declaredHouse,
    declaredIncome,
    declaredTcsTds,
    totalDeclared,
    // actions
    handleSave,
  };
}
