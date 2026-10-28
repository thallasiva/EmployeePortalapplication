@echo off
echo ========================================
echo  HRMS - Committing deployment config
echo ========================================
cd /d C:\TimeSheet\humanresourceshradmintemplate

:: Remove stale git lock file if it exists
if exist .git\index.lock del /f .git\index.lock
if exist .git\COMMIT_EDITMSG.lock del /f .git\COMMIT_EDITMSG.lock

git add vercel.json DEPLOY.md .env.production .gitignore git-deploy.bat
git add backend/railway.json backend/nixpacks.toml
git add backend/src/database/initDb.js
git add backend/src/app.js backend/src/config/env.js
git add backend/src/routes/index.js backend/src/utils/cookieAuth.js
git add backend/uploads/.gitkeep

git commit -m "feat: add Vercel and Railway deployment config"

git push origin Development

echo.
echo ========================================
echo  Done! Check output above for errors.
echo ========================================
pause
