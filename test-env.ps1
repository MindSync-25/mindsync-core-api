# Test Railway Environment Variables
Write-Host "Testing Railway Environment Variables..." -ForegroundColor Yellow

try {
    $envResponse = Invoke-RestMethod -Uri "https://mindsync-core-api-production.up.railway.app/" -Method GET
    Write-Host "Server Response:" -ForegroundColor Green
    $envResponse | ConvertTo-Json -Depth 2
    
    Write-Host "`nTesting info endpoint..." -ForegroundColor Yellow
    $infoResponse = Invoke-RestMethod -Uri "https://mindsync-core-api-production.up.railway.app/api/news/info" -Method GET
    $infoResponse | ConvertTo-Json -Depth 2
    
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
