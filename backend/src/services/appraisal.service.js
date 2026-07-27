const { callProcedure, readOuts } = require('../config/db');
const ApiError = require('../utils/ApiError');

const PARAMS = [
{ key: 'job_knowledge', label: 'Job Knowledge / Technical Skills' },
{ key: 'productivity', label: 'Productivity' },
{ key: 'interpersonal', label: 'Interpersonal Skills' },
{ key: 'communication', label: 'Communication Skills' },
{ key: 'deadlines', label: 'Meeting Deadlines' },
{ key: 'accountability', label: 'Accountability' },
{ key: 'attitude', label: 'Attitude & Behaviour' },
{ key: 'attendance', label: 'Attendance & Punctuality' }];




async function getActiveCycle()
{
  const results = await callProcedure('sp_get_active_appraisal_cycle()');

  return (results[0] ?? [])[0] ?? (results[1] ?? [])[0] ?? null;
}

async function getAllCycles()
{
  const results = await callProcedure('sp_get_all_appraisal_cycles()');
  return results[0] ?? [];
}

async function createCycle(adminEmployeeId, { fy_label, deadline, cycle_type })
{
  if (!fy_label) throw ApiError.badRequest('FY label is required');
  const validTypes = ['monthly', 'quarterly', 'half_yearly', 'yearly'];
  const type = validTypes.includes(cycle_type) ? cycle_type : 'yearly';
  await callProcedure('sp_create_appraisal_cycle(?, ?, ?, ?, @cycle_id)', [
  adminEmployeeId, fy_label, type, deadline || null]
  );
  const out = await readOuts('cycle_id');
  const results = await callProcedure('sp_update_appraisal_cycle(?, ?, ?, ?)', [
  out[0].cycle_id, null, null, null]
  );
  return (results[0] ?? [])[0] ?? null;
}

async function updateCycleSettings(adminEmployeeId, cycleId, { fy_label, deadline, cycle_type })
{
  const validTypes = ['monthly', 'quarterly', 'half_yearly', 'yearly'];
  const typeVal = validTypes.includes(cycle_type) ? cycle_type : null;
  const results = await callProcedure('sp_update_appraisal_cycle(?, ?, ?, ?)', [
  cycleId, fy_label || null, deadline || null, typeVal]
  );
  const row = (results[0] ?? [])[0] ?? null;
  if (!row) throw ApiError.notFound('Cycle not found');
  return row;
}

async function rolloutCycle(adminEmployeeId, cycleId, { rollout_type = 'all', employee_ids = [] })
{
  await callProcedure('sp_rollout_appraisal_cycle(?, ?, ?, @ok, @msg)', [
  adminEmployeeId, cycleId, rollout_type]
  );
  const out = await readOuts('ok', 'msg');
  if (!out[0]?.ok) throw ApiError.badRequest(out[0]?.msg || 'Cannot rollout cycle');


  if (rollout_type === 'selected')
  {
    for (const empId of employee_ids.map(Number).filter(Boolean))
    {
      await callProcedure('sp_enroll_employee_appraisal(?, ?, ?)', [cycleId, empId, adminEmployeeId]);
    }
  }

  const results = await callProcedure('sp_get_all_appraisal_cycles()');
  return (results[0] ?? []).find((c) => c.cycle_id === cycleId) ?? null;
}

async function disableCycle(adminEmployeeId, cycleId)
{
  await callProcedure('sp_disable_appraisal_cycle(?, ?, @ok)', [adminEmployeeId, cycleId]);
  const out = await readOuts('ok');
  if (!out[0]?.ok) throw ApiError.badRequest('Cycle is not active');
  const results = await callProcedure('sp_update_appraisal_cycle(?, ?, ?, ?)', [cycleId, null, null, null]);
  return (results[0] ?? [])[0] ?? null;
}

async function toggleCycle(adminEmployeeId)
{
  const cycle = await getActiveCycle();
  if (!cycle) throw ApiError.notFound('No appraisal cycle found');
  if (cycle.status === 'active') return disableCycle(adminEmployeeId, cycle.cycle_id);
  return rolloutCycle(adminEmployeeId, cycle.cycle_id, { rollout_type: 'all' });
}



async function getEnrollments(cycleId)
{
  const results = await callProcedure('sp_get_appraisal_enrollments(?)', [cycleId]);
  return results[0] ?? [];
}

async function enrollEmployees(cycleId, adminEmployeeId, employeeIds)
{
  for (const empId of employeeIds)
  {
    await callProcedure('sp_enroll_employee_appraisal(?, ?, ?)', [cycleId, empId, adminEmployeeId]);
  }
  return getEnrollments(cycleId);
}

async function unenrollEmployee(cycleId, employeeId)
{
  await callProcedure('sp_unenroll_employee_appraisal(?, ?)', [cycleId, employeeId]);
  return { success: true };
}

async function isEnrolled(cycleId, employeeId)
{
  const results = await callProcedure('sp_is_enrolled(?, ?)', [cycleId, employeeId]);
  return !!(results[0] ?? [])[0]?.enrolled;
}



