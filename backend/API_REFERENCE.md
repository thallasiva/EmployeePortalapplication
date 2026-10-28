# HRMS Backend - API Reference

Base URL: `https://backend.natsoft.io/api`

All endpoints (except `/auth/*`) require:
```
Authorization: Bearer <accessToken>
```

List endpoints accept `?page=1&limit=20` (max limit 100) and return:
```json
{
  "success": true,
  "data": [ ... ],
  "message": "...",
  "meta": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 }
}
```

Single-record responses:
```json
{ "success": true, "data": { ... }, "message": "..." }
```

Errors:
```json
{ "success": false, "message": "...", "errors": [ { "field": "...", "message": "..." } ] }
```

Permission codes shown as `module:action` (e.g. `employees:view`). Admin (role_id=1) bypasses all permission checks. Routes with no permission code only require a valid token.

---

## 1. Auth — `/api/auth`

### POST /auth/register
Auth: none (public; intended for admin-driven user creation)
```json
{
  "email": "jane.doe@company.com",
  "password": "Passw0rd!",
  "firstName": "Jane",
  "lastName": "Doe",
  "mobile": "9876543210",
  "roleId": 2,
  "departmentId": 1,
  "designationId": 1,
  "empJobTitle": "Software Engineer"
}
```
Response: `{ data: { user, employee }, message: "Registered successfully" }`

