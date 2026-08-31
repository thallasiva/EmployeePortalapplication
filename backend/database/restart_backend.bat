@echo off
set SERVER=ubuntu@18.234.111.185
set KEY="C:\Users\Siva\.ssh\id_rsa"
set SSH=ssh -o StrictHostKeyChecking=no -i %KEY% %SERVER%
set BACKEND=/var/EmployeePortalapplication/backend

echo --- Finding what is running on port 5000 ---
%SSH% "ss -lntp | grep 5000 || echo nothing_on_5000"

echo --- Finding node processes ---
%SSH% "ps aux | grep node | grep -v grep"

echo --- Checking systemd services ---
%SSH% "systemctl list-units --type=service | grep -i 'hrms\|node\|employ' 2>/dev/null || echo no_systemd_services"

echo --- Killing existing node processes ---
%SSH% "pkill -f 'node.*index' 2>/dev/null && echo killed_ok || echo no_node_procs"
%SSH% "sleep 1"

echo --- Starting backend with pm2 ---
%SSH% "cd %BACKEND% && DB_HOST=hrms.c02gczm2cgx8.us-east-1.rds.amazonaws.com DB_PORT=4306 DB_USER=HRMSadmin DB_PASSWORD=HwULGJ6gbxQIhzwNeZ9L DB_NAME=hrms_db pm2 start src/index.js --name hrms-backend --update-env && pm2 save && echo PM2_STARTED_OK"

timeout /t 6 /nobreak >nul

echo --- API verification ---
%SSH% "curl -s -o /dev/null -w 'Stats:       HTTP%%{http_code}\n' http://localhost:5000/api/dashboard/stats -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Rec Dash:    HTTP%%{http_code}\n' http://localhost:5000/api/recruitment/dashboard -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Joining:     HTTP%%{http_code}\n' http://localhost:5000/api/joining -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Audit Logs:  HTTP%%{http_code}\n' http://localhost:5000/api/audit-logs -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Dashboard:   HTTP%%{http_code}\n' http://localhost:5000/api/dashboard -H 'Authorization: Bearer test'"
%SSH% "curl -s -o /dev/null -w 'Settings:    HTTP%%{http_code}\n' http://localhost:5000/api/settings -H 'Authorization: Bearer test'"

echo --- PM2 status ---
%SSH% "pm2 list"

echo --- pm2 logs (last 30 lines) ---
%SSH% "pm2 logs hrms-backend --nostream --lines 30 2>&1 | tail -40"

pause
