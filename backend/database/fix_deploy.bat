@echo off
setlocal enabledelayedexpansion
title HRMS Fix Deploy
echo ==================================================
echo HRMS Fix: Route Files + DB Procedures
echo ==================================================

set SERVER=ubuntu@18.234.111.185
set BACKEND=/var/EmployeePortalapplication/backend
set KEY="C:\Users\Siva\.ssh\id_rsa"
set SSH=ssh -o StrictHostKeyChecking=no -i %KEY% %SERVER%
set SCP=scp -o StrictHostKeyChecking=no -i %KEY%

echo [1/4] Re-uploading route files to /tmp...
%SCP% "%~dp0..\src\routes\auditLog.routes.js" %SERVER%:/tmp/auditLog.routes.js
%SCP% "%~dp0..\src\routes\index.js" %SERVER%:/tmp/index_routes.js

echo [2/4] Copying route files with sudo...
%SSH% "sudo cp /tmp/auditLog.routes.js %BACKEND%/src/routes/auditLog.routes.js && sudo cp /tmp/index_routes.js %BACKEND%/src/routes/index.js && sudo chmod 644 %BACKEND%/src/routes/auditLog.routes.js %BACKEND%/src/routes/index.js && echo routes OK"

echo [3/4] Deploying procedures with explicit DB creds...
%SSH% "BACKEND_DIR=%BACKEND% DB_HOST=hrms.c02gczm2cgx8.us-east-1.rds.amazonaws.com DB_PORT=4306 DB_USER=HRMSadmin DB_PASSWORD=HwULGJ6gbxQIhzwNeZ9L DB_NAME=hrms_db node /tmp/deploy_all_procs.js 2>&1"

echo [4/4] Restarting backend...
%SSH% "pm2 restart all --update-env 2>/dev/null || pm2 start %BACKEND%/src/index.js --name hrms-backend"
timeout /t 5 /nobreak >nul

echo --- Smoke tests ---
%SSH% "curl -s -o /dev/null -w 'Stats API: HTTP%%{http_code}\n' http://localhost:5000/api/dashboard/stats -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Rec Dashboard: HTTP%%{http_code}\n' http://localhost:5000/api/recruitment/dashboard -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Joining List: HTTP%%{http_code}\n' http://localhost:5000/api/joining -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Audit Logs: HTTP%%{http_code}\n' http://localhost:5000/api/audit-logs -H 'Authorization: Bearer test'"

echo.
echo ==================================================
echo DONE
echo ==================================================
pause
