import { SEC123_ITEMS, CH8_ITEMS, MED_ITEMS } from "../constants";
import { countMonths } from "./hraHelpers";

export function buildItems({ vals123, valsCh8, hraData, medVals, houseData, selfOccupied, incomes, tcsTds }) {
  const items = [];

  SEC123_ITEMS.forEach((it) => {
    const amt = Number(vals123[it.label]) || 0;
    if (amt)
      items.push({
        section_key: "80C",
        section_label: "Tax-Saving Investments (80C / 80CCD)",
        sub_label: it.label,
        declared_amount: amt,
      });
  });

  CH8_ITEMS.forEach((it) => {
    const amt = Number(valsCh8[it.label]) || 0;
    if (amt)
      items.push({
        section_key: "CH8",
        section_label: "Other Deductions (80D / 80E / 80G)",
        sub_label: it.label,
        declared_amount: amt,
      });
  });

  const hraHouses = hraData.houses || [];
  const totalHRA = hraHouses.reduce(
    (s, h) => s + (Number(h.monthlyRent) || 0) * countMonths(h.from, h.to),
    0
  );
  if (totalHRA > 0) {
    items.push({
      section_key: "HRA",
      section_label: "HRA Exemption (Sec. 10(13A))",
      sub_label: JSON.stringify(hraHouses),
      declared_amount: totalHRA,
    });
  }

  MED_ITEMS.forEach((it) => {
    const amt = Number(medVals[it.key]) || 0;
    if (amt)
      items.push({
        section_key: "MEDICAL",
        section_label: "Medical & Health Benefits (Sec. 80D)",
        sub_label: it.key,
        declared_amount: amt,
      });
  });

  const houseLoss = houseData.reduce((s, h) => {
    const net =
      Number(h.annualValue || 0) -
      Number(h.municipalTax || 0) -
      Number(h.unrealizedRent || 0);
    return s + net - Math.round(Math.max(net, 0) * 0.3) - Number(h.homeLoanInterest || 0);
  }, 0);
  if (selfOccupied.interest > 0 || houseLoss !== 0) {
    items.push({
      section_key: "HOUSE",
      section_label: "House Property Income / Loss (Sec. 24)",
      sub_label: JSON.stringify({ selfOccupied, houseData }),
      declared_amount:
        Math.max(-houseLoss, 0) +
        Math.min(Number(selfOccupied.interest || 0), 200000),
    });
  }

  incomes.forEach((inc) => {
    const amt = Number(inc.amount) || 0;
    if (amt && inc.particulars)
      items.push({
        section_key: "OTHER_INCOME",
        section_label: "Other Sources of Income",
        sub_label: inc.particulars,
        declared_amount: amt,
      });
  });

  if (tcsTds.tcs > 0)
    items.push({ section_key: "TCS", section_label: "TCS Deduction", sub_label: "TCS", declared_amount: Number(tcsTds.tcs) });
  if (tcsTds.tds > 0)
    items.push({ section_key: "TDS", section_label: "TDS Deduction", sub_label: "TDS", declared_amount: Number(tcsTds.tds) });

  return items;
}

export function loadStateFromItems(items) {
  const v123 = {},
    vCh8 = {},
    med = {};
  let hra = { houses: [] };
  let house = [{}],
    selfOcc = {},
    incs = [{ particulars: "", amount: 0 }],
    tcs = { tcs: 0, tds: 0 };

  items.forEach((it) => {
    if (it.section_key === "80C") v123[it.sub_label] = it.declared_amount;
    else if (it.section_key === "CH8") vCh8[it.sub_label] = it.declared_amount;
    else if (it.section_key === "HRA") {
      try {
        const parsed = JSON.parse(it.sub_label || "[]");
        hra = { houses: Array.isArray(parsed) ? parsed : [] };
      } catch {
        hra = { houses: [] };
      }
    } else if (it.section_key === "MEDICAL") med[it.sub_label] = it.declared_amount;
    else if (it.section_key === "HOUSE") {
      try {
        const m = JSON.parse(it.sub_label || "{}");
        house = m.houseData || [{}];
        selfOcc = m.selfOccupied || {};
      } catch {}
    } else if (it.section_key === "OTHER_INCOME") {
      if (incs.length === 1 && !incs[0].particulars) incs = [];
      incs.push({ particulars: it.sub_label, amount: it.declared_amount });
    } else if (it.section_key === "TCS") tcs.tcs = it.declared_amount;
    else if (it.section_key === "TDS") tcs.tds = it.declared_amount;
  });

  if (incs.length === 0) incs = [{ particulars: "", amount: 0 }];

  return {
    vals123: v123,
    valsCh8: vCh8,
    hraData: hra,
    medVals: med,
    houseData: house,
    selfOccupied: selfOcc,
    incomes: incs,
    tcsTds: tcs,
  };
}
