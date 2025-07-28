# 🚀 HEROKU DEPLOYMENT - INSTANT EXECUTION SCRIPT

Write-Host "🔥 LEGENDARY HEROKU DEPLOYMENT STARTING!" -ForegroundColor Red
Write-Host "🚀 MindSync Core API → Heroku Production" -ForegroundColor Green

# Navigate to project directory
Set-Location "c:\Users\rajan\OneDrive\Desktop\projects\mindsync-core-api"

# Step 1: Heroku Login (30 seconds)
Write-Host "⚡ Step 1: Heroku Authentication" -ForegroundColor Yellow
heroku login
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Heroku login successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Heroku login failed - install CLI first" -ForegroundColor Red
    exit 1
}

# Step 2: Create Heroku App (15 seconds)
Write-Host "⚡ Step 2: Creating Heroku App" -ForegroundColor Yellow
heroku create mindsync-legendary-api
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Heroku app created: https://mindsync-legendary-api.herokuapp.com" -ForegroundColor Green
} else {
    Write-Host "❌ App creation failed - might already exist" -ForegroundColor Red
    Write-Host "🔧 Adding existing app as remote..." -ForegroundColor Yellow
    heroku git:remote -a mindsync-legendary-api
}

# Step 3: Set Environment Variables
Write-Host "⚡ Step 3: Setting Environment Variables" -ForegroundColor Yellow
heroku config:set NODE_ENV=production --app mindsync-legendary-api
heroku config:set PORT=80 --app mindsync-legendary-api

# Step 4: Deploy to Heroku (2 minutes)
Write-Host "⚡ Step 4: Deploying Code to Heroku" -ForegroundColor Yellow
Write-Host "🚀 Pushing src branch to Heroku main..." -ForegroundColor Cyan
git push heroku src:main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "" -ForegroundColor White
    Write-Host "🎉🎉🎉 LEGENDARY DEPLOYMENT SUCCESSFUL! 🎉🎉🎉" -ForegroundColor Green
    Write-Host "" -ForegroundColor White
    Write-Host "🌐 LIVE URL: https://mindsync-legendary-api.herokuapp.com" -ForegroundColor Cyan
    Write-Host "📱 FRONTEND READY FOR INTEGRATION!" -ForegroundColor Yellow
    Write-Host "🚀 LEGENDARY MINDSYNC API IS NOW LIVE!" -ForegroundColor Red
    Write-Host "" -ForegroundColor White
    
    # Open the deployed app
    heroku open --app mindsync-legendary-api
} else {
    Write-Host "❌ Deployment failed - check logs" -ForegroundColor Red
    heroku logs --tail --app mindsync-legendary-api
}