### POST /auth/login
```json
{ "email": "admin@yopmail.com", "password": "Admin@123" }
```
Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": { "userId": 1, "employeeId": 1, "email": "admin@yopmail.com", "roleId": 1, "roleName": "Admin" }
  }
}
```

### POST /auth/refresh
```json
{ "refreshToken": "<refresh_token>" }
```
Response: `{ data: { accessToken: "..." } }`

### POST /auth/forgot-password
```json
{ "email": "jane.doe@company.com" }
```
Response: `{ message: "Password reset instructions sent" }` (returns a reset token in dev mode)

### POST /auth/reset-password
```json
{ "token": "<reset_token>", "newPassword": "NewPassw0rd!" }
```

### POST /auth/change-password
Auth: Bearer
```json
{ "currentPassword": "Admin@123", "newPassword": "NewAdmin@123" }
```

### POST /auth/logout
Auth: Bearer — no body

### GET /auth/me
Auth: Bearer — no body. Returns current user + employee profile.

---

## 2. Employees — `/api/employees`

### GET /employees/directory
Auth: Bearer. Query: `?location=&department=&holidayCalendar=` — lightweight employee directory (name, photo, job title, dept, office).

### GET /employees
Permission: `employees:view`. Query: `?page=&limit=&search=&department_id=&designation_id=&status=`

### GET /employees/:id
Permission: `employees:view`

### POST /employees
Permission: `employees:add`
```json
{
  "emp_code": "EMP00045",
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@company.com",
  "mobile": "9876543210",
  "gender": "Female",
  "dob": "1995-04-12",
  "marital_status": "Single",
  "blood_group": "O+",
  "reporting_to": 3,
  "emp_job_title": "Software Engineer",
  "department_id": 1,
  "designation_id": 1,
  "leadership_role_id": null,
  "office_id": 1,
  "team_id": 2,
  "employee_type": "Full-Time",
  "employee_status": "Active",
  "shift": "general",
  "location": "Hyderabad",
  "holiday_calendar": "India - Default",
  "emp_joining_date": "2026-06-15",
  "emp_exit_date": null,
  "ctc": 1200000,
  "base_salary": 80000,
  "benefits_plan": "standard",
  "assigned_member": null,
  "role_id": 2,
  "password": "Passw0rd!"
}
```
All fields except `first_name` and `email` are optional. If `password`/`role_id` are provided, a linked `users` login is created.

### PUT /employees/:id
Permission: `employees:edit`. Same shape as create, all fields optional.

### DELETE /employees/:id
Permission: `employees:delete`

### GET /employees/:id/contact-info
Permission: `employees:view`

### PUT /employees/:id/contact-info
Permission: `employees:edit`
```json
{
  "current_address": "123 Main St, Hyderabad",
  "permanent_address": "456 Home St, Vizag",
  "personal_email": "jane.personal@gmail.com",
  "alternate_mobile": "9123456780",
  "emergency_contact_name": "John Doe",
  "emergency_contact_relation": "Spouse",
  "emergency_contact_phone": "9123456781"
}
```

### GET /employees/:id/bank-details
Permission: `employees:view`

### PUT /employees/:id/bank-details
Permission: `employees:edit`
```json
{
  "bank_name": "HDFC Bank",
  "account_number": "123456789012",
  "ifsc_code": "HDFC0001234",
  "pan_number": "ABCDE1234F",
  "uan_number": "100123456789"
}
```

---

## 3. Departments — `/api/departments`

### GET /departments
Auth: Bearer. Query: `?page=&limit=`

### GET /departments/:id
Auth: Bearer

### POST /departments
Permission: `settings:add`
```json
{ "department_name": "Engineering", "company_id": 1 }
```

### PUT /departments/:id
Permission: `settings:edit` — same body, all fields optional

### DELETE /departments/:id
Permission: `settings:delete`

---

## 4. Designations — `/api/designations`

Same CRUD shape as departments.

### POST /designations
Permission: `settings:add`
```json
{ "designation_name": "Senior Developer", "department_id": 1 }
```
GET (list/one): Auth only. PUT: `settings:edit`. DELETE: `settings:delete`.

---

## 5. Offices — `/api/offices`

### POST /offices
Permission: `settings:add`
```json
{
  "office_name": "Bangalore Office",
  "location": "Bangalore",
  "address": "MG Road, Bangalore",
  "holiday_calendar": "Karnataka"
}
```
GET (list/one): Auth only. PUT: `settings:edit`. DELETE: `settings:delete`.

---

## 6. Leadership Roles — `/api/leadership-roles`

### POST /leadership-roles
Permission: `settings:add`
```json
{ "role_name": "Team Lead", "description": "Leads a project team" }
```
GET (list/one): Auth only. PUT: `settings:edit`. DELETE: `settings:delete`.

---

## 7. Roles — `/api/roles`

### GET /roles
Auth only. Query: `?page=&limit=`

### GET /roles/:id
Auth only.

### POST /roles
Permission: `settings:add`
```json
{ "role_name": "HR Manager", "description": "Manages HR operations" }
```

### PUT /roles/:id
Permission: `settings:edit` — `{ "role_name": "...", "description": "..." }` (both optional)

### DELETE /roles/:id
Permission: `settings:delete`

---

## 8. Permissions (RBAC) — `/api/permissions`

### GET /permissions
Permission: `settings:view`. Returns the full `permissions` matrix (module x action rows).

### GET /permissions/roles/:roleId
Permission: `settings:view`. Returns:
```json
{
  "data": {
    "roleId": 3,
    "roleName": "Reporting Manager",
    "permissions": {
      "employees": { "view": true, "add": false, "edit": false, "delete": false },
      "attendance": { "view": true, "add": true, "edit": true, "delete": false },
      "...": "..."
    }
  }
}
```

### PUT /permissions/roles/:roleId
Permission: `settings:edit`
```json
{
  "permissions": [
    { "module": "leave", "action": "edit", "allowed": true },
    { "module": "payroll", "action": "view", "allowed": false }
  ]
}
```

---

## 9. Teams — `/api/teams`

### GET /teams
Permission: `teams:view`. Query: `?page=&limit=&department_id=&search=`

### GET /teams/:id
Permission: `teams:view`. Returns team details with `members[]`.

### POST /teams
Permission: `teams:add`
```json
{
  "team_name": "Platform Squad",
  "department_id": 1,
  "description": "Owns core platform services",
  "lead_employee_id": 5
}
```

### PUT /teams/:id
Permission: `teams:edit` — same body, all optional

### DELETE /teams/:id
Permission: `teams:delete`

### GET /teams/:id/members
Permission: `teams:view`

### POST /teams/:id/members
Permission: `teams:edit`
```json
{ "employee_id": 12, "title": "Backend Engineer", "is_lead": false }
```

### PUT /teams/:id/members/:employeeId
Permission: `teams:edit`
```json
{ "title": "Tech Lead", "is_lead": true }
```

### DELETE /teams/:id/members/:employeeId
Permission: `teams:edit`

---

## 10. Attendance — `/api/attendance`

### POST /attendance/check-in
Auth: Bearer (self-service)
```json
{ "date": "2026-06-14", "time": "09:25:00", "shift_start": "09:30:00" }
```
All fields optional (defaults to today / now / `09:30:00`). Calls `sp_employee_checkin`.

### POST /attendance/check-out
Auth: Bearer
```json
{ "date": "2026-06-14", "time": "18:30:00" }
```
Calls `sp_employee_checkout`.

### GET /attendance/me/today
Auth: Bearer — today's attendance record for the logged-in employee.

### GET /attendance/me/monthly
Auth: Bearer. Query: `?month=6&year=2026`

### GET /attendance
Permission: `attendance:view`. Query: `?page=&limit=&employee_id=&department_id=&from_date=&to_date=&status=`

### GET /attendance/dashboard
Permission: `attendance:view`. Query: `?date=2026-06-14` (defaults to today). Calls `sp_attendance_dashboard`.

### GET /attendance/team-leave-calendar
Permission: `attendance:view`. Query: `?year=2026&month=6`. Calls `sp_team_leave_calendar`.

### GET /attendance/employees/:employeeId/today
Permission: `attendance:view`

### GET /attendance/employees/:employeeId/monthly
Permission: `attendance:view`. Query: `?month=6&year=2026`

### GET /attendance/regularizations
Permission: `attendance:view`. Query: `?page=&limit=&employee_id=&status=`

### POST /attendance/regularizations
Auth: Bearer
```json
{
  "employee_id": 12,
  "attendance_date": "2026-06-10",
  "requested_check_in": "09:15:00",
  "requested_check_out": "18:45:00",
  "reason": "Forgot to check in due to client meeting"
}
```

### PUT /attendance/regularizations/:id/review
Permission: `attendance:edit`
```json
{ "decision": "Approved", "remarks": "Verified with manager" }
```

---

## 11. Leave Types — `/api/leave-types`

### GET /leave-types
Auth only. Query: `?page=&limit=`

### GET /leave-types/:id
Auth only.

### POST /leave-types
Permission: `leave:add`
```json
{
  "leave_type_name": "Sick Leave",
  "annual_quota": 10,
  "carry_forward_limit": 0,
  "requires_proof": true,
  "description": "10 days/year, medical proof required for 3+ days"
}
```

### PUT /leave-types/:id
Permission: `leave:edit` — same body, all optional

### DELETE /leave-types/:id
Permission: `leave:delete`

---

## 12. Holidays — `/api/holidays`

### GET /holidays
Auth only. Query: `?page=&limit=&year=2026&holiday_calendar=India - Default`

### GET /holidays/:id
Auth only.

### POST /holidays
Permission: `leave:add`
```json
{
  "holiday_name": "Independence Day",
  "holiday_date": "2026-08-15",
  "holiday_calendar": "India - Default",
  "is_restricted": false
}
```

### PUT /holidays/:id
Permission: `leave:edit` — same body, all optional

### DELETE /holidays/:id
Permission: `leave:delete`

---

## 13. Leave Requests — `/api/leave-requests`

### GET /leave-requests/me
Auth: Bearer. Query: `?page=&limit=&status=`

### GET /leave-requests/me/balances
Auth: Bearer. Query: `?year=2026`

### POST /leave-requests
Auth: Bearer (apply for leave)
```json
{
  "leave_type_id": 1,
  "from_date": "2026-06-20",
  "from_session": "Full Day",
  "to_date": "2026-06-22",
  "to_session": "Full Day",
  "days": 3,
  "reason": "Family function"
}
```
Calls `sp_apply_leave`.

### PUT /leave-requests/:id/cancel
Auth: Bearer — self-service cancel of own pending request, no body.

### GET /leave-requests
Permission: `leave:view`. Query: `?page=&limit=&employee_id=&status=&leave_type_id=&department_id=`

### GET /leave-requests/:id
Permission: `leave:view`

### GET /leave-requests/employees/:employeeId/balances
Permission: `leave:view`. Query: `?year=2026`

### PUT /leave-requests/:id/review
Permission: `leave:edit`
```json
{ "decision": "Approved", "remarks": "Approved by manager" }
```
Calls `sp_review_leave_request`.

---

## 14. Payroll — `/api/payroll`

### GET /payroll/payslips/me
Auth: Bearer. Query: `?page=&limit=&month=&year=`

### GET /payroll/salary-structures/me
Auth: Bearer — latest salary structure for the logged-in employee.

### GET /payroll/salary-structures
Permission: `payroll:view`. Query: `?page=&limit=&employee_id=`

### GET /payroll/salary-structures/:id
Permission: `payroll:view`

### GET /payroll/salary-structures/employees/:employeeId/latest
Permission: `payroll:view`

### POST /payroll/salary-structures
Permission: `payroll:add`
```json
{
  "employee_id": 12,
  "basic": 40000,
  "hra": 16000,
  "conveyance": 1600,
  "medical_allowance": 1250,
  "special_allowance": 5000,
  "pf_employee": 1800,
  "pf_employer": 1800,
  "professional_tax": 200,
  "income_tax": 0,
  "ctc": 800000,
  "effective_from": "2026-04-01"
}
```

### PUT /payroll/salary-structures/:id
Permission: `payroll:edit` — same body, all optional

### DELETE /payroll/salary-structures/:id
Permission: `payroll:delete`

### GET /payroll/payslips
Permission: `payroll:view`. Query: `?page=&limit=&employee_id=&month=&year=&status=&department_id=&payroll_run_id=`

### GET /payroll/payslips/:id
Permission: `payroll:view`

### POST /payroll/payslips/generate
Permission: `payroll:add`
```json
{ "employee_id": 12, "month": 5, "year": 2026 }
```
Calls `sp_generate_payslip`.

### PUT /payroll/payslips/:id/mark-paid
Permission: `payroll:edit` — no body.

### GET /payroll/runs
Permission: `payroll:view`. Query: `?page=&limit=&year=&status=`

### GET /payroll/runs/:id
Permission: `payroll:view` — includes nested `payslips[]`.

### POST /payroll/runs
Permission: `payroll:add`
```json
{ "month": 5, "year": 2026 }
```
Calls `sp_run_payroll` (generates payslips for all active employees for the period).

---

## 15. Hiring — `/api/hiring`

### Jobs

#### GET /hiring/jobs
Auth: Bearer. Query: `?page=&limit=&status=&department_id=&search=`

#### GET /hiring/jobs/:id
Auth: Bearer — includes `application_count`.

#### POST /hiring/jobs
Permission: `hiring:add`
```json
{
  "title": "Backend Engineer",
  "department_id": 1,
  "location": "Hyderabad",
  "employment_type": "Full-Time",
  "description": "We are looking for...",
  "status": "Open",
  "posted_on": "2026-06-14",
  "closing_date": "2026-07-14"
}
```

#### PUT /hiring/jobs/:id
Permission: `hiring:edit` — same body, all optional

#### DELETE /hiring/jobs/:id
Permission: `hiring:delete`

### Applications

#### GET /hiring/applications
Permission: `hiring:view`. Query: `?page=&limit=&job_id=&status=&search=`

#### GET /hiring/applications/:id
Permission: `hiring:view`

#### POST /hiring/applications
Auth: Bearer (public-facing apply flow)
```json
{
  "job_id": 3,
  "applicant_name": "Ravi Kumar",
  "email": "ravi.kumar@example.com",
  "mobile": "9988776655",
  "resume_url": "/uploads/resume_ravi.pdf",
  "source": "LinkedIn",
  "applicant_employee_id": null
}
```

#### PUT /hiring/applications/:id/status
Permission: `hiring:edit`
```json
{ "status": "Shortlisted" }
```
Valid values: `Applied | Shortlisted | Interview | Offered | Rejected | Hired`

### Referrals

#### GET /hiring/referrals/me
Auth: Bearer. Query: `?page=&limit=&status=`

#### GET /hiring/referrals
Permission: `hiring:view`. Query: `?page=&limit=&job_id=&status=`

#### GET /hiring/referrals/:id
Permission: `hiring:view`

#### POST /hiring/referrals
Auth: Bearer
```json
{
  "job_id": 3,
  "candidate_name": "Anita Sharma",
  "candidate_email": "anita@example.com",
  "candidate_mobile": "9876501234",
  "resume_url": "/uploads/resume_anita.pdf"
}
```

#### PUT /hiring/referrals/:id/status
Permission: `hiring:edit`
```json
{ "status": "Interview" }
```
Valid values: `Submitted | Shortlisted | Interview | Hired | Rejected`

---

## 16. Reviews — `/api/reviews`

### Review Types (lookup)

#### GET /reviews/types
Auth: Bearer. Query: `?page=&limit=`

#### GET /reviews/types/:id
Auth: Bearer

#### POST /reviews/types
Permission: `reviews:add`
```json
{ "name": "Annual Performance Review", "description": "Yearly evaluation", "frequency": "Annual" }
```

#### PUT /reviews/types/:id
Permission: `reviews:edit` — same body, all optional

#### DELETE /reviews/types/:id
Permission: `reviews:delete`

### Self-service

#### GET /reviews/me
Auth: Bearer — reviews about the logged-in employee. Query: `?page=&limit=&status=`

#### GET /reviews/to-review
Auth: Bearer — reviews the logged-in employee must complete as a reviewer.

#### PUT /reviews/:id/submit
Auth: Bearer
```json
{ "overall_rating": 4.5, "comments": "Strong quarter, exceeded targets." }
```

### Admin / manager

#### GET /reviews
Permission: `reviews:view`. Query: `?page=&limit=&employee_id=&reviewer_id=&status=&review_type_id=`

#### GET /reviews/:id
Permission: `reviews:view`

#### POST /reviews
Permission: `reviews:add`
```json
{
  "review_type_id": 1,
  "employee_id": 12,
  "reviewer_id": 5,
  "cycle_start": "2026-01-01",
  "cycle_end": "2026-06-30",
  "due_date": "2026-07-10"
}
```

#### PUT /reviews/:id
Permission: `reviews:edit` — same body (all optional) plus:
```json
{ "status": "In Progress" }
```
Valid status: `Pending | In Progress | Submitted | Completed`

#### PUT /reviews/:id/complete
Permission: `reviews:edit` — no body.

#### DELETE /reviews/:id
Permission: `reviews:delete`

---

## 17. Helpdesk — `/api/helpdesk`

### GET /helpdesk/me
Auth: Bearer. Query: `?page=&limit=&status=`

### POST /helpdesk
Auth: Bearer (create ticket)
```json
{
  "category": "IT",
  "subject": "Laptop not booting",
  "description": "Laptop shows blue screen on startup",
  "priority": "High",
  "attachment_url": null
}
```

### POST /helpdesk/:id/comments
Auth: Bearer
```json
{ "comment": "I restarted it but the issue persists." }
```

### GET /helpdesk
Permission: `helpdesk:view`. Query: `?page=&limit=&employee_id=&status=&priority=&category=&assigned_to=&search=`

### GET /helpdesk/:id
Auth: Bearer — includes `comments[]`.

### PUT /helpdesk/:id/status
Permission: `helpdesk:edit`
```json
{ "status": "Resolved" }
```
Valid values: `Open | In Progress | Resolved | Closed`

### PUT /helpdesk/:id/assign
Permission: `helpdesk:edit`
```json
{ "assigned_to": 7 }
```

---

## 18. Documents — `/api/documents`

### Categories (lookup)

#### GET /documents/categories
Auth: Bearer. Query: `?page=&limit=`

#### GET /documents/categories/:id
Auth: Bearer

#### POST /documents/categories
Permission: `documents:add`
```json
{ "category_name": "policies" }
```

#### PUT /documents/categories/:id
Permission: `documents:edit` — same body

#### DELETE /documents/categories/:id
Permission: `documents:delete`

### Documents

#### GET /documents/me
Auth: Bearer — documents visible to the logged-in employee (own + `visibility: all`).

#### GET /documents
Permission: `documents:view`. Query: `?page=&limit=&employee_id=&category_id=&visibility=&search=`

#### GET /documents/:id
Auth: Bearer

#### POST /documents
Permission: `documents:add`. **Content-Type: multipart/form-data**

Form fields:
| field | type | notes |
|---|---|---|
| `file` | file | the document to upload (required) |
| `title` | text | required, max 150 chars |
| `description` | text | optional |
| `category_id` | text/number | optional |
| `visibility` | text | `all` \| `admin` \| `employee` (default `all`) |
| `employee_id` | text/number | optional — owner employee |

#### PUT /documents/:id
Permission: `documents:edit`
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "category_id": 2,
  "visibility": "employee",
  "employee_id": 12
}
```
All fields optional.

