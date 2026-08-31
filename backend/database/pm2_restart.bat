@echo off
set SERVER=ubuntu@18.234.111.185
set KEY="C:\Users\Siva\.ssh\id_rsa"
set SSH=ssh -o StrictHostKeyChecking=no -i %KEY% %SERVER%
set BACKEND=/var/EmployeePortalapplication/backend

echo --- PM2 status before restart ---
%SSH% "pm2 list"

echo.
echo --- Restarting pm2 ---
%SSH% "pm2 restart all && echo RESTART OK || echo RESTART FAILED"

echo.
timeout /t 4 /nobreak >nul

echo --- Checking APIs ---
%SSH% "curl -s -o /dev/null -w 'Stats:       HTTP%%{http_code}\n' http://localhost:5000/api/dashboard/stats -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Rec Dash:    HTTP%%{http_code}\n' http://localhost:5000/api/recruitment/dashboard -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Joining:     HTTP%%{http_code}\n' http://localhost:5000/api/joining -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Audit Logs:  HTTP%%{http_code}\n' http://localhost:5000/api/audit-logs -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Dashboard:   HTTP%%{http_code}\n' http://localhost:5000/api/dashboard -H 'Authorization: Bearer test'"

echo.
echo --- PM2 logs (last 20 lines) ---
%SSH% "pm2 logs --nostream --lines 20 2>&1 | tail -30"

pause
