@echo off
setlocal enabledelayedexpansion
title SSH Log Test

set KEY=%USERPROFILE%\.ssh\id_rsa
set SERVER=ubuntu@18.234.111.185
set LOGFILE=%USERPROFILE%\Desktop\ssh_debug_log.txt

echo SSH verbose test starting... > "%LOGFILE%"
echo Key: %KEY% >> "%LOGFILE%"
echo. >> "%LOGFILE%"

REM Run SSH with max verbosity, redirect both stdout and stderr to log
ssh -vvv -o StrictHostKeyChecking=no -o ConnectTimeout=15 -i "%KEY%" %SERVER% "echo SSH_OK" >> "%LOGFILE%" 2>&1

echo. >> "%LOGFILE%"
echo Exit code: %errorlevel% >> "%LOGFILE%"
echo Log written to: %LOGFILE%
echo.
echo Opening log file...
notepad "%LOGFILE%"
