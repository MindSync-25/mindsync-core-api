# MindSync AWS Deployment Scripts

## 🚀 Quick Deployment Guide

### Prerequisites
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
```

### 1. Bootstrap CDK (One-time setup)
```bash
cd infrastructure
npm install
npx cdk bootstrap aws://YOUR-ACCOUNT-ID/us-east-1
```

### 2. Deploy Development Environment
```bash
cd infrastructure
npm run deploy:dev
```

### 3. Deploy Production Environment
```bash
cd infrastructure
npm run deploy:prod
```

## 🔧 Manual Deployment Commands

### Development
```bash
# Set environment variables
export NODE_ENV=development
export JWT_SECRET="your-dev-jwt-secret"
export NEWS_API_KEY="your-news-api-key"
export GNEWS_API_KEY="your-gnews-api-key" 
export WEATHER_API_KEY="your-weather-api-key"

# Deploy
cd infrastructure
npx cdk deploy MindsyncDevStack --require-approval never
```

### Production
```bash
# Set environment variables
export NODE_ENV=production
export JWT_SECRET="your-prod-jwt-secret"
export NEWS_API_KEY="your-news-api-key"
export GNEWS_API_KEY="your-gnews-api-key"
export WEATHER_API_KEY="your-weather-api-key"

# Deploy
cd infrastructure
npx cdk deploy MindsyncProdStack --require-approval never
```

## 📋 Environment URLs After Deployment

### Development
- **API Gateway:** `https://dev-api.mindsync.com`
- **S3 Bucket:** `mindsync-dev-static-assets`
- **CloudFront:** Auto-generated URL provided in output

### Production  
- **API Gateway:** `https://api.mindsync.com`
- **S3 Bucket:** `mindsync-static-assets`
- **CloudFront:** `https://cdn.mindsync.com`

## 🔍 Monitoring & Logs

### View Lambda Logs
```bash
# Auth service logs
aws logs tail /aws/lambda/mindsync-dev-auth-service --follow

# News service logs  
aws logs tail /aws/lambda/mindsync-dev-news-service --follow
```

### Database Connection Test
```bash
# Get RDS endpoint from outputs
aws cloudformation describe-stacks --stack-name MindsyncDevStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text

# Test connection (requires bastion host or VPN)
psql -h YOUR-RDS-ENDPOINT -U postgres -d mindsync
```

## 🗑️ Cleanup Commands

### Destroy Development
```bash
cd infrastructure
npx cdk destroy MindsyncDevStack
```

### Destroy Production (⚠️ BE CAREFUL!)
```bash
cd infrastructure
npx cdk destroy MindsyncProdStack
```

## 🐛 Troubleshooting

### Common Issues

1. **CDK Bootstrap Error**
   ```bash
   npx cdk bootstrap --trust=YOUR-ACCOUNT-ID --cloudformation-execution-policies=arn:aws:iam::aws:policy/AdministratorAccess
   ```

2. **Lambda Deployment Timeout**
   ```bash
   # Increase timeout in base-stack.ts
   timeout: cdk.Duration.seconds(60)
   ```

3. **Database Connection Issues**
   ```bash
   # Check security groups allow Lambda access
   # Verify VPC configuration
   # Ensure secrets manager permissions
   ```

4. **API Gateway CORS Issues**
   ```bash
   # Update allowed origins in base-stack.ts
   # Redeploy API Gateway stage
   ```

## 📊 Cost Monitoring

### Set Up Billing Alerts
```bash
aws budgets create-budget --account-id YOUR-ACCOUNT-ID --budget '{
  "BudgetName": "MindSync-Monthly-Budget",
  "BudgetLimit": {
    "Amount": "50",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}'
```

### View Current Costs
```bash
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## 🔐 Security Checklist

- [ ] VPC with private subnets for database
- [ ] Security groups with minimal access
- [ ] IAM roles with least privilege
- [ ] Database encryption at rest
- [ ] SSL/TLS certificates
- [ ] WAF rules for API protection
- [ ] Secrets in AWS Secrets Manager
- [ ] Regular security patches

## 📞 Support

If you encounter issues:

1. **Check CloudFormation Events**
   ```bash
   aws cloudformation describe-stack-events --stack-name MindsyncDevStack
   ```

2. **View Lambda Function Details**
   ```bash
   aws lambda get-function --function-name mindsync-dev-auth-service
   ```

3. **Test API Endpoints**
   ```bash
   curl -X GET "https://dev-api.mindsync.com/health" \
     -H "Content-Type: application/json"
   ```

---

**Happy Deploying! 🚀**
