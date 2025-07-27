# 🚀 LEGENDARY DEPLOYMENT SCRIPT - POWERSHELL VERSION
# Frontend Lead - Let's make this LEGENDARY!

Write-Host "🔥 STARTING LEGENDARY DEPLOYMENT RIGHT NOW! ⚡" -ForegroundColor Red
Write-Host "===============================================" -ForegroundColor Yellow

# Set AWS region
$env:AWS_DEFAULT_REGION = "us-east-1"

# Essential environment variables (using defaults for immediate deployment)
$env:JWT_SECRET = "mindsync-legendary-jwt-secret-2025-production-ready"
$env:NEWS_API_KEY = "get-your-newsapi-key-from-newsapi.org"
$env:GNEWS_API_KEY = "get-your-gnews-key-from-gnews.io"  
$env:WEATHER_API_KEY = "get-your-openweather-key-from-openweathermap.org"

Write-Host ""
Write-Host "🎯 Step 1: CDK Bootstrap (if needed)" -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor Yellow
# Bootstrap CDK (only needed once per account/region)
npx cdk bootstrap

Write-Host ""
Write-Host "⚡ Step 2: Synthesize CDK Templates" -ForegroundColor Cyan  
Write-Host "----------------------------------" -ForegroundColor Yellow
# Generate CloudFormation templates
npx cdk synth

Write-Host ""
Write-Host "🚀 Step 3: Deploy Development Stack" -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor Yellow
# Deploy development environment
npx cdk deploy MindsyncDevStack --require-approval never

Write-Host ""
Write-Host "🎉 DEPLOYMENT STATUS CHECK" -ForegroundColor Green
Write-Host "=========================="

# Get stack outputs
Write-Host "📋 Retrieving API Gateway URLs..." -ForegroundColor Cyan
aws cloudformation describe-stacks --stack-name MindsyncDevStack --region us-east-1 --query 'Stacks[0].Outputs' --output table

Write-Host ""
Write-Host "🔥 LEGENDARY DEPLOYMENT COMPLETE! 💪⚡" -ForegroundColor Red
Write-Host "======================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "📱 FRONTEND TEAM: API URLS ARE READY!" -ForegroundColor Green
Write-Host "👆 Copy the API Gateway URL from the table above" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. ✅ Copy API Gateway URL to frontend config" -ForegroundColor Green
Write-Host "2. ✅ Update S3 bucket name in upload service" -ForegroundColor Green
Write-Host "3. ✅ Test authentication endpoints" -ForegroundColor Green  
Write-Host "4. ✅ Validate file upload functionality" -ForegroundColor Green
Write-Host "5. ✅ Deploy to production!" -ForegroundColor Green
Write-Host ""
Write-Host "💪 LET'S MAKE MINDSYNC LEGENDARY! 🚀" -ForegroundColor Red