#### DELETE /documents/:id
Permission: `documents:delete`

---

## 19. Companies — `/api/companies`

### GET /companies
Auth: Bearer. Query: `?page=&limit=`

### GET /companies/:id
Auth: Bearer

### POST /companies
Permission: `settings:add`
```json
{ "company_name": "NAT IT Services", "address": "Hyderabad, India", "email": "info@natit.com", "phone": "+91-40-12345678" }
```

### PUT /companies/:id
Permission: `settings:edit` — same body, all optional

### DELETE /companies/:id
Permission: `settings:delete`

---

## 20. Calendar Events — `/api/calendar-events`

### GET /calendar-events
Auth: Bearer. Query: `?page=&limit=&month=&year=&event_type=`

### GET /calendar-events/:id
Auth: Bearer

### POST /calendar-events
Permission: `settings:add`
```json
{
  "title": "Company All-Hands",
  "description": "Quarterly town hall",
  "event_date": "2026-07-01",
  "event_type": "Meeting"
}
```

### PUT /calendar-events/:id
Permission: `settings:edit` — same body, all optional

### DELETE /calendar-events/:id
Permission: `settings:delete`

---

## 21. Workflow Delegates — `/api/workflow-delegates`

### GET /workflow-delegates/me
Auth: Bearer — delegations where the logged-in employee is either the delegator or the delegate.

