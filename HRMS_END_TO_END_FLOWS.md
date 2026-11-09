+# HRMS End-to-End Flows (React + Node.js)

This plan is tailored to this repository's React frontend and Node.js/Express backend. The route inventory includes authentication/MFA, employees and organization, attendance, leave, payroll, recruitment/joining, reviews/appraisal, resignation, requests/helpdesk, documents, timesheets, reports, settings, and audit. It does not assume an Angular/Spring Boot stack or unimplemented SaaS billing features.

## Application architecture and request flow

- React renders role-aware employee, manager, recruiter, HR, and admin experiences.
- React API clients attach the authenticated token and send requests to the Express API.
- Express middleware authenticates the session, resolves the user's company and permissions, validates input, and calls controllers/services.
- Services enforce business rules and data scope before reading/writing the database.
- Results return as JSON; React updates the screen and displays validation or workflow status.
- Sensitive changes create audit history; notifications inform affected employees and approvers.

Every authorization decision must be enforced by Express. Hiding a React menu item alone is not security. In a multi-company deployment, derive tenant scope from trusted authentication context and enforce it on every query.

## 1. Sign-in, security, roles, and menus

Sign in or recover password → verify credentials → complete MFA when enabled → establish authenticated session → load employee/company context and permission grants → render permitted navigation → authorize every API operation on the server → record security-sensitive changes.

Admin setup: company settings → roles → permissions → assign roles to users → configure workflow delegates. Restrict payroll, bank, tax, and personal data to specific roles. Define recovery, lockout, session expiry, and MFA reset behavior.

## 2. Company and organization setup

Company profile/settings → offices → departments → designations and leadership roles → teams and reporting hierarchy → roles and permissions → holidays and work schedules → leave types and approval chains → salary components/templates → delegation and notification settings.

Keep effective dates and history for organization changes so older approvals, attendance, and payroll remain explainable. Validate that each enabled workflow has an active approver.

## 3. Employee lifecycle and onboarding

HR creates employee (or converts selected candidate) → assigns employee ID, office, department, title, manager, start date, and employment type → collects personal/contact/emergency details → collects restricted bank/statutory information → uploads required documents → assigns work schedule, leave policy, and salary effective date → sends account invitation → employee activates account and completes joining formalities → HR verifies documents and declarations or requests corrections → employee becomes active.

Handle duplicate profiles, expired invitations, missing documents, start date changes, transfers, manager changes, rehire, and corrections after payroll. Preserve employment history; do not delete records used by finalized transactions.

## 4. Recruitment, interviews, offer, and joining

Hiring manager requests a role → HR approves and publishes job → recruiter is assigned → candidates apply or are added as referrals → recruiter screens candidate/resume → interviews are scheduled → interviewers submit feedback → manager/HR records decision → offer is prepared and approved → candidate accepts, declines, or offer expires → accepted candidate completes joining packet → HR verifies packet → candidate converts to employee.

Support withdrawal, interview rescheduling/no-show, rejection, offer revision, and delayed joining. Preserve pipeline and decision history. Do not convert to employee until required offer/joining checks pass.

## 5. Attendance and work schedules

Admin configures schedules, holidays, weekly offs, grace periods, and attendance rules → assigns schedule with effective dates → employee punches or attendance is imported → system calculates worked time and exceptions → employee views calendar/muster → employee requests regularization for missing/incorrect punches → manager approves, rejects, or requests correction → approved adjustment updates summary with history → HR resolves remaining exceptions before payroll cutoff.

Handle overnight shifts, breaks, late/early time, half/full day, overtime, holiday work, missing punches, and schedule changes. Retain original punches; do not silently overwrite them. Use explicit timezone rules.

## 6. Leave and holidays

Admin configures leave types, balances/accrual, holiday calendar, and approval chain → employee checks balance and calendar → submits dates, duration, reason, and evidence → server validates balance, overlap, notice rules, and policy → manager and any additional approvers decide → status and balance update → attendance calendar and payroll inputs refresh → employee is notified.

