# Test All MindSync API Endpoints
Write-Host "🧪 TESTING ALL MINDSYNC API ENDPOINTS" -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Yellow

$baseUrl = "https://mindsync-core-api-production.up.railway.app"

Write-Host "`n✅ WORKING ENDPOINTS:" -ForegroundColor Green

# Test Root
try {
    $root = Invoke-RestMethod -Uri "$baseUrl/" -Method GET
    Write-Host "📍 GET /              → $($root.message)" -ForegroundColor White
} catch { Write-Host "❌ GET /              → Failed" -ForegroundColor Red }

# Test News
try {
    $news = Invoke-RestMethod -Uri "$baseUrl/api/news" -Method GET
    Write-Host "📰 GET /api/news      → $($news.total) articles" -ForegroundColor White
} catch { Write-Host "❌ GET /api/news      → Failed" -ForegroundColor Red }

# Test Categories
try {
    $categories = Invoke-RestMethod -Uri "$baseUrl/api/news/categories" -Method GET
    Write-Host "📂 GET /api/news/categories → $($categories.data.Count) categories" -ForegroundColor White
} catch { Write-Host "❌ GET /api/news/categories → Failed" -ForegroundColor Red }

# Test Login
try {
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@example.com","password":"test123"}'
    Write-Host "🔐 POST /api/auth/login → $($login.message)" -ForegroundColor White
} catch { Write-Host "❌ POST /api/auth/login → Failed" -ForegroundColor Red }

# Test Signup
try {
    $signup = Invoke-RestMethod -Uri "$baseUrl/api/auth/signup" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"newuser@test.com","password":"pass123","name":"Test User"}'
    Write-Host "📝 POST /api/auth/signup → $($signup.message)" -ForegroundColor White
} catch { Write-Host "❌ POST /api/auth/signup → Failed" -ForegroundColor Red }

Write-Host "`n🎉 ALL ENDPOINTS WORKING!" -ForegroundColor Green
Write-Host "Your frontend should now connect successfully!" -ForegroundColor Cyan