### POST /workflow-delegates
Auth: Bearer
```json
{
  "delegate_employee_id": 9,
  "module": "leave",
  "from_date": "2026-06-20",
  "to_date": "2026-06-27"
}
```
`employee_id` defaults to the logged-in employee if omitted. `module` defaults to `all`.

### PUT /workflow-delegates/:id/cancel
Auth: Bearer — no body.

### GET /workflow-delegates
Permission: `settings:view`. Query: `?page=&limit=&employee_id=&status=`

### GET /workflow-delegates/:id
Permission: `settings:view`

---

## 22. Request Hub — `/api/request-hub`

### GET /request-hub/me
Auth: Bearer. Query: `?page=&limit=&status=&request_type=`

### POST /request-hub
Auth: Bearer
```json
{
  "request_type": "Asset Request",
  "title": "New laptop request",
  "description": "Current laptop is 5 years old and slow."
}
```

### GET /request-hub
Permission: `settings:view`. Query: `?page=&limit=&employee_id=&status=&request_type=`

### GET /request-hub/:id
Auth: Bearer

### PUT /request-hub/:id/status
Permission: `settings:edit`
```json
{ "status": "Approved" }
```
Valid values: `Pending | Approved | Rejected | Completed`

---

## 23. Reports — `/api/reports` (all require `reports:view`)

