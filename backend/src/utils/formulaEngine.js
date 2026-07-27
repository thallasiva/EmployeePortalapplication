













function evaluate(expr, context = {}) {
  if (!expr) return 0;


  let safe = expr.toUpperCase();


  const tokens = Object.keys(context).sort((a, b) => b.length - a.length);
  for (const token of tokens) {
    const val = Number(context[token]) || 0;
    safe = safe.replace(new RegExp(`\\b${token}\\b`, 'g'), String(val));
  }


  safe = safe.
  replace(/\bMIN\b/g, 'Math.min').
  replace(/\bMAX\b/g, 'Math.max').
  replace(/\bROUND\b/g, 'Math.round').
  replace(/\bABS\b/g, 'Math.abs').
  replace(/\bIF\s*\(/g, '_IF(');


  const scope = {
    Math,
    _IF: (cond, a, b) => cond ? a : b
  };

  try {

    const fn = new Function(...Object.keys(scope), `return (${safe});`);
    const result = fn(...Object.values(scope));
    return isFinite(result) ? Math.round(result * 100) / 100 : 0;
  } catch {
    return 0;
  }
}






function computeStructure(lines, ctcAnnual, overrides = {}) {
  const ctcMonthly = Math.round(ctcAnnual / 12);
  const variableAnnual = Number(overrides.variable_annual) || 0;
  const fixedCtcAnnual = ctcAnnual - variableAnnual;
  const fixedCtcMonthly = Math.round(fixedCtcAnnual / 12);


  const ctx = {
    CTC_ANNUAL: fixedCtcAnnual,
    CTC_MONTHLY: fixedCtcMonthly,
    CTC_ANNUAL_TOTAL: ctcAnnual,
    CTC_MONTHLY_TOTAL: ctcMonthly
  };

  const results = [];


  const sorted = [...lines].sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));


  for (const line of sorted) {
    if (!line.is_active) continue;
    const code = line.component_code;
    const ctype = line.effective_calc_type || line.calc_type;
    const cat = line.category;

    let monthly = 0;
    let annual = 0;

    if (ctype === 'Fixed') {

      const fixedAnnual = Number(overrides[code] ?? line.fixed_amount ?? 0);
      if (line.frequency === 'Annual' || line.frequency === 'One-Time') {
        annual = fixedAnnual;
        monthly = Math.round(annual / 12);
      } else {
        monthly = fixedAnnual;
        annual = monthly * 12;
      }
    } else if (ctype === 'Percentage') {
      const pct = Number(overrides[`${code}_PCT`] ?? line.effective_pct ?? line.percentage_value ?? 0) / 100;
      const base = line.effective_pct_of || line.percentage_of || 'BASIC';
      const baseVal = Number(ctx[base.toUpperCase()] || 0);
      if (line.frequency === 'Annual') {
        annual = Math.round(baseVal * pct);
        monthly = Math.round(annual / 12);
      } else {
        monthly = Math.round(baseVal * pct);
        annual = monthly * 12;
      }
    } else if (ctype === 'Formula') {

      if ((line.effective_formula || '').toUpperCase().includes('GROSS')) {
        results.push({ ...line, _deferred: true });
        continue;
      }
      const val = evaluate(line.effective_formula || '', ctx);
      if (line.frequency === 'Annual') {
        annual = Math.round(val);
        monthly = Math.round(annual / 12);
      } else {
        monthly = Math.round(val);
        annual = monthly * 12;
      }
    }


    ctx[code] = monthly;
    ctx[`${code}_ANNUAL`] = annual;

    results.push({ ...line, monthly_amount: monthly, annual_amount: annual, _deferred: false });
  }


  const grossMonthly = results.
  filter((r) => r.category === 'Earning' && !r._deferred).
  reduce((s, r) => s + (r.monthly_amount || 0), 0);



  const empErPfMonthly = Math.min(Math.round((ctx.BASIC || 0) * 0.12), 1800);
  const statBonusMonthly = (ctx.BASIC || 0) <= 21000 ? 1400 : 0;
  const grossFromCtc = fixedCtcMonthly - empErPfMonthly - statBonusMonthly;

  ctx.GROSS = grossFromCtc;
  ctx.GROSS_STD = grossMonthly;


  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (!r._deferred) continue;

    const val = evaluate(r.effective_formula || '', ctx);
    let monthly = 0,annual = 0;
    if (r.frequency === 'Annual') {
      annual = Math.round(val);
      monthly = Math.round(annual / 12);
    } else {
      monthly = Math.round(val);
      annual = monthly * 12;
    }
    ctx[r.component_code] = monthly;
    ctx[`${r.component_code}_ANNUAL`] = annual;
    results[i] = { ...r, monthly_amount: monthly, annual_amount: annual, _deferred: false };
  }

  return { components: results, ctx };
}

module.exports = { evaluate, computeStructure };
