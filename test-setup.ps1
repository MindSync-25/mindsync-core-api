# Test DynamoDB Setup Endpoint
Write-Host "Testing DynamoDB Setup..." -ForegroundColor Yellow

try {
    $uri = "https://mindsync-core-api-production.up.railway.app/api/setup/dynamo"
    $headers = @{
        "Content-Type" = "application/json"
    }
    $body = "{}"
    
    Write-Host "Making POST request to: $uri" -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "Status Code:" $_.Exception.Response.StatusCode -ForegroundColor Red
        Write-Host "Status Description:" $_.Exception.Response.StatusDescription -ForegroundColor Red
    }
}

Write-Host "`nDone!" -ForegroundColor Green
