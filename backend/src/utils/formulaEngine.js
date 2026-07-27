/**
 * Formula Engine — evaluates salary component formulas.
 *
 * Supported tokens (case-insensitive):
 *   Component codes   e.g. BASIC, HRA, GROSS
 *   CTC_MONTHLY       annual CTC / 12
 *   CTC_ANNUAL        annual CTC
 *   GROSS             sum of all Earning components so far
 *   NET_SALARY        GROSS - total deductions
 *
 * Supported functions:
 *   MIN(a, b)    MAX(a, b)    ROUND(x)    IF(cond, a, b)    ABS(x)
 */

function evaluate(expr, context = {}) {
  if (!expr) return 0;

  // Build safe expression by replacing tokens with their values
  let safe = expr.toUpperCase();

  // Replace known tokens (longest first to avoid partial matches)
  const tokens = Object.keys(context).sort((a, b) => b.length - a.length);
  for (const token of tokens) {
    const val = Number(context[token]) || 0;
    safe = safe.replace(new RegExp(`\\b${token}\\b`, 'g'), String(val));
  }

  // Replace math functions with JS equivalents
  safe = safe
    .replace(/\bMIN\b/g,   'Math.min')
    .replace(/\bMAX\b/g,   'Math.max')
    .replace(/\bROUND\b/g, 'Math.round')
    .replace(/\bABS\b/g,   'Math.abs')
    .replace(/\bIF\s*\(/g, '_IF(');

  // Inject _IF helper
  const scope = {
    Math,
    _IF: (cond, a, b) => (cond ? a : b),
  };

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(...Object.keys(scope), `return (${safe});`);
    const result = fn(...Object.values(scope));
    return isFinite(result) ? Math.round(result * 100) / 100 : 0;
  } catch {
    return 0;
  }
}

/**
 * Compute all components for a salary structure given annual CTC.
 * Returns an array of { component_code, component_name, category,
 *   frequency, monthly_amount, annual_amount, show_* }
 */
function computeStructure(lines, ctcAnnual, overrides = {}) {
  const ctcMonthly = Math.round(ctcAnnual / 12);
  const variableAnnual = Number(overrides.variable_annual) || 0;
  const fixedCtcAnnual = ctcAnnual - variableAnnual;
  const fixedCtcMonthly = Math.round(fixedCtcAnnual / 12);

  // Context accumulates as we compute components in sort order
  const ctx = {
    CTC_ANNUAL:        fixedCtcAnnual,
    CTC_MONTHLY:       fixedCtcMonthly,
    CTC_ANNUAL_TOTAL:  ctcAnnual,
    CTC_MONTHLY_TOTAL: ctcMonthly,
  };

  const results = [];

  // Pass 1: compute all non-formula earnings first (except SPL/GROSS-dependent)
  const sorted = [...lines].sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));

  // We do two passes: first non-GROSS-dependent, then GROSS-dependent
  for (const line of sorted) {
    if (!line.is_active) continue;
    const code    = line.component_code;
    const ctype   = line.effective_calc_type || line.calc_type;
    const cat     = line.category;

    let monthly = 0;
    let annual  = 0;

    if (ctype === 'Fixed') {
      // Use structure override first, then master fixed_amount
      const fixedAnnual = Number(overrides[code] ?? line.fixed_amount ?? 0);
      if (line.frequency === 'Annual' || line.frequency === 'One-Time') {
        annual  = fixedAnnual;
        monthly = Math.round(annual / 12);
      } else {
        monthly = fixedAnnual; // stored as monthly in fixed_amount
        annual  = monthly * 12;
      }
    } else if (ctype === 'Percentage') {
      const pct  = Number(overrides[`${code}_PCT`] ?? line.effective_pct ?? line.percentage_value ?? 0) / 100;
      const base = line.effective_pct_of || line.percentage_of || 'BASIC';
      const baseVal = Number(ctx[base.toUpperCase()] || 0);
      if (line.frequency === 'Annual') {
        annual  = Math.round(baseVal * pct);
        monthly = Math.round(annual / 12);
      } else {
        monthly = Math.round(baseVal * pct);
        annual  = monthly * 12;
      }
    } else if (ctype === 'Formula') {
      // Defer GROSS-dependent formulas
      if ((line.effective_formula || '').toUpperCase().includes('GROSS')) {
        results.push({ ...line, _deferred: true });
        continue;
      }
      const val = evaluate(line.effective_formula || '', ctx);
      if (line.frequency === 'Annual') {
        annual  = Math.round(val);
        monthly = Math.round(annual / 12);
      } else {
        monthly = Math.round(val);
        annual  = monthly * 12;
      }
    }

    // Set context
    ctx[code] = monthly;
    ctx[`${code}_ANNUAL`] = annual;

    results.push({ ...line, monthly_amount: monthly, annual_amount: annual, _deferred: false });
  }

  // Compute GROSS = sum of earning monthly values so far
  const grossMonthly = results
    .filter(r => r.category === 'Earning' && !r._deferred)
    .reduce((s, r) => s + (r.monthly_amount || 0), 0);

  // Add deductions from CTC to get gross
  // gross_from_ctc = fixedCtcMonthly - employer contributions deducted from CTC
  const empErPfMonthly  = Math.min(Math.round((ctx.BASIC || 0) * 0.12), 1800);
  const statBonusMonthly = (ctx.BASIC || 0) <= 21000 ? 1400 : 0;
  const grossFromCtc    = fixedCtcMonthly - empErPfMonthly - statBonusMonthly;

  ctx.GROSS     = grossFromCtc;
  ctx.GROSS_STD = grossMonthly;

  // Pass 2: deferred (GROSS-dependent) formulas
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (!r._deferred) continue;

    const val = evaluate(r.effective_formula || '', ctx);
    let monthly = 0, annual = 0;
    if (r.frequency === 'Annual') {
      annual  = Math.round(val);
      monthly = Math.round(annual / 12);
    } else {
      monthly = Math.round(val);
      annual  = monthly * 12;
    }
    ctx[r.component_code] = monthly;
    ctx[`${r.component_code}_ANNUAL`] = annual;
    results[i] = { ...r, monthly_amount: monthly, annual_amount: annual, _deferred: false };
  }

  return { components: results, ctx };
}

module.exports = { evaluate, computeStructure };
