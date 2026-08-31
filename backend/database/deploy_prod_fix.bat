@echo off
setlocal enabledelayedexpansion
title Deploy Production Fix

echo ==================================================
echo HRMS Production Fix - ENV + CookieAuth + PM2
echo Server: ubuntu@18.234.111.185
echo ==================================================

set SERVER=ubuntu@18.234.111.185
set BACKEND=/var/EmployeePortalapplication/backend
set KEY=C:\Users\Siva\.ssh\id_rsa

if not exist "!KEY!" (
  echo ERROR: SSH key not found at !KEY!
  pause
  exit /b 1
)

echo Found key: !KEY!
echo Fixing key permissions...
icacls "!KEY!" /inheritance:r /grant:r "%USERNAME%":R >nul 2>&1

echo.
echo [1/5] Backing up .env...
ssh -o StrictHostKeyChecking=no -i "!KEY!" %SERVER% "cp %BACKEND%/.env %BACKEND%/.env.bak.%date:~-4,4%%date:~-7,2%%date:~-10,2%"

echo.
echo [2/5] Updating .env to point to RDS...
ssh -o StrictHostKeyChecking=no -i "!KEY!" %SERVER% "sed -i 's|^DB_HOST=.*|DB_HOST=hrms.c02gczm2cgx8.us-east-1.rds.amazonaws.com|' %BACKEND%/.env && sed -i 's|^DB_PORT=.*|DB_PORT=4306|' %BACKEND%/.env && sed -i 's|^DB_USER=.*|DB_USER=HRMSadmin|' %BACKEND%/.env && sed -i 's|^DB_PASSWORD=.*|DB_PASSWORD=HwULGJ6gbxQIhzwNeZ9L|' %BACKEND%/.env && sed -i 's|^DB_NAME=.*|DB_NAME=hrms_db|' %BACKEND%/.env"

echo.
echo [3/5] Verifying .env DB settings...
ssh -o StrictHostKeyChecking=no -i "!KEY!" %SERVER% "grep '^DB_' %BACKEND%/.env"

echo.
echo [4/5] Fixing SameSite cookie (Strict->None for cross-domain)...
ssh -o StrictHostKeyChecking=no -i "!KEY!" %SERVER% "sed -i \"s/sameSite: IS_PROD ? 'Strict' : 'Lax'/sameSite: IS_PROD ? 'None' : 'Lax'/\" %BACKEND%/src/utils/cookieAuth.js && grep 'sameSite' %BACKEND%/src/utils/cookieAuth.js"

echo.
echo [5/5] Restarting PM2...
ssh -o StrictHostKeyChecking=no -i "!KEY!" %SERVER% "pm2 restart all && sleep 3 && pm2 list"

echo.
echo ==================================================
echo Testing login API on production...
ssh -o StrictHostKeyChecking=no -i "!KEY!" %SERVER% "curl -s -w '\nHTTP Status: %%{http_code}\n' -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@yopmail.com\",\"password\":\"Admin@123\"}' | tail -20"

echo.
echo ==================================================
echo DONE. Production server updated.
echo ==================================================
pause