Support half-day and multi-day leave, insufficient balance, overlapping requests, cancellation, carry-forward/expiry, encashment, and holiday/weekend treatment. The company policy must define whether non-working days inside a leave range consume balance.

## 7. Timesheets and employee requests

Employee records work against dates/tasks → submits a period → server validates required hours and locked dates → manager approves or rejects with comments → employee corrects and resubmits → approved time becomes available to relevant reports/workflows.

For Request Hub: employee submits category/details/attachments → request routes to owner/approver → owner requests more information or updates status → employee receives updates → resolution is recorded and request closes. Helpdesk follows the same lifecycle with support categories, ticket ownership, responses, resolution, and reopen behavior.

## 8. Salary, tax declarations, payroll, and payslips

Payroll admin configures components/formulas/templates and payroll calendar → assigns approved, effective-dated salary → employee submits tax/IT declarations and evidence → HR/finance reviews or requests correction → payroll period opens → approved attendance, leave, overtime, timesheet, and adjustment inputs are collected → system calculates earnings, deductions, paid days, loss of pay, tax, and net pay → payroll reviewer checks exceptions/variances → issues are corrected and calculation rerun → authorized approver approves register → period is finalized/locked → payslips and payment output are generated → employees access payslips → payment is reconciled and reports retained.

Prevent duplicate payroll/payment runs. Store a calculation snapshot and approval history. Corrections after lock should use an audited adjustment/reversal process. Configure tax and statutory rules for the actual operating jurisdiction and effective date.

Salary structures, components, and templates are tenant-scoped: all reads and writes derive `company_id` from the authenticated user, and structure lines can reference only components owned by that company. Formula configuration accepts numeric arithmetic, comparisons, `AND`/`OR`, and the `MIN`, `MAX`, `ROUND`, `ABS`, and `IF` functions; formulas are parsed without evaluating JavaScript and checked against the company's component codes. Payroll calculation uses the employee's company-owned salary structure and stores the formula, component, attendance, and result snapshot with the payslip. Each processing attempt also records an immutable company payroll-rule version linked to its payroll run. Monthly runs remain unique per company and cannot be recalculated while awaiting review, approved, or locked. New companies receive their own copies of built-in salary components and templates.

Apply migrations 061 and 062 after migrations 059 and 060. Migration 061 assigns existing salary configuration to the first company and clones built-in components and existing templates as initial company-owned configuration for other existing companies. Migration 062 creates payroll-rule version history and links each processed payroll run to its exact configuration snapshot.

The formula engine applies configured earnings, deductions, and employer contributions; jurisdiction-specific statutory tax policies are not yet configurable per company. The existing India-oriented TDS calculation remains separate and must be extended before treating payroll as multi-jurisdictional.

## 9. Performance reviews and appraisal

HR opens review cycle and template → manager/employee records goals → employee submits self-review and evidence → manager rates and comments → HR/calibration review if configured → review is shared and employee acknowledges → authorized decision maker records development/promotion/increment decision → approved compensation changes create a new effective-dated salary assignment.

Possible states: draft, submitted, manager review, HR review, changes requested, shared, acknowledged, closed. Reopening requires permission and a recorded reason.

Implementation in this repository uses the appraisal cycle screens for HR, the employee self-appraisal screen, and the manager team-review screen. HR configures 1–20 criteria per cycle. Employees add goals, progress, and evidence links alongside the criteria; managers submit goal feedback and ratings; HR can request changes, share the review, record a decision, and close or reopen it with a reason. Increment/promotion decisions can create an effective-dated salary assignment using the employee's current salary structure. Workflow transitions are retained in `appraisal_workflow_events`. Apply `backend/database/migration_060_appraisal_workflow.sql` after migration 059. Automatic email notifications are not included in this implementation.

## 10. Resignation, offboarding, and final settlement

