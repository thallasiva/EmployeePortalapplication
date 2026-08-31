@echo off
setlocal enabledelayedexpansion
title HRMS Full Production Deployment
echo ==================================================
echo HRMS FULL PRODUCTION DEPLOYMENT
echo  - Uploads all SQL procedure files
echo  - Deploys all stored procedures to RDS
echo  - Adds audit-logs route
echo  - Restarts backend
echo Server: ubuntu@18.234.111.185
echo ==================================================
echo.

set SERVER=ubuntu@18.234.111.185
set BACKEND=/var/EmployeePortalapplication/backend
set DB_DIR=%BACKEND%/database
set THIS=%~dp0

REM Find SSH key
set KEY=
for %%K in (
  "%USERPROFILE%\.ssh\id_rsa"
  "%USERPROFILE%\.ssh\sai-keypair.pem"
  "C:\TimeSheet\sai-keypair.pem"
  "C:\TimeSheet\private_key.pem"
  "%USERPROFILE%\Desktop\sai-keypair.pem"
  "%USERPROFILE%\Downloads\sai-keypair.pem"
  "%USERPROFILE%\Downloads\private_key.pem"
  "%USERPROFILE%\.ssh\id_ed25519"
) do (
  if exist %%K (set KEY=%%K & goto :found_key)
)
for %%F in ("%USERPROFILE%\Downloads\*.pem") do (set KEY=%%F & goto :found_key)
echo No SSH key found. Enter full path:
set /p KEY="> "
if not exist "!KEY!" (echo Key not found. & pause & exit /b 1)

:found_key
icacls "!KEY!" /inheritance:r /grant:r "%USERNAME%":R >nul 2>&1
set SSH=ssh -o StrictHostKeyChecking=no -i "!KEY!" %SERVER%
set SCP=scp -o StrictHostKeyChecking=no -i "!KEY!"

echo Using key: !KEY!
echo.

REM ── Step 1: Test SSH ──────────────────────────────────────────
echo [1/6] Testing SSH connection...
%SSH% "echo Connected OK"
if %errorlevel% neq 0 (echo SSH FAILED & pause & exit /b 1)

REM ── Step 2: Upload SQL files ──────────────────────────────────
echo.
echo [2/6] Uploading SQL and JS files...
%SSH% "mkdir -p %DB_DIR%"

echo   Uploading deploy_all_procs.js...
%SCP% "%THIS%deploy_all_procs.js"                     %SERVER%:%DB_DIR%/deploy_all_procs.js

echo   Uploading create_missing_procs.sql...
%SCP% "%THIS%create_missing_procs.sql"                %SERVER%:%DB_DIR%/create_missing_procs.sql

echo   Uploading all_procedures.sql...
%SCP% "%THIS%all_procedures.sql"                      %SERVER%:%DB_DIR%/all_procedures.sql

echo   Uploading migration_034_recruitment_procedures.sql...
%SCP% "%THIS%migration_034_recruitment_procedures.sql" %SERVER%:%DB_DIR%/migration_034_recruitment_procedures.sql

