# HEROKU DEPLOYMENT - LEGENDARY EXECUTION
Write-Host "LEGENDARY HEROKU DEPLOYMENT STARTING!" -ForegroundColor Red
Write-Host "MindSync Core API to Heroku Production" -ForegroundColor Green

# Navigate to project directory
Set-Location "c:\Users\rajan\OneDrive\Desktop\projects\mindsync-core-api"

# Step 1: Heroku Login
Write-Host "Step 1: Heroku Authentication" -ForegroundColor Yellow
heroku login

# Step 2: Create Heroku App
Write-Host "Step 2: Creating Heroku App" -ForegroundColor Yellow
heroku create mindsync-legendary-api

# Step 3: Set Environment Variables
Write-Host "Step 3: Setting Environment Variables" -ForegroundColor Yellow
heroku config:set NODE_ENV=production --app mindsync-legendary-api
heroku config:set PORT=80 --app mindsync-legendary-api

# Step 4: Deploy to Heroku
Write-Host "Step 4: Deploying Code to Heroku" -ForegroundColor Yellow
Write-Host "Pushing src branch to Heroku main..." -ForegroundColor Cyan
git push heroku src:main --force

Write-Host "LEGENDARY DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "LIVE URL: https://mindsync-legendary-api.herokuapp.com" -ForegroundColor Cyan
Write-Host "FRONTEND READY FOR INTEGRATION!" -ForegroundColor Yellow

# Open the deployed app
heroku open --app mindsync-legendary-api
