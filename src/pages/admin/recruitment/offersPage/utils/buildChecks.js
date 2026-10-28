export function buildChecks(f, c, candidates) {
  const ctcAnn = Number(f.ctcInput) * 12;
  const varPct = Number(f.variablePct) || 0;
  const varAnn = Math.round(ctcAnn * varPct / 100);
  const joinBonus = Number(f.joiningBonus) || 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const doj = f.dateOfJoining ? new Date(f.dateOfJoining) : null;
  const isFutureDOJ = doj ? doj >= today : false;
  const candName = (candidates.find((x) => String(x.candidate_id) === String(f.candidateId)) || {}).name || '';
  const fmtAnn = (v) => Number(v) > 0 ? `Rs.${Number(v).toLocaleString('en-IN')}` : '—';
  return [
    { id: 'candidate', group: 'Required Fields', label: 'Candidate selected', status: f.candidateId ? 'ok' : 'fail', value: candName },
    { id: 'job', group: 'Required Fields', label: 'Job position selected', status: f.jobReqId ? 'ok' : 'fail', value: '' },
    { id: 'desig', group: 'Required Fields', label: 'Designation filled', status: f.designation ? 'ok' : 'fail', value: f.designation },
    { id: 'doj', group: 'Required Fields', label: 'Date of Joining set', status: f.dateOfJoining ? 'ok' : 'fail', value: f.dateOfJoining || '' },
    { id: 'doj_f', group: 'Required Fields', label: 'Joining date ≥ today', status: isFutureDOJ ? 'ok' : 'warn', value: '' },
    { id: 'ctc', group: 'Required Fields', label: 'Annual CTC > 0', status: ctcAnn > 0 ? 'ok' : 'fail', value: ctcAnn > 0 ? `Rs.${ctcAnn.toLocaleString('en-IN')}` : '' },
    { id: 'basic', group: 'Fixed Pay', label: 'Basic Salary computed', status: (c.basic || 0) > 0 ? 'ok' : 'fail', value: fmtAnn(c.basic || 0) },
    { id: 'hra', group: 'Fixed Pay', label: 'HRA computed', status: (c.hra || 0) > 0 ? 'ok' : 'fail', value: fmtAnn(c.hra || 0) },
    { id: 'gross', group: 'Fixed Pay', label: 'Gross Salary > 0', status: (c.grossSalary || 0) > 0 ? 'ok' : 'fail', value: fmtAnn(c.grossSalary || 0) },
    { id: 'gross_lt', group: 'Fixed Pay', label: 'Gross < Annual CTC', status: (c.grossSalary || 0) < ctcAnn ? 'ok' : 'fail', value: '' },
    { id: 'var', group: 'Variable Pay', label: varPct > 0 ? `Variable Pay @ ${varPct}% of CTC` : 'Variable Pay (not set)', status: varPct > 40 ? 'warn' : 'ok', value: varPct > 0 ? fmtAnn(varAnn) : 'Not applicable' },
    { id: 'pf', group: 'Employer Contributions', label: 'PF Contribution', status: (c.pfContribution || 0) > 0 ? 'ok' : 'warn', value: fmtAnn(c.pfContribution || 0) },
    { id: 'sb', group: 'Employer Contributions', label: 'Statutory Bonus', status: 'ok', value: (c.statutoryBonus || 0) > 0 ? fmtAnn(c.statutoryBonus) : 'Not applicable (Basic > ₹21,000/mo)' },
    { id: 'grat', group: 'Employer Contributions', label: 'Gratuity', status: 'ok', value: fmtAnn(c.gratuity || 0) },
    { id: 'bonus', group: 'One-time Payments', label: 'Joining Bonus', status: joinBonus > ctcAnn ? 'warn' : 'ok', value: joinBonus > 0 ? fmtAnn(joinBonus) : 'Not entered' }
  ];
}