echo   Uploading patches...
%SCP% "%THIS%patch_auth_procedures.sql"               %SERVER%:%DB_DIR%/patch_auth_procedures.sql
%SCP% "%THIS%patch_sp_list_candidates.sql"            %SERVER%:%DB_DIR%/patch_sp_list_candidates.sql
%SCP% "%THIS%patch_rec_admin_dashboard_shortlisted.sql" %SERVER%:%DB_DIR%/patch_rec_admin_dashboard_shortlisted.sql
%SCP% "%THIS%patch_rec_list_candidates_interview_feedback.sql" %SERVER%:%DB_DIR%/patch_rec_list_candidates_interview_feedback.sql
%SCP% "%THIS%patch_rec_interviews_candidate_type.sql" %SERVER%:%DB_DIR%/patch_rec_interviews_candidate_type.sql
%SCP% "%THIS%patch_rec_interviews_duration.sql"       %SERVER%:%DB_DIR%/patch_rec_interviews_duration.sql
%SCP% "%THIS%patch_rec_interviews_enum.sql"           %SERVER%:%DB_DIR%/patch_rec_interviews_enum.sql
%SCP% "%THIS%patch_interview_recruiter_feedback.sql"  %SERVER%:%DB_DIR%/patch_interview_recruiter_feedback.sql
%SCP% "%THIS%patch_sp_feedback_progression.sql"       %SERVER%:%DB_DIR%/patch_sp_feedback_progression.sql
%SCP% "%THIS%patch_resume_match.sql"                  %SERVER%:%DB_DIR%/patch_resume_match.sql
%SCP% "%THIS%patch_resume_parser_procedures.sql"      %SERVER%:%DB_DIR%/patch_resume_parser_procedures.sql
%SCP% "%THIS%patch_salary_assignment_sps.sql"         %SERVER%:%DB_DIR%/patch_salary_assignment_sps.sql
%SCP% "%THIS%patch_managers_list.sql"                 %SERVER%:%DB_DIR%/patch_managers_list.sql
%SCP% "%THIS%patch_joining_get_invitation.sql"        %SERVER%:%DB_DIR%/patch_joining_get_invitation.sql
%SCP% "%THIS%patch_joining_review_fix_mysql.sql"      %SERVER%:%DB_DIR%/patch_joining_review_fix_mysql.sql
%SCP% "%THIS%patch_joining_doc_uploads.sql"           %SERVER%:%DB_DIR%/patch_joining_doc_uploads.sql
%SCP% "%THIS%patch_joining_verify_token_mobile.sql"   %SERVER%:%DB_DIR%/patch_joining_verify_token_mobile.sql
%SCP% "%THIS%patch_joining_token_expiry_fix.sql"      %SERVER%:%DB_DIR%/patch_joining_token_expiry_fix.sql
%SCP% "%THIS%patch_ALL_run_once.sql"                  %SERVER%:%DB_DIR%/patch_ALL_run_once.sql
%SCP% "%THIS%patch_stored_procedure_runtime_queries.sql" %SERVER%:%DB_DIR%/patch_stored_procedure_runtime_queries.sql

echo   Uploading new route files...
%SCP% "%THIS%..\src\routes\auditLog.routes.js"        %SERVER%:%BACKEND%/src/routes/auditLog.routes.js
%SCP% "%THIS%..\src\routes\index.js"                  %SERVER%:%BACKEND%/src/routes/index.js

REM ── Step 3: Deploy procedures ─────────────────────────────────
echo.
echo [3/6] Deploying stored procedures to RDS (this takes ~30s)...
%SSH% "cd %BACKEND% && node database/deploy_all_procs.js 2>&1"

REM ── Step 4: Verify procedure count ───────────────────────────
echo.
echo [4/6] Verifying procedure count...
%SSH% "cd %BACKEND% && node -e \"require('dotenv').config(); const m=require('mysql2/promise'); m.createConnection({host:process.env.DB_HOST,port:process.env.DB_PORT,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME}).then(async c=>{const [r]=await c.query(\\\"SELECT COUNT(*) AS n FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA='hrms_db'\\\");console.log('Procedures in DB:',r[0].n);c.end()})\" 2>&1"

REM ── Step 4b: Fix CORS origin on production ──────────────────────────
echo.
echo [4b/6] Fixing CORS and env on production...
%SSH% "cd %BACKEND% && (grep -q CLIENT_ORIGIN .env && sed -i 's|^CLIENT_ORIGIN=.*|CLIENT_ORIGIN=*|' .env || echo CLIENT_ORIGIN=* >> .env) && echo CLIENT_ORIGIN fixed"

REM ── Step 5: Restart backend ───────────────────────────────────
echo.
echo [5/6] Restarting backend...
%SSH% "cd %BACKEND% && (pm2 restart all 2>/dev/null; sleep 2; pm2 list 2>/dev/null) || (pkill -f 'node.*index.js' 2>/dev/null; sleep 1; nohup node src/index.js > /tmp/hrms_backend.log 2>&1 & echo Backend started)"
timeout /t 5 /nobreak >nul

REM ── Step 6: Smoke test ────────────────────────────────────────
echo.
echo [6/6] Smoke testing APIs...
%SSH% "curl -s -w '\n' -o /dev/null -D - http://localhost:5000/api/dashboard/stats -H 'Authorization: Bearer INVALID' 2>&1 | head -2"
echo.
echo Expected: 401 (auth working - proc exists now)
echo.
%SSH% "curl -s http://localhost:5000/api/settings/smtp 2>&1 | head -c 100"
echo.

echo.
echo ==================================================
echo DEPLOYMENT COMPLETE
echo ==================================================
echo.
echo NEXT STEPS:
echo  1. Rebuild frontend: cd C:\TimeSheet\humanresourceshradmintemplate ^& npm run build
echo  2. Upload build to production server
echo  3. Test all APIs in browser
echo ==================================================
pause
