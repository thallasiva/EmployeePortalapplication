@echo off
echo Fixing HRMS admin password...
cd /d C:\TimeSheet\humanresourceshradmintemplate\backend
node reset-admin-password.js
echo.
echo Done! Press any key to close.
pause
