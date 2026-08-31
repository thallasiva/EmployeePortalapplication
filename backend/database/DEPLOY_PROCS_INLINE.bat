@echo off
setlocal enabledelayedexpansion
title HRMS Procedure Deployment
echo ==================================================
echo HRMS Stored Procedure Deployment
echo ==================================================

set SERVER=ubuntu@18.234.111.185
set BACKEND=/var/EmployeePortalapplication/backend
set LOGFILE=%~dp0deploy_output.log
echo Log: %LOGFILE%

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
echo Using key: !KEY! > "%LOGFILE%"

echo.
echo [1/5] Testing SSH connection...
%SSH% "echo Connected OK"
if %errorlevel% neq 0 (echo SSH FAILED & pause & exit /b 1)

echo.
echo [2/5] Checking server SQL files...
%SSH% "ls %BACKEND%/database/ 2>/dev/null | grep -c '.sql' && echo sql files exist on server"

echo.
echo [3/5] Uploading deploy script to /tmp...
%SCP% "%~dp0deploy_all_procs.js" %SERVER%:/tmp/deploy_all_procs.js
echo SCP deploy script exit: %errorlevel%

echo.
echo [4/5] Uploading create_missing_procs.sql...
%SCP% "%~dp0create_missing_procs.sql" %SERVER%:/tmp/create_missing_procs.sql
%SSH% "cp /tmp/create_missing_procs.sql %BACKEND%/database/create_missing_procs.sql 2>/dev/null && echo copied || echo copy failed"

echo.
echo [5/5] Running procedure deployment on server (takes 30-60s)...
echo --- NODE OUTPUT --- >> "%LOGFILE%"
%SSH% "BACKEND_DIR=%BACKEND% node /tmp/deploy_all_procs.js 2>&1" >> "%LOGFILE%" 2>&1
echo --- END NODE OUTPUT --- >> "%LOGFILE%"

echo.
echo Checking output...
type "%LOGFILE%"

echo.
echo --- Fixing CORS in .env ---
%SSH% "cd %BACKEND% && grep -q CLIENT_ORIGIN .env && sed -i 's|^CLIENT_ORIGIN=.*|CLIENT_ORIGIN=*|' .env || echo CLIENT_ORIGIN=* >> .env && echo CORS fixed"

echo.
echo --- Uploading new route files ---
%SCP% "%~dp0..\src\routes\auditLog.routes.js" %SERVER%:/tmp/auditLog.routes.js
%SCP% "%~dp0..\src\routes\index.js" %SERVER%:/tmp/index_routes.js
%SSH% "cp /tmp/auditLog.routes.js %BACKEND%/src/routes/auditLog.routes.js && cp /tmp/index_routes.js %BACKEND%/src/routes/index.js && echo routes copied"

echo.
echo --- Restarting backend ---
%SSH% "pm2 restart all 2>/dev/null || (pkill -f 'node.*index' 2>/dev/null; sleep 1; cd %BACKEND% && nohup node src/index.js > /tmp/hrms.log 2>&1 &)"
timeout /t 5 /nobreak >nul
%SSH% "curl -s -o /dev/null -w 'Stats API: HTTP%%{http_code}\n' http://localhost:5000/api/dashboard/stats -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Rec Dashboard: HTTP%%{http_code}\n' http://localhost:5000/api/recruitment/dashboard -H 'Authorization: Bearer test'"

echo.
echo ==================================================
echo DONE. Log saved to: %LOGFILE%
echo ==================================================
pause