### GET /reports/employees
No params. Returns `{ byStatus[], byDepartment[], byType[] }`.

### GET /reports/attendance
Query: `?from_date=2026-06-01&to_date=2026-06-30&department_id=1`
Returns `{ summary[], details[] }` (details capped at 500 rows).

### GET /reports/leave
Query: `?year=2026&department_id=1&status=Approved`
Returns `{ summary[], details[] }`.

### GET /reports/payroll
Query: `?month=5&year=2026&department_id=1`
Returns `{ summary[], details[] }`.

### GET /reports/helpdesk
Query: `?from_date=2026-06-01&to_date=2026-06-30`
Returns `{ byStatus[], byCategory[], byPriority[] }`.

### GET /reports/hiring
No params. Returns `{ jobsByStatus[], applicationsByStatus[], referralsByStatus[], openJobs[] }`.

### GET /reports/reviews
Query: `?review_type_id=1&status=Completed`
Returns `{ byStatus[], details[] }`.

---

## 24. Dashboard — `/api/dashboard` (any authenticated user)

### GET /dashboard/stats
No params. Calls `sp_dashboard_stats`. Returns counters:
```json
{
  "employees_count": 120,
  "companies_count": 2,
  "pending_leaves_count": 4,
  "salaries_count": 118,
  "open_tickets_count": 6,
  "open_jobs_count": 3
}
```

### GET /dashboard/attendance
Query: `?date=2026-06-14` (defaults to today). Calls `sp_attendance_dashboard`.

### GET /dashboard/team-leave-calendar
Query: `?year=2026&month=6`. Calls `sp_team_leave_calendar`.

### GET /dashboard/events
Query: `?month=6` (defaults to current month). Returns employees with birthdays or work anniversaries that month.

### GET /dashboard/recent-activities
Query: `?limit=10`. Returns recent `audit_logs` entries.
