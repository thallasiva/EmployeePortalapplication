@echo off
echo ========================================
echo  HRMS - Pull then push all changes
echo ========================================
cd /d C:\TimeSheet\humanresourceshradmintemplate

if exist .git\index.lock del /f .git\index.lock
if exist .git\COMMIT_EDITMSG.lock del /f .git\COMMIT_EDITMSG.lock

git add -A

git commit -m "fix: employee avatar initials + pending updates" --allow-empty

git pull --rebase origin Development

git push origin Development

echo.
echo ========================================
echo  Done! Check output above for errors.
echo ========================================
pause
