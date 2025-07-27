# 🚀 LEGENDARY PORT 5000 CLEANUP & SERVER START ⚡

Write-Host "🚀 LEGENDARY MINDSYNC SERVER STARTUP! ⚡" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# Function to kill process by port
function Kill-ProcessByPort {
    param($Port)
    
    Write-Host "🔍 Checking port $Port..." -ForegroundColor Yellow
    
    # Method 1: PowerShell NetTCP
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            Write-Host "🎯 Found process $($conn.OwningProcess) using port $Port" -ForegroundColor Yellow
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Killed process $($conn.OwningProcess)" -ForegroundColor Green
        }
    } catch {
        Write-Host "   No processes found via NetTCP method" -ForegroundColor Gray
    }
    
    # Method 2: netstat
    try {
        $netstatOutput = netstat -ano | findstr ":$Port "
        if ($netstatOutput) {
            $netstatOutput | ForEach-Object {
                $parts = $_ -split '\s+' | Where-Object { $_ -ne '' }
                if ($parts.Length -ge 5) {
                    $pid = $parts[4]
                    Write-Host "🎯 Found process $pid using port $Port (netstat)" -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    Write-Host "✅ Killed process $pid" -ForegroundColor Green
                }
            }
        }
    } catch {
        Write-Host "   No processes found via netstat method" -ForegroundColor Gray
    }
}

# Kill all Node.js processes first
Write-Host "🔄 Killing all Node.js processes..." -ForegroundColor Yellow
try {
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ All Node.js processes terminated" -ForegroundColor Green
} catch {
    Write-Host "   No Node.js processes found" -ForegroundColor Gray
}

# Kill processes using port 5000
Kill-ProcessByPort -Port 5000

# Wait for cleanup
Write-Host "⏳ Waiting for port cleanup..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Test if port is free
Write-Host "🧪 Testing port 5000 availability..." -ForegroundColor Yellow
try {
    $test = New-Object System.Net.Sockets.TcpClient
    $test.Connect("localhost", 5000)
    $test.Close()
    Write-Host "❌ Port 5000 is still in use!" -ForegroundColor Red
    Write-Host "🔄 Trying one more aggressive cleanup..." -ForegroundColor Yellow
    
    # Nuclear option - kill by port using netsh/taskkill
    cmd /c "for /f `"tokens=5`" %a in ('netstat -ano ^| findstr :5000') do taskkill /f /pid %a" 2>$null
    Start-Sleep -Seconds 2
} catch {
    Write-Host "✅ Port 5000 is FREE! Ready to start server!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 STARTING MINDSYNC SERVER..." -ForegroundColor Green
Write-Host "📍 URL: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🧪 Health: http://localhost:5000/health" -ForegroundColor Cyan
Write-Host "📋 Test: http://localhost:5000/test" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# Start the server
node server.js