Employee submits resignation and proposed last day → manager reviews → HR confirms notice period and final date → handover, asset, access, and clearance tasks are assigned → employee/managers complete clearances → HR checks attendance, leave balance, deductions, and documents → payroll calculates pending earnings, leave encashment, deductions, and final settlement → finance approves and reconciles payment → exit documents are issued → access is revoked on approved date → employee status becomes exited and records are retained.

Handle notice waiver/buyout, date changes, missing assets, pending requests, negative leave, and settlement correction. Record an exception if access must be revoked before the planned date.

## 11. Documents, kudos, and feedback

Documents: authorized user uploads/generates → classify by employee/type/access → review if required → publish to intended audience → track acknowledgement/expiry → version or archive per retention rules.

Kudos/feedback: author selects recipient and visibility → submits message → recipient is notified → authorized moderation handles reports → content is visible only to allowed audiences. Make confidentiality clear.

## 12. Dashboards, reports, notifications, audit

Workflow event → notify relevant employee/approver → role-scoped dashboard shows pending work and summaries → reports/exports enforce the same row-level access as APIs → sensitive action appends actor, timestamp, record, outcome, and reason to audit history → admins review pending queues and operational exceptions.

Reports should reconcile to source records and finalized payroll snapshots. Do not expose salary, bank, medical, or other sensitive details in notification previews.

## Cross-cutting implementation rules

- Validate request bodies and parameters on the Node.js server; return consistent error responses.
- Enforce permissions and company scope in Express middleware/services, including exports and analytics.
- Use explicit workflow states, effective dates, transaction boundaries, and audit records.
- Make retries safe for invitations, payroll generation, payment files, and callbacks.
- Separate maker and approver for high-impact changes where company policy requires it.
- Define privacy, retention, jurisdiction-specific statutory rules, and escalation behavior before production use.

## Suggested delivery sequence

1. Authentication/MFA, company scope, roles/permissions, audit, and settings.
2. Organization setup and employee profiles/documents.
3. Recruitment, offers, and joining.
4. Work schedules, attendance, leave, and regularization.
5. Salary setup, declarations, payroll, and payslips.
6. Timesheets, requests, helpdesk, and delegation.
7. Reviews/appraisals, resignation, offboarding, and final settlement.
8. Reports, dashboards, notification reliability, and reconciliation.

For every module, deliver the employee, manager/approver, and admin journeys together, including correction, rejection, cancellation, and overdue cases.

## Training, shift, assets, and central approvals

- Admin/HR creates company training courses, assigns them to active employees, and tracks completion. Employees see only their own assignments and can update progress or self-record completion.
- Admin/HR assigns fixed or rotational work days and hours from Shift Management. Schedule reads and writes are scoped through the employee's authenticated company; employees see their schedule in the Shift Roster.
- Admin/HR maintains company asset inventory, assigns available assets to active company employees, records returns, and marks unassigned inventory for maintenance or retirement. Employees see only assets currently assigned to themselves.
- Admin/HR and reporting managers have a central pending-approvals inbox. It aggregates leave, attendance regularization, resignation, timesheet, and appraisal requests and links into each module's existing review workflow; it does not duplicate or bypass those approval actions. Reporting managers see only their direct reports.

Fresh database initialization (`npm run db:init` from the backend directory) also applies migrations 063 and 064 so the training and asset tables are created. For an existing database, apply migration 063 with `npm run db:migrate:063`, followed by migration 064 with `npm run db:migrate:064`. Training and assets use new company-owned tables; employee schedules remain attached to employees and are filtered by the authenticated company.

Asset Management also includes company-scoped inventory, categories, allocation, employee asset requests and review/fulfillment, return history, maintenance tracking, employee transfers, and CSV reports. Apply migration 064 after migration 063 with `npm run db:migrate:064` from the backend directory. Migration 064 also fills missing asset tags on existing inventory records using `LEGACY-<asset_id>`. Keep the existing application sidebar and use its Asset Management section to navigate between these screens.
