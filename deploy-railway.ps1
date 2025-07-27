# 🚀 RAILWAY INSTANT DEPLOYMENT SCRIPT ⚡

Write-Host "🚀 LEGENDARY RAILWAY DEPLOYMENT! ⚡" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🎯 Getting your app live in 2 minutes!" -ForegroundColor Yellow
Write-Host ""

# Check if Railway CLI is installed
Write-Host "🔍 Checking Railway CLI..." -ForegroundColor Yellow
$railwayInstalled = $false

try {
    railway --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        $railwayInstalled = $true
        Write-Host "✅ Railway CLI is already installed!" -ForegroundColor Green
    }
} catch {
    Write-Host "📦 Railway CLI not found, installing..." -ForegroundColor Yellow
}

if (-not $railwayInstalled) {
    Write-Host "📦 Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    Write-Host "✅ Railway CLI installed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔐 Please log in to Railway..." -ForegroundColor Yellow
Write-Host "   (This will open your browser)" -ForegroundColor Gray
railway login

Write-Host ""
Write-Host "🚀 Deploying to Railway..." -ForegroundColor Green
Write-Host "   Creating production environment..." -ForegroundColor Gray

# Deploy to Railway
railway deploy

Write-Host ""
Write-Host "🎉 DEPLOYMENT COMPLETE! ⚡" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Your app should now be live!" -ForegroundColor Yellow
Write-Host "🌐 Get your URL with: railway status" -ForegroundColor Cyan
Write-Host "📋 View logs with: railway logs" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔥 LEGENDARY SUCCESS! Send the live URL to frontend team! 💪" -ForegroundColor Green
