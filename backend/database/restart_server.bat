@echo off
set SERVER=ubuntu@18.234.111.185
set KEY="C:\Users\Siva\.ssh\id_rsa"
set SSH=ssh -o StrictHostKeyChecking=no -i %KEY% %SERVER%
set BACKEND=/var/EmployeePortalapplication/backend

echo --- Killing ALL node processes (including root-owned) ---
%SSH% "sudo pkill -f 'node' 2>/dev/null && echo killed_all || echo no_procs_found"
%SSH% "sleep 2"

echo --- Port 5000 should now be free ---
%SSH% "ss -lntp | grep 5000 || echo port_5000_FREE"

echo --- Starting backend with pm2 (as ubuntu, explicit env vars) ---
%SSH% "cd %BACKEND% && DB_HOST=hrms.c02gczm2cgx8.us-east-1.rds.amazonaws.com DB_PORT=4306 DB_USER=HRMSadmin DB_PASSWORD=HwULGJ6gbxQIhzwNeZ9L DB_NAME=hrms_db pm2 start src/server.js --name hrms-backend && pm2 save && echo PM2_STARTED_OK"

timeout /t 6 /nobreak >nul

echo --- API verification ---
%SSH% "curl -s -o /dev/null -w 'Stats:       HTTP%%{http_code}\n' http://localhost:5000/api/dashboard/stats -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Rec Dash:    HTTP%%{http_code}\n' http://localhost:5000/api/recruitment/dashboard -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Joining:     HTTP%%{http_code}\n' http://localhost:5000/api/joining -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Audit Logs:  HTTP%%{http_code}\n' http://localhost:5000/api/audit-logs -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Dashboard:   HTTP%%{http_code}\n' http://localhost:5000/api/dashboard -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Settings:    HTTP%%{http_code}\n' http://localhost:5000/api/settings -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Employees:   HTTP%%{http_code}\n' http://localhost:5000/api/employees -H 'Authorization: Bearer test'"

echo --- PM2 list ---
%SSH% "pm2 list"

echo --- PM2 logs (last 40 lines) ---
%SSH% "pm2 logs hrms-backend --nostream --lines 40 2>&1 | tail -50"

pause
