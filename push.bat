@echo off
cd /d C:\TimeSheet\humanresourceshradmintemplate
if exist .git\index.lock del /f .git\index.lock
git add -A
git commit -m "refactor: replace inline SQL with stored procedures; remove Railway deployment files"
git pull --rebase origin Development
git push origin Development
pause
