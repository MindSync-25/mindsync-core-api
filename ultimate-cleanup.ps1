# 🧹 ULTIMATE CLEANUP SCRIPT
Write-Host "🧹 REMOVING ALL UNWANTED FILES..." -ForegroundColor Red

# Define all unwanted files
$unwantedFiles = @(
    "server-database.js", "server-minimal.js", "server-simple.js", "server-smart.js", 
    "server-ultra-minimal.js", "serverDynamo.js", "server-fixed.js",
    "quick-test.js", "simple-test.js", "test-*.js", "test-*.html", 
    "railway-init.js", "syncModels.js",
    "deploy-*.ps1", "start-*.ps1", "restart-server.ps1",
    "*_STATUS.md", "*_DEPLOYMENT*.md", "*_INTEGRATION*.md", 
    "HEROKU_*.md", "LEGENDARY_*.md", "IMMEDIATE_*.md", "LOCAL_*.md",
    "ALTERNATIVE_*.md", "AWS_*.md", "DEPLOYMENT_GUIDE.md", 
    "DYNAMODB_MIGRATION.md", "FEATURE_DOCUMENTATION.md", "SYNC_*.md",
    "heroku-installer.exe", "package-production.json", "railway.json", "vercel.json",
    "deploy-fix.bat", "massive-cleanup.bat", "force-cleanup.sh"
)

# Remove files
foreach ($pattern in $unwantedFiles) {
    Get-ChildItem -Path . -Name $pattern -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
        Write-Host "Deleted: $_" -ForegroundColor Green
    }
}

# Remove directories
$unwantedDirs = @("controllers", "routes")
foreach ($dir in $unwantedDirs) {
    if (Test-Path $dir) {
        Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Deleted directory: $dir" -ForegroundColor Green
    }
}

Write-Host "✅ CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "📁 Essential files remaining:" -ForegroundColor Yellow
Get-ChildItem -Name | Where-Object { $_ -match "(server\.js|package\.json|README\.md|\.env)" }
