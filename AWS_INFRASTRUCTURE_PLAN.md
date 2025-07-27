# AWS Infrastructure Setup - MindSync Core API

## 🏗️ **AWS ARCHITECTURE OVERVIEW**

```
Internet → CloudFront CDN → API Gateway → Lambda Functions
                                    ↓
┌─────────────────────┬─────────────────────┐
│   RDS PostgreSQL    │      DynamoDB       │
│   (Users/Auth)      │   (News/Cache)      │
└─────────────────────┴─────────────────────┘
                ↓
        S3 Buckets + EC2 (AI)
```

## ⚙️ **INFRASTRUCTURE COMPONENTS**

### **1. VPC & Networking**
- **VPC:** Custom VPC with public/private subnets
- **Subnets:** 3 AZs for high availability
- **Security Groups:** API, Database, Lambda-specific rules
- **NAT Gateway:** For private subnet internet access

### **2. Database Layer**
- **RDS PostgreSQL:** Primary user/auth database
- **DynamoDB:** News articles and caching
- **Backup Strategy:** Automated daily backups

### **3. API Layer**
- **API Gateway:** REST API endpoints
- **Lambda Functions:** Node.js serverless functions
- **Custom Domains:** api.mindsync.com

### **4. Storage & CDN**
- **S3 Buckets:** Static assets, uploads, backups
- **CloudFront:** Global CDN for performance
- **SSL/TLS:** Managed certificates via ACM

### **5. Security & Monitoring**
- **WAF:** API protection and rate limiting
- **CloudWatch:** Logging and monitoring
- **IAM:** Least privilege access policies

## 📋 **DEPLOYMENT ENVIRONMENTS**

### **Development**
- **API URL:** `https://dev-api.mindsync.com`
- **Database:** RDS t3.micro (free tier)
- **DynamoDB:** On-demand billing

### **Staging**
- **API URL:** `https://staging-api.mindsync.com`
- **Database:** RDS t3.small
- **Load Testing:** Enabled

### **Production**
- **API URL:** `https://api.mindsync.com`
- **Database:** RDS t3.medium with Multi-AZ
- **Auto-scaling:** Enabled for all services

## 🔐 **SECURITY CONFIGURATION**

### **API Security**
- JWT authentication (your existing system)
- CORS configuration for mobile app
- Rate limiting: 1000 requests/minute per user
- WAF rules for common attacks

### **Database Security**
- VPC isolation for RDS
- Encryption at rest and in transit
- Regular security patches
- Backup encryption

### **IAM Roles**
```javascript
// Lambda Execution Role
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "*"
    }
  ]
}
```

## 💾 **DATABASE MIGRATION PLAN**

### **Phase 1: RDS Setup**
1. Create RDS PostgreSQL instance
2. Set up VPC security groups
3. Create database schemas
4. Migrate existing data from local PG

### **Phase 2: DynamoDB Tables**
```javascript
// News Articles Table
{
  TableName: 'mindsync-news-articles',
  KeySchema: [
    { AttributeName: 'category', KeyType: 'HASH' },
    { AttributeName: 'publishedAt', KeyType: 'RANGE' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'mood-index',
      KeySchema: [
        { AttributeName: 'mood', KeyType: 'HASH' },
        { AttributeName: 'publishedAt', KeyType: 'RANGE' }
      ]
    }
  ]
}

// User Preferences Table
{
  TableName: 'mindsync-user-preferences',
  KeySchema: [
    { AttributeName: 'userId', KeyType: 'HASH' }
  ]
}
```

## 📂 **S3 BUCKET STRUCTURE**
```
mindsync-static-assets/
├── profiles/
│   ├── user-123/
│   │   └── avatar.jpg
├── tasks/
│   ├── user-123/
│   │   └── attachment-456.pdf
├── news-images/
│   ├── cached/
│   │   └── article-789.jpg
└── static-assets/
    ├── icons/
    └── fallback-images/
```

## 🔄 **API ENDPOINT MAPPING**

### **Lambda Functions Structure**
```javascript
// Function: mindsync-auth-service
exports.handler = async (event) => {
  // Handle: /api/auth/*
  // Routes: register, login, google, apple, refresh, profile
}

// Function: mindsync-news-service  
exports.handler = async (event) => {
  // Handle: /api/news/*
  // Routes: categories, recent, mood-based, personalized
}

// Function: mindsync-tasks-service
exports.handler = async (event) => {
  // Handle: /api/tasks/*
  // Routes: CRUD operations for tasks
}

// Function: mindsync-weather-service
exports.handler = async (event) => {
  // Handle: /api/weather/*
  // Routes: city-based, coordinates-based weather
}
```

