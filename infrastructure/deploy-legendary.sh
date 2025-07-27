#!/usr/bin/env bash

# 🚀 LEGENDARY DEPLOYMENT SCRIPT - CONTINUOUS EXECUTION!
# Frontend Lead - Let's make this LEGENDARY!

echo "🔥 STARTING LEGENDARY DEPLOYMENT RIGHT NOW! ⚡"
echo "==============================================="

# Set AWS region
export AWS_DEFAULT_REGION=us-east-1

# Essential environment variables (using defaults for immediate deployment)
export JWT_SECRET="mindsync-legendary-jwt-secret-2025-production-ready"
export NEWS_API_KEY="get-your-newsapi-key-from-newsapi.org"
export GNEWS_API_KEY="get-your-gnews-key-from-gnews.io"
export WEATHER_API_KEY="get-your-openweather-key-from-openweathermap.org"

echo "🎯 Step 1: CDK Bootstrap (if needed)"
echo "-----------------------------------"
# Bootstrap CDK (only needed once per account/region)
npx cdk bootstrap

echo ""
echo "⚡ Step 2: Synthesize CDK Templates"
echo "----------------------------------"
# Generate CloudFormation templates
npx cdk synth

echo ""
echo "🚀 Step 3: Deploy Development Stack"
echo "-----------------------------------"
# Deploy development environment
npx cdk deploy MindsyncDevStack --require-approval never

echo ""
echo "🎉 DEPLOYMENT STATUS CHECK"
echo "=========================="

# Get stack outputs
echo "📋 Retrieving API Gateway URLs..."
aws cloudformation describe-stacks --stack-name MindsyncDevStack --region us-east-1 --query 'Stacks[0].Outputs' --output table

echo ""
echo "🔥 LEGENDARY DEPLOYMENT COMPLETE! 💪⚡"
echo "======================================"
echo ""
echo "📱 FRONTEND TEAM: API URLS ARE READY!"
echo "👆 Copy the API Gateway URL from the table above"
echo ""
echo "🎯 Next Steps:"
echo "1. ✅ Copy API Gateway URL to frontend config"
echo "2. ✅ Update S3 bucket name in upload service"  
echo "3. ✅ Test authentication endpoints"
echo "4. ✅ Validate file upload functionality"
echo "5. ✅ Deploy to production!"
echo ""
echo "💪 LET'S MAKE MINDSYNC LEGENDARY! 🚀"
