@echo off
echo ========================================
echo  HRMS - Initialising Railway Database
echo ========================================
cd /d C:\TimeSheet\humanresourceshradmintemplate\backend

set DATABASE_URL=mysql://root:smialBUQMUvWbhuWFPgWXXWrKJbLuYqa@reseau.proxy.rlwy.net:35300/railway

node src/database/initDb.js

echo.
echo ========================================
echo  Done! Check output above for errors.
echo ========================================
pause