## 📊 **COST ESTIMATION**

### **Monthly AWS Costs (Early Stage)**
```
RDS PostgreSQL (db.t3.micro):     $15-20
DynamoDB (On-Demand, low traffic): $5-10
Lambda (1M requests):              $0-5
API Gateway (1M requests):         $3-4
S3 Storage (10GB):                 $0.50
CloudFront (1TB transfer):         $8-10
Total Estimated:                   $30-50/month
```

## 🚀 **IMPLEMENTATION TIMELINE**

### **Week 1: Foundation (Jan 27 - Feb 2)**
- ✅ AWS Account setup with billing alerts
- ✅ VPC and networking configuration
- ✅ RDS PostgreSQL instance creation
- ✅ S3 buckets setup
- ✅ Basic IAM roles and policies

### **Week 2: Core Services (Feb 3 - Feb 9)**
- ✅ Lambda functions deployment
- ✅ API Gateway configuration
- ✅ DynamoDB tables creation
- ✅ Data migration from local to RDS
- ✅ Basic monitoring setup

### **Week 3: Integration & Security (Feb 10 - Feb 16)**
- ✅ CloudFront CDN setup
- ✅ SSL certificates via ACM
- ✅ WAF configuration
- ✅ CORS setup for mobile app
- ✅ End-to-end testing

### **Week 4: Production Ready (Feb 17 - Feb 23)**
- ✅ Auto-scaling configuration
- ✅ Backup and recovery procedures
- ✅ Load testing and optimization
- ✅ Production deployment
- ✅ Go-live coordination

## 🔧 **ENVIRONMENT VARIABLES FOR FRONTEND**

### **Development Environment**
```javascript
REACT_APP_API_BASE_URL=https://dev-api.mindsync.com
REACT_APP_S3_BUCKET=mindsync-dev-static-assets
REACT_APP_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
REACT_APP_AWS_REGION=us-east-1
REACT_APP_ENVIRONMENT=development
```

### **Production Environment**
```javascript
REACT_APP_API_BASE_URL=https://api.mindsync.com
REACT_APP_S3_BUCKET=mindsync-static-assets
REACT_APP_CLOUDFRONT_URL=https://cdn.mindsync.com
REACT_APP_AWS_REGION=us-east-1
REACT_APP_ENVIRONMENT=production
```

## 📱 **CORS CONFIGURATION**
```javascript
{
  "AllowOrigins": [
    "exp://192.168.1.100:19000",  // Expo dev
    "mindsync://auth",            // Deep linking
    "https://app.mindsync.com",   // PWA domain
    "capacitor://localhost",      // Capacitor mobile
    "ionic://localhost"           // Ionic mobile
  ],
  "AllowMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "AllowHeaders": [
    "Authorization",
    "Content-Type", 
    "X-Device-Type",
    "X-App-Version"
  ]
}
```

## 🔄 **CI/CD PIPELINE (GitHub Actions)**
```yaml
name: Deploy MindSync Backend
on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Deploy to AWS
        run: npx cdk deploy --require-approval never
```

## 📞 **IMMEDIATE NEXT STEPS**

### **STARTING NOW:**
1. ✅ AWS Account setup and billing configuration
2. ✅ Create CDK project structure
3. ✅ Set up VPC and basic networking
4. ✅ Initialize RDS PostgreSQL instance

### **NEED FROM YOU:**
1. **Domain name** for API (api.mindsync.com)
2. **SSL certificate** requirements
3. **Specific file upload limits** confirmation
4. **Team AWS access** requirements

## 🤝 **DAILY SYNC COORDINATION**

### **9 AM EST Check-ins:**
- Infrastructure progress updates
- Any blockers or questions
- Environment URLs as they become available
- Testing coordination

### **End-of-Day Reports:**
- Completed infrastructure components
- Next day priorities
- Environment configurations ready for frontend

## 🎯 **SUCCESS METRICS**

- **API Response Time:** < 200ms
- **Database Query Time:** < 50ms  
- **File Upload Speed:** < 5 seconds for 5MB
- **99.9% Uptime:** Target availability
- **Cost Efficiency:** Under $50/month initially

## 🔥 **LET'S DO THIS!**

Starting AWS foundation setup RIGHT NOW! The hybrid architecture with your existing JWT system is going to give us incredible performance and scalability.

**Backend + DevOps + Security Team - READY TO DOMINATE AWS! 🚀💪**

---

**STATUS: FOUNDATION SETUP IN PROGRESS... 🏗️**
