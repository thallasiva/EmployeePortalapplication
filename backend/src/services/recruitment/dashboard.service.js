const { callProcedure } = require("../../utils/db");

class DashboardService {
  async adminDashboard() {
    const results = await callProcedure("sp_rec_admin_dashboard", []);
    return {
      stats:              (results[0] ?? [])[0] ?? {},
      candidatePipeline:  results[1] ?? [],
      recruiterPerf:      results[2] ?? [],
      recentJobs:         results[3] ?? [],
    };
  }

  async recruiterDashboard(recruiterEmpId) {
    const results = await callProcedure("sp_rec_recruiter_dashboard", [recruiterEmpId]);
    return {
      stats:              (results[0] ?? [])[0] ?? {},
      assignedJobs:       results[1] ?? [],
      upcomingInterviews: results[2] ?? [],
    };
  }

  async pipelineReport({ fromDate, toDate, recruiterId } = {}) {
    const results = await callProcedure("sp_rec_pipeline_report", [
      fromDate || null,
      toDate || null,
      recruiterId || null,
    ]);
    return {
      funnel:       results[0] ?? [],
      timeToHire:  (results[1] ?? [])[0] ?? {},
      sourceBreakdown: results[2] ?? [],
    };
  }
}

module.exports = new DashboardService();
