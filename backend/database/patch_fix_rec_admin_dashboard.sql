-- ─────────────────────────────────────────────────────────────────────────────
-- Patch: Restore sp_rec_admin_dashboard to correct rec_* table version
-- Fixes: "Unknown column 'd.name'" + wrong tables (jobs vs rec_job_requests)
-- Safe to re-run. Run: node src/database/runSql.js patch_fix_rec_admin_dashboard.sql
-- ─────────────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS sp_rec_admin_dashboard;

DELIMITER $$
CREATE PROCEDURE sp_rec_admin_dashboard()
BEGIN
  -- result[0]: Stat cards
  SELECT
    (SELECT COUNT(*) FROM rec_job_requests WHERE deleted_at IS NULL)                                     AS total_jobs,
    (SELECT COUNT(*) FROM rec_job_requests WHERE assignment_status = 'Open' AND deleted_at IS NULL)      AS open_jobs,
    (SELECT COUNT(*) FROM rec_candidates  WHERE deleted_at IS NULL)                                      AS total_candidates,
    (SELECT COUNT(*) FROM rec_candidates  WHERE status = 'Schedule Interview' AND deleted_at IS NULL)    AS in_interview,
    (SELECT COUNT(*) FROM rec_candidates  WHERE status = 'Shortlisted'        AND deleted_at IS NULL)    AS shortlisted,
    (SELECT COUNT(*) FROM rec_offers      WHERE status = 'Released')                                     AS offers_pending,
    (SELECT COUNT(*) FROM rec_offers      WHERE status = 'Accepted')                                     AS offers_accepted,
    (SELECT COUNT(*) FROM rec_onboarding  WHERE current_status != 'Completed')                           AS active_onboarding;

  -- result[1]: Candidate pipeline by status
  SELECT status, COUNT(*) AS count
  FROM   rec_candidates WHERE deleted_at IS NULL
  GROUP BY status ORDER BY count DESC;

  -- result[2]: Recruiter performance (last 30 days)
  SELECT CONCAT(e.first_name,' ',e.last_name) AS recruiter,
         COUNT(DISTINCT c.candidate_id)        AS candidates_added,
         COALESCE(MAX(iv.cnt), 0)              AS interviews_scheduled,
         COALESCE(MAX(ol.cnt), 0)              AS offers_created
  FROM   employees e
  JOIN   users u ON u.employee_id = e.employee_id AND u.role_id = 5
  LEFT JOIN rec_candidates c
    ON  c.recruiter_id = e.employee_id
    AND c.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    AND c.deleted_at IS NULL
  LEFT JOIN (
    SELECT ri.scheduled_by, COUNT(*) AS cnt
    FROM   rec_interviews ri
    WHERE  ri.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY ri.scheduled_by
  ) iv ON iv.scheduled_by = u.user_id
  LEFT JOIN (
    SELECT rc.recruiter_id, COUNT(*) AS cnt
    FROM   rec_offers ro
    JOIN   rec_candidates rc ON rc.candidate_id = ro.candidate_id
    WHERE  ro.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY rc.recruiter_id
  ) ol ON ol.recruiter_id = e.employee_id
  GROUP BY e.employee_id, e.first_name, e.last_name;

  -- result[3]: Recent job requests (last 5)
  SELECT job_req_id, job_req_code, title, client, assignment_status, created_at
  FROM   rec_job_requests WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5;

  -- result[4]: Shortlisted candidates with recruiter name
  SELECT
    c.candidate_id,
    c.candidate_code,
    c.name           AS candidate_name,
    c.updated_at     AS shortlisted_at,
    CONCAT(e.first_name, ' ', e.last_name) AS hr_name
  FROM   rec_candidates c
  JOIN   employees e ON e.employee_id = c.recruiter_id
  WHERE  c.status = 'Shortlisted'
    AND  c.deleted_at IS NULL
  ORDER  BY c.updated_at DESC;
END$$
DELIMITER ;
