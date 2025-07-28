@echo off
echo 🧹 CLEANING UP AND DEPLOYING...

echo Adding files to git...
git add server-fixed.js package.json

echo Committing changes...
git commit -m "🧹 CLEANUP: Final clean server with category filtering only"

echo Pushing to GitHub...
git push origin src

echo ✅ DEPLOYMENT COMPLETE!
pause
