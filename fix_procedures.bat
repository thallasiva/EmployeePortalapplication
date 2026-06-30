@echo off
echo ============================================================
echo  HRMS - Loading stored procedures into MySQL
echo ============================================================
echo.

cd /d "C:\TimeSheet\humanresourceshradmintemplate\backend"

echo Running: npm run db:patch:auth
echo.
call npm run db:patch:auth

echo.
echo ============================================================
echo  Done. You can close this window and try logging in again.
echo ============================================================
pause
