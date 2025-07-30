@echo off
echo 🧹 MASSIVE CLEANUP - REMOVING ALL UNWANTED FILES...

echo Removing extra server files...
if exist server-database.js del server-database.js
if exist server-minimal.js del server-minimal.js  
if exist server-simple.js del server-simple.js
if exist server-smart.js del server-smart.js
if exist server-ultra-minimal.js del server-ultra-minimal.js
if exist serverDynamo.js del serverDynamo.js

echo Removing test files...
if exist quick-test.js del quick-test.js
if exist simple-test.js del simple-test.js
if exist test-dashboard.html del test-dashboard.html
if exist test-routes-local.js del test-routes-local.js
if exist test-server-simple.js del test-server-simple.js
if exist test-server.js del test-server.js

echo Removing deployment scripts...
if exist deploy-heroku-legendary.ps1 del deploy-heroku-legendary.ps1
if exist deploy-heroku-simple.ps1 del deploy-heroku-simple.ps1
if exist deploy-railway.ps1 del deploy-railway.ps1
if exist restart-server.ps1 del restart-server.ps1
if exist start-server-force.ps1 del start-server-force.ps1
if exist start-smart.ps1 del start-smart.ps1
if exist start-testing.ps1 del start-testing.ps1

echo Removing documentation files...
if exist ALTERNATIVE_DEPLOYMENT.md del ALTERNATIVE_DEPLOYMENT.md
if exist AWS_FOUNDATION_COMPLETE.md del AWS_FOUNDATION_COMPLETE.md
if exist AWS_INFRASTRUCTURE_PLAN.md del AWS_INFRASTRUCTURE_PLAN.md
if exist DEPLOYMENT_GUIDE.md del DEPLOYMENT_GUIDE.md
if exist DYNAMODB_MIGRATION.md del DYNAMODB_MIGRATION.md
if exist FEATURE_DOCUMENTATION.md del FEATURE_DOCUMENTATION.md
if exist FRONTEND_INTEGRATION_GUIDE.md del FRONTEND_INTEGRATION_GUIDE.md
if exist FRONTEND_INTEGRATION_IMMEDIATE.md del FRONTEND_INTEGRATION_IMMEDIATE.md
if exist FRONTEND_NOTIFICATION_HEROKU.md del FRONTEND_NOTIFICATION_HEROKU.md
if exist HEROKU_DEPLOYMENT_STATUS.md del HEROKU_DEPLOYMENT_STATUS.md
if exist HEROKU_EXECUTION_STATUS.md del HEROKU_EXECUTION_STATUS.md
if exist HEROKU_LOGIN_TROUBLESHOOTING.md del HEROKU_LOGIN_TROUBLESHOOTING.md
if exist IMMEDIATE_DEPLOYMENT_EXECUTION.md del IMMEDIATE_DEPLOYMENT_EXECUTION.md
if exist IMMEDIATE_DEPLOYMENT_STATUS.md del IMMEDIATE_DEPLOYMENT_STATUS.md
if exist IMMEDIATE_TESTING_PROTOCOL.md del IMMEDIATE_TESTING_PROTOCOL.md
if exist LEGENDARY_COORDINATION_STATUS.md del LEGENDARY_COORDINATION_STATUS.md
if exist LEGENDARY_DEPLOYMENT_SUCCESS.md del LEGENDARY_DEPLOYMENT_SUCCESS.md
if exist LEGENDARY_V2_DEPLOYMENT_STATUS.md del LEGENDARY_V2_DEPLOYMENT_STATUS.md
if exist LOCAL_TESTING_IMMEDIATE.md del LOCAL_TESTING_IMMEDIATE.md
if exist RAILWAY_DEPLOYMENT_STATUS.md del RAILWAY_DEPLOYMENT_STATUS.md
if exist SERVER_SUCCESS_STATUS.md del SERVER_SUCCESS_STATUS.md
if exist SYNC_CHECKLIST_TOMORROW.md del SYNC_CHECKLIST_TOMORROW.md

echo Removing config files...
if exist heroku-installer.exe del heroku-installer.exe
if exist package-production.json del package-production.json
if exist railway.json del railway.json
if exist railway-init.js del railway-init.js
if exist syncModels.js del syncModels.js
if exist vercel.json del vercel.json

echo ✅ CLEANUP COMPLETE! Only essential files remain.
echo.
echo 📁 Remaining files:
echo - server.js (clean working server)
echo - package.json (updated config)
echo - models/ (database models)
echo - db/ (database config)
echo - README.md
echo - .env files
echo.
pause
