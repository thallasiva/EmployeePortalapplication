# HRMS Backend

Node.js + Express + MySQL REST API for the HRMS frontend (`humanresourceshradmintemplate`). Covers Core HR, Attendance & Leave, Payroll, Hiring & Reviews, Helpdesk & Documents, Teams, Settings/RBAC, Reports and Dashboards.

## 1. Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm

## 2. Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your MySQL credentials and secrets:

```
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hrms_db
DB_CONNECTION_LIMIT=10

JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=change_this_to_another_long_random_secret
JWT_REFRESH_EXPIRES_IN=7d

UPLOAD_DIR=uploads
MAX_UPLOAD_MB=10
```

## 3. Initialize the database

This creates the `hrms_db` database, all tables, stored procedures, and seed data (including a default admin login).

```bash
npm run db:init
```

This runs `database/schema.sql`, `database/procedures.sql`, and `database/seed.sql` in order. You can also run them manually with the MySQL client:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/procedures.sql
mysql -u root -p < database/seed.sql
```

### Default admin login (seeded)

- Email: `admin@yopmail.com`
- Password: `Admin@123`
- Role: Admin (full access)

Change this password after first login via `POST /api/auth/change-password`.

## 4. Run the server

```bash
npm run dev    # nodemon, auto-restart
# or
npm start      # plain node
```

The API is served at `http://localhost:5000/api`. Health check: `GET /health`.

Uploaded files (resumes, documents, profile photos) are served from `/uploads/<filename>` and stored on disk under `backend/uploads/` (created automatically).

## 5. Authentication

All endpoints except `/api/auth/*` require a Bearer access token:

```
Authorization: Bearer <accessToken>
```

- `POST /api/auth/register` - create a user (admin-only in practice; first admin comes from seed)
- `POST /api/auth/login` - returns `{ accessToken, refreshToken, user }`
- `POST /api/auth/refresh` - exchange a refresh token for a new access token
- `GET  /api/auth/me` - current user profile
- `POST /api/auth/change-password`
- `POST /api/auth/forgot-password` / `POST /api/auth/reset-password`
- `POST /api/auth/logout`

## 6. Roles & Permissions

Seeded roles:

| role_id | Role              | Notes                                              |
|---------|-------------------|----------------------------------------------------|
| 1       | Admin             | Full access to every module/action                  |
| 2       | Employee          | View access everywhere + add on leave/attendance/helpdesk/hiring |
| 3       | Reporting Manager | View access everywhere + add/edit on leave/attendance/reviews/teams/helpdesk |

Fine-grained permissions live in `permissions` (module x action: view/add/edit/delete) and `role_permissions`. Manage them via:

- `GET  /api/permissions` - list permission matrix
- `GET  /api/permissions/roles/:roleId` - permissions for a role
- `PUT  /api/permissions/roles/:roleId` - update a role's permissions (admin only)
- `GET/POST/PUT/DELETE /api/roles` - manage roles

## 7. API Modules

All list endpoints support pagination via `?page=&limit=` and return `{ success, data, message, meta: { page, limit, total, totalPages } }`.

| Module              | Base path                  |
|---------------------|-----------------------------|
| Auth                | `/api/auth`                |
| Employees           | `/api/employees`           |
| Departments         | `/api/departments`         |
| Designations        | `/api/designations`        |
| Offices             | `/api/offices`             |
| Leadership Roles    | `/api/leadership-roles`    |
| Roles               | `/api/roles`               |
| Permissions         | `/api/permissions`         |
| Teams               | `/api/teams`               |
| Attendance          | `/api/attendance`          |
| Leave Types         | `/api/leave-types`         |
| Holidays            | `/api/holidays`            |
| Leave Requests      | `/api/leave-requests`      |
| Payroll             | `/api/payroll`             |
| Hiring (jobs/applications/referrals) | `/api/hiring` |
| Reviews             | `/api/reviews`             |
| Helpdesk            | `/api/helpdesk`            |
| Documents           | `/api/documents`           |
| Companies           | `/api/companies`           |
| Calendar Events     | `/api/calendar-events`     |
| Workflow Delegates  | `/api/workflow-delegates`  |
| Request Hub         | `/api/request-hub`         |
| Reports             | `/api/reports`             |
| Dashboard           | `/api/dashboard`           |

### Self-service ("me") endpoints

Most modules expose a `/me` (or `/me/...`) route that scopes data to the logged-in employee without needing module permissions, e.g.:

- `GET /api/attendance/me/today`, `GET /api/attendance/me/monthly`
- `POST /api/attendance/check-in`, `POST /api/attendance/check-out`
- `GET /api/leave-requests/me`, `GET /api/leave-requests/me/balances`, `POST /api/leave-requests` (apply), `PUT /api/leave-requests/:id/cancel`
- `GET /api/payroll/payslips/me`, `GET /api/payroll/salary-structures/me`
- `GET /api/reviews/me`, `GET /api/reviews/to-review`, `PUT /api/reviews/:id/submit`
- `GET /api/helpdesk/me`, `POST /api/helpdesk` (create ticket), `POST /api/helpdesk/:id/comments`
- `GET /api/documents/me`
- `GET /api/workflow-delegates/me`
- `GET /api/request-hub/me`, `POST /api/request-hub`

### Reports (`/api/reports`, requires `reports:view`)

- `GET /api/reports/employees` - headcount by status/department/type
- `GET /api/reports/attendance?from_date=&to_date=&department_id=`
- `GET /api/reports/leave?year=&department_id=&status=`
- `GET /api/reports/payroll?month=&year=&department_id=`
- `GET /api/reports/helpdesk?from_date=&to_date=`
- `GET /api/reports/hiring`
- `GET /api/reports/reviews?review_type_id=&status=`

### Dashboard (`/api/dashboard`, any authenticated user)

- `GET /api/dashboard/stats` - overall counters (employees, companies, pending leaves, salaries, open tickets, open jobs) via `sp_dashboard_stats`
- `GET /api/dashboard/attendance?date=` - daily attendance breakdown via `sp_attendance_dashboard`
- `GET /api/dashboard/team-leave-calendar?year=&month=` - via `sp_team_leave_calendar`
- `GET /api/dashboard/events?month=` - birthdays & work anniversaries
- `GET /api/dashboard/recent-activities?limit=` - recent audit log entries

## 8. Project Structure

```
backend/
  database/
    schema.sql       # tables
    procedures.sql   # stored procedures
    seed.sql         # roles, permissions, lookups, default admin
  src/
    config/          # env, db pool
    controllers/      # request handlers
    middleware/       # auth, rbac, validation, upload, error handling
    routes/           # express routers (mounted in routes/index.js)
    services/         # business logic & SQL queries
    validators/        # Joi schemas
    utils/             # ApiError, ApiResponse, pagination, jwt, hash, logger
    database/runSql.js # db:init script
    app.js / server.js
  uploads/            # uploaded files (created at runtime)
  .env.example
```

## 9. Error & Response Format

Success:
```json
{ "success": true, "data": ..., "message": "...", "meta": { ... } }
```

Error:
```json
{ "success": false, "message": "...", "errors": [ ... ] }
```

## 10. Stored Procedures Used

- `sp_apply_leave`, `sp_review_leave_request` - leave workflow
- `sp_employee_checkin`, `sp_employee_checkout` - attendance
- `sp_attendance_dashboard`, `sp_team_leave_calendar` - dashboards
- `sp_generate_payslip`, `sp_run_payroll` - payroll
- `sp_dashboard_stats` - home dashboard counters
