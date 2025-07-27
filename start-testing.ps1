# 🚀 LEGENDARY MINDSYNC API TESTING SCRIPT ⚡
# This script will help you start testing the API immediately!

Write-Host "🚀 LEGENDARY MINDSYNC API TESTING! ⚡" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

# Function to test if server is running
function Test-ServerRunning {
    param($port = 5000)
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:$port/health" -Method GET -TimeoutSec 5
        return $true
    }
    catch {
        return $false
    }
}

# Function to start server in background
function Start-ServerBackground {
    param($serverFile = "server.js")
    
    Write-Host "🔄 Starting $serverFile in background..." -ForegroundColor Yellow
    
    # Start server in new PowerShell window
    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node $serverFile" -PassThru
    
    Write-Host "✅ Server started with Process ID: $($process.Id)" -ForegroundColor Green
    Write-Host "🌐 Server should be available at: http://localhost:5000" -ForegroundColor Cyan
    
    return $process
}

# Function to run basic API tests
function Test-BasicEndpoints {
    Write-Host "🧪 Testing basic endpoints..." -ForegroundColor Yellow
    
    # Test health endpoint
    try {
        Write-Host "🔍 Testing health endpoint..." -ForegroundColor White
        $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
        Write-Host "✅ Health check passed!" -ForegroundColor Green
        Write-Host "   Status: $($health.status)" -ForegroundColor Gray
        Write-Host "   Message: $($health.message)" -ForegroundColor Gray
    }
    catch {
        Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    # Test basic endpoint
    try {
        Write-Host "🔍 Testing basic test endpoint..." -ForegroundColor White
        $test = Invoke-RestMethod -Uri "http://localhost:5000/test" -Method GET
        Write-Host "✅ Test endpoint passed!" -ForegroundColor Green
        Write-Host "   Message: $($test.message)" -ForegroundColor Gray
    }
    catch {
        Write-Host "❌ Test endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    return $true
}

# Function to test authentication
function Test-Authentication {
    Write-Host "🔐 Testing authentication..." -ForegroundColor Yellow
    
    $timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
    $testUser = @{
        email = "test$timestamp@mindsync.com"
        password = "test123"
        name = "Test User $timestamp"
    } | ConvertTo-Json
    
    try {
        Write-Host "👤 Registering test user..." -ForegroundColor White
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $testUser -ContentType "application/json"
        
        if ($response.success) {
            Write-Host "✅ User registration successful!" -ForegroundColor Green
            Write-Host "   User ID: $($response.data.user.id)" -ForegroundColor Gray
            Write-Host "   Token: $($response.data.token.Substring(0,20))..." -ForegroundColor Gray
            
            # Test profile access
            $headers = @{
                'Authorization' = "Bearer $($response.data.token)"
                'Content-Type' = 'application/json'
            }
            
            Write-Host "👤 Testing profile access..." -ForegroundColor White
            $profile = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/profile" -Method GET -Headers $headers
            Write-Host "✅ Profile access successful!" -ForegroundColor Green
            Write-Host "   Profile email: $($profile.data.email)" -ForegroundColor Gray
        }
        else {
            Write-Host "⚠️ Registration response: $($response | ConvertTo-Json)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Authentication test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to open test dashboard
function Open-TestDashboard {
    $dashboardPath = Join-Path $PWD "test-dashboard.html"
    
    if (Test-Path $dashboardPath) {
        Write-Host "🌐 Opening test dashboard in browser..." -ForegroundColor Yellow
        Start-Process $dashboardPath
        Write-Host "✅ Dashboard opened! Use it to run comprehensive tests." -ForegroundColor Green
    }
    else {
        Write-Host "❌ Dashboard file not found at: $dashboardPath" -ForegroundColor Red
    }
}

# Main execution
Write-Host ""
Write-Host "🎯 Choose your testing approach:" -ForegroundColor Cyan
Write-Host "1️⃣  Start simple server (basic health checks)" -ForegroundColor White
Write-Host "2️⃣  Start full server (all features)" -ForegroundColor White
Write-Host "3️⃣  Open test dashboard (browser-based testing)" -ForegroundColor White
Write-Host "4️⃣  Run PowerShell API tests" -ForegroundColor White
Write-Host "5️⃣  Check if server is already running" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "🚀 Starting simple server..." -ForegroundColor Green
        $process = Start-ServerBackground "test-server-simple.js"
        Start-Sleep 3
        if (Test-ServerRunning) {
            Test-BasicEndpoints
        }
    }
    "2" {
        Write-Host "🚀 Starting full server..." -ForegroundColor Green
        $process = Start-ServerBackground "server.js"
        Start-Sleep 5
        if (Test-ServerRunning) {
            Test-BasicEndpoints
            Test-Authentication
        }
    }
    "3" {
        Open-TestDashboard
    }
    "4" {
        if (Test-ServerRunning) {
            Test-BasicEndpoints
            Test-Authentication
        }
        else {
            Write-Host "❌ Server not running! Start it first with option 1 or 2." -ForegroundColor Red
        }
    }
    "5" {
        if (Test-ServerRunning) {
            Write-Host "✅ Server is running!" -ForegroundColor Green
            Test-BasicEndpoints
        }
        else {
            Write-Host "❌ Server is not running." -ForegroundColor Red
        }
    }
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 TESTING SCRIPT COMPLETE!" -ForegroundColor Green
Write-Host "💡 Pro tips:" -ForegroundColor Cyan
Write-Host "   • Use the test dashboard for comprehensive testing" -ForegroundColor White
Write-Host "   • Check server logs for any error messages" -ForegroundColor White
Write-Host "   • All endpoints should respond within 500ms" -ForegroundColor White
Write-Host ""
Write-Host "🚀 READY FOR LEGENDARY DEPLOYMENT! ⚡" -ForegroundColor Green
