export function periodStart(key) {
  const now = new Date();
  if (key === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (key === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (key === "year") return new Date(now.getFullYear(), 0, 1);
  return null;
}

export function filterJobs(jobs, search, filterStatus, start) {
  return jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      (j.title || "").toLowerCase().includes(q) ||
      (j.client || "").toLowerCase().includes(q) ||
      (j.job_req_code || "").toLowerCase().includes(q);
    const matchS = !filterStatus || j.assignment_status === filterStatus;
    const matchP = !start || new Date(j.created_at) >= start;
    return matchQ && matchS && matchP;
  });
}

export function computePeriodCounts(jobs, periods) {
  const counts = {};
  periods.forEach((p) => {
    const s = periodStart(p.key);
    counts[p.key] = jobs.filter((j) => !s || new Date(j.created_at) >= s).length;
  });
  return counts;
}
