@echo off
title HRMS Collation Fix
cd /d "%~dp0"
echo Running collation fix against RDS...
node fix_collation.js
echo.
echo Press any key to close.
pause
