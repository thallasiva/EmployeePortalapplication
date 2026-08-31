@echo off
setlocal enabledelayedexpansion
title SSH Diagnosis - backend.natsoft.io

set SERVER=ubuntu@18.234.111.185
set KEY=%USERPROFILE%\.ssh\id_rsa

echo ================================================
echo SSH DIAGNOSIS - backend.natsoft.io
echo ================================================
echo Key file: %KEY%
echo.

REM Check if key exists
if not exist "%KEY%" (
  echo ERROR: Key file not found: %KEY%
  pause
  exit /b 1
)

echo Key file found. Testing verbose SSH connection...
echo ------------------------------------------------
ssh -v -o StrictHostKeyChecking=no -o ConnectTimeout=15 -i "%KEY%" %SERVER% "echo SSH_SUCCESS && echo Connected as: $(whoami) && grep ^DB_ /var/EmployeePortalapplication/backend/.env" 2>&1
echo ------------------------------------------------
echo.
echo Exit code: %errorlevel%
echo.
pause