async function getMyAppraisal(employeeId)
{
  const cycle = await getActiveCycle();
  if (!cycle) return { cycle: null, appraisal: null, ratings: [], enrolled: false };
  if (cycle.status !== 'active') return { cycle, appraisal: null, ratings: [], parameters: PARAMS, enrolled: false };


  const enrolled = await isEnrolled(cycle.cycle_id, employeeId);
  if (!enrolled)
  {
    await callProcedure('sp_enroll_employee_appraisal(?, ?, ?)', [cycle.cycle_id, employeeId, employeeId]);
  }

  const results = await callProcedure('sp_get_my_appraisal(?, ?)', [employeeId, cycle.cycle_id]);
  const appraisal = (results[0] ?? [])[0] ?? null;
  const ratings = results[1] ?? [];
  return { cycle, appraisal, ratings, parameters: PARAMS, enrolled: true };
}

async function saveMyAppraisal(employeeId, { ratings, overall_comments, submit })
{
  const cycle = await getActiveCycle();
  if (!cycle || cycle.status !== 'active') throw ApiError.badRequest('No active appraisal cycle');

  await callProcedure('sp_get_or_create_appraisal(?, ?, ?, @appraisal_id, @is_submitted)', [
  cycle.cycle_id, employeeId, overall_comments || null]
  );
  const out = await readOuts('appraisal_id', 'is_submitted');
  const appraisalId = out[0].appraisal_id;
  const isSubmitted = out[0].is_submitted;

  if (isSubmitted) throw ApiError.badRequest('Appraisal already submitted');

  for (const r of ratings || [])
  {
    await callProcedure('sp_save_appraisal_rating(?, ?, ?, ?, ?)', [
    appraisalId, r.parameter_key, r.parameter_label ?? null,
    r.self_rating ?? null, r.self_comments ?? null]
    );
  }

  if (submit)
  {
    await callProcedure('sp_submit_appraisal(?, ?)', [appraisalId, overall_comments || null]);
  }

  return getMyAppraisal(employeeId);
}



async function getTeamAppraisals(managerEmployeeId)
{
  const cycle = await getActiveCycle();
  if (!cycle) return { cycle: null, team: [] };

  const teamResults = await callProcedure('sp_get_team_appraisals(?, ?)', [managerEmployeeId, cycle.cycle_id]);
  const team = teamResults[0] ?? [];

  for (const member of team)
  {
    if (member.appraisal_id)
    {
      const rResults = await callProcedure('sp_get_appraisal_ratings(?)', [member.appraisal_id]);
      member.ratings = rResults[0] ?? [];
    } else
    {
      member.ratings = [];
    }
  }

  return { cycle, team, parameters: PARAMS };
}

async function saveManagerRating(managerEmployeeId, appraisalId, { ratings, manager_feedback })
{
  const aResults = await callProcedure('sp_get_appraisal(?)', [appraisalId]);
  const appraisal = (aResults[0] ?? [])[0] ?? null;
  if (!appraisal) throw ApiError.notFound('Appraisal not found');
  if (appraisal.reporting_to !== managerEmployeeId) throw ApiError.forbidden('Not your direct report');

  for (const r of ratings || [])
  {
    await callProcedure('sp_save_manager_appraisal_rating(?, ?, ?, ?)', [
    appraisalId, r.parameter_key, r.manager_rating ?? null, r.manager_comments ?? null]
    );
  }
  return { success: true };
}



async function getAllAppraisals(cycleIdOrFilters = {}, filters = {})
{
  let cycleId, actualFilters;
  if (typeof cycleIdOrFilters === 'number')
  {
    cycleId = cycleIdOrFilters;actualFilters = filters;
  } else
  {
    actualFilters = cycleIdOrFilters;
    const cycle = await getActiveCycle();
    cycleId = cycle?.cycle_id;
  }
  if (!cycleId) return { cycle: null, appraisals: [], notSubmitted: [] };

  const cycleResults = await callProcedure('sp_get_all_appraisal_cycles()');
  const cycle = (cycleResults[0] ?? []).find((c) => c.cycle_id === cycleId) ?? null;
  if (!cycle) return { cycle: null, appraisals: [], notSubmitted: [] };

  const allResults = await callProcedure('sp_get_all_appraisals(?, ?, ?)', [
  cycleId, actualFilters.status ?? null, actualFilters.department_id ?? null]
  );
  const appraisals = allResults[0] ?? [];
  const notSubmitted = allResults[1] ?? [];

  for (const a of appraisals)
  {
    const rResults = await callProcedure('sp_get_appraisal_ratings_summary(?)', [a.appraisal_id]);
    const ratings = rResults[0] ?? [];
    const selfVals = ratings.filter((r) => r.self_rating).map((r) => r.self_rating);
    const mgrVals = ratings.filter((r) => r.manager_rating).map((r) => r.manager_rating);
    a.self_avg = selfVals.length ? (selfVals.reduce((s, v) => s + v, 0) / selfVals.length).toFixed(1) : null;
    a.manager_avg = mgrVals.length ? (mgrVals.reduce((s, v) => s + v, 0) / mgrVals.length).toFixed(1) : null;
    a.overall_avg = a.manager_avg || a.self_avg;
  }

  return { cycle, appraisals, notSubmitted };
}

async function updateAppraisalStatus(appraisalId, status)
{
  const results = await callProcedure('sp_update_appraisal_status(?, ?)', [appraisalId, status]);
  return (results[0] ?? [])[0] ?? null;
}

module.exports = {
  getActiveCycle, getAllCycles, createCycle, updateCycleSettings,
  rolloutCycle, disableCycle, toggleCycle,
  getEnrollments, enrollEmployees, unenrollEmployee, isEnrolled,
  getMyAppraisal, saveMyAppraisal,
  getTeamAppraisals, saveManagerRating,
  getAllAppraisals, updateAppraisalStatus
};
