# 🚀 SMART SERVER STARTER - FINDS AVAILABLE PORT AUTOMATICALLY ⚡

Write-Host "🚀 LEGENDARY MINDSYNC SMART SERVER! ⚡" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "🔍 This will automatically find an available port!" -ForegroundColor Yellow
Write-Host ""

# Kill any existing Node processes
Write-Host "🔄 Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name npm -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting smart server..." -ForegroundColor Green
Write-Host "📍 Server will find and use an available port" -ForegroundColor Cyan
Write-Host "💡 Watch the output to see which port is selected" -ForegroundColor Yellow
Write-Host ""

# Start the smart server
node server-smart.js
