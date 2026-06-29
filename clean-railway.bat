@echo off
cd /d C:\TimeSheet\humanresourceshradmintemplate

:: Remove lock files
if exist .git\index.lock del /f .git\index.lock
if exist .git\COMMIT_EDITMSG.lock del /f .git\COMMIT_EDITMSG.lock

:: Remove Railway/Vercel deployment files from git tracking
git rm -f --ignore-unmatch vercel.json
git rm -f --ignore-unmatch DEPLOY.md
git rm -f --ignore-unmatch railway_setup.sql
git rm -f --ignore-unmatch git-deploy.bat
git rm -f --ignore-unmatch git-push-all.bat
git rm -f --ignore-unmatch init-railway-db.bat
git rm -f --ignore-unmatch .env.production
git rm -f --ignore-unmatch backend/railway.json
git rm -f --ignore-unmatch backend/nixpacks.toml
git rm -f --ignore-unmatch backend/src/database/initDb.js

echo.
echo Railway files removed from git tracking.
echo.
git status --short
pause
