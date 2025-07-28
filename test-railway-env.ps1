# Check Railway Environment Variables
Write-Host "🔍 Checking Railway Environment Configuration..." -ForegroundColor Yellow

try {
    # Test server status
    $status = Invoke-RestMethod -Uri "https://mindsync-core-api-production.up.railway.app/" -Method GET
    Write-Host "✅ Server Status: $($status.database)" -ForegroundColor Green
    
    # Test categories (should work)
    $categories = Invoke-RestMethod -Uri "https://mindsync-core-api-production.up.railway.app/api/news/categories" -Method GET
    Write-Host "✅ Categories: $($categories.data.Count) available" -ForegroundColor Green
    
    # Test news endpoint (should be empty due to rate limits)
    $news = Invoke-RestMethod -Uri "https://mindsync-core-api-production.up.railway.app/api/news" -Method GET
    Write-Host "📰 Current Articles: $($news.total)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔧 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Check Railway environment variables" -ForegroundColor White
Write-Host "2. Set USE_LOCAL_DYNAMODB=false" -ForegroundColor White
Write-Host "3. Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set" -ForegroundColor White
Write-Host "4. Or increase API rate limits" -ForegroundColor White
