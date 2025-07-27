# 🚀 QUICK SERVER RESTART SCRIPT ⚡

Write-Host "🚀 RESTARTING MINDSYNC SERVER ON PORT 5000! ⚡" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

# Kill any existing Node processes
Write-Host "🔄 Clearing existing Node processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null

# Kill any process using port 5000
Write-Host "🔄 Clearing port 5000..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -eq 5000}
if ($processes) {
    $processes | ForEach-Object { 
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Killed process $($_.OwningProcess) using port 5000" -ForegroundColor Green
    }
}

# Wait a moment
Start-Sleep -Seconds 2

# Start the server
Write-Host "🚀 Starting server on port 5000..." -ForegroundColor Green
Write-Host "📍 Server URL: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🧪 Health Check: http://localhost:5000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan

# Start server
node server.js
