@echo off
setlocal enabledelayedexpansion
title HRMS Server Fix - Connecting to backend.natsoft.io

echo ==================================================
echo HRMS Production Server Fix
echo Server: ubuntu@18.234.111.185
echo ==================================================
echo.

set SERVER=ubuntu@18.234.111.185
set BACKEND=/var/EmployeePortalapplication/backend

REM Search for SSH key in common locations
set KEY=
for %%K in (
  "%USERPROFILE%\.ssh\id_rsa"
  "%USERPROFILE%\.ssh\sai-keypair.pem"
  "%USERPROFILE%\.ssh\natsoft.pem"
  "%USERPROFILE%\.ssh\private_key.pem"
  "%USERPROFILE%\Desktop\private_key.pem"
  "%USERPROFILE%\Desktop\private_key"
  "%USERPROFILE%\Desktop\sai-keypair.pem"
  "%USERPROFILE%\Downloads\sai-keypair.pem"
  "%USERPROFILE%\Downloads\private_key.pem"
  "C:\TimeSheet\sai-keypair.pem"
  "C:\TimeSheet\private_key.pem"
  "%USERPROFILE%\.ssh\id_ed25519"
  "%USERPROFILE%\natsoft.pem"
  "%USERPROFILE%\hrms.pem"
  "%USERPROFILE%\Downloads\natsoft.pem"
  "%USERPROFILE%\Downloads\hrms.pem"
  "%USERPROFILE%\Downloads\ubuntu.pem"
  "%USERPROFILE%\Downloads\ec2.pem"
  "%USERPROFILE%\Downloads\aws.pem"
  "%USERPROFILE%\Desktop\natsoft.pem"
  "%USERPROFILE%\Desktop\hrms.pem"
  "C:\TimeSheet\natsoft.pem"
  "C:\TimeSheet\hrms.pem"
) do (
  if exist %%K (
    set KEY=%%K
    echo Found SSH key: %%K
    goto :found_key
  )
)

REM Key not found - search Downloads for any .pem
echo Searching Downloads for .pem files...
for %%F in ("%USERPROFILE%\Downloads\*.pem") do (
  set KEY=%%F
  echo Found: %%F
  goto :found_key
)

REM Still not found - ask user
echo.
echo No SSH key found automatically.
echo Please enter the full path to your .pem key file:
set /p KEY="> "
if not exist "!KEY!" (
  echo ERROR: File not found: !KEY!
  pause
  exit /b 1
)

:found_key
echo.
echo Using key: !KEY!
echo.

REM Fix key permissions for Windows OpenSSH
echo Fixing key permissions...
icacls "!KEY!" /inheritance:r /grant:r "%USERNAME%":R >nul 2>&1

REM Step 1: Check current DB config
echo [1/5] Checking current DB config on server...
ssh -o StrictHostKeyChecking=no -i "!KEY!" %SERVER% "grep ^DB_ %BACKEND%/.env"
if %errorlevel% neq 0 (
  echo.
  echo ERROR: SSH connection failed.
  echo Make sure the key file is correct.
  pause
  exit /b 1
)

REM Step 2: Backup .env
echo.
echo [2/5] Backing up current .env...
ssh -o StrictHostKeyChecking=no -i "!KEY!" %SERVER% "cp %BACKEND%/.env %BACKEND%/.env.bak"

REM Step 3: Update .env
echo.
echo [3/5] Updating .env to point to RDS...
ssh -o StrictHostKeyChecking=no -i "!KEY!" %SERVER% "sed -i 's|^DB_HOST=.*|DB_HOST=hrms.c02gczm2cgx8.us-east-1.rds.amazonaws.com|' %BACKEND%/.env && sed -i 's|^DB_PORT=.*|DB_PORT=4306|' %BACKEND%/.env && sed -i 's|^DB_USER=.*|DB_USER=HRMSadmin|' %BACKEND%/.env && sed -i 's|^DB_PASSWORD=.*|DB_PASSWORD=HwULGJ6gbxQIhzwNeZ9L|' %BACKEND%/.env && sed -i 's|^DB_NAME=.*|DB_NAME=hrms_db|' %BACKEND%/.env"

REM Step 4: Verify
echo.
echo [4/5] Verifying updated .env...
ssh -o StrictHostKeyChecking=no -i "!KEY!" %SERVER% "grep ^DB_ %BACKEND%/.env"

REM Step 5: Restart PM2
echo.
echo [5/5] Restarting backend (PM2)...
ssh -o StrictHostKeyChecking=no -i "!KEY!" %SERVER% "pm2 restart all"
timeout /t 3 /nobreak >nul
ssh -o StrictHostKeyChecking=no -i "!KEY!" %SERVER% "pm2 list"

REM Test the API
echo.
echo ==================================================
echo Testing login API...
ssh -o StrictHostKeyChecking=no -i "!KEY!" %SERVER% "curl -s -o /dev/null -w 'HTTP Status: %%{http_code}' -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@yopmail.com\",\"password\":\"Admin@123\"}'"

echo.
echo ==================================================
echo DONE! Backend now connected to RDS.
echo Test in Postman: POST https://backend.natsoft.io/api/auth/login
echo Body: {"email":"admin@yopmail.com","password":"Admin@123"}
echo ==================================================
pause
