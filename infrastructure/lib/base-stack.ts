import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface MindsyncStackProps extends cdk.StackProps {
  environment: string;
  domainName: string;
}

export class MindsyncBaseStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly database: rds.DatabaseInstance;
  public readonly newsTable: dynamodb.Table;
  public readonly userPrefsTable: dynamodb.Table;
  public readonly staticBucket: s3.Bucket;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: MindsyncStackProps) {
    super(scope, id, props);

    // VPC with public and private subnets across 3 AZs
    this.vpc = new ec2.Vpc(this, 'MindsyncVpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Database subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: this.vpc,
      description: 'Subnet group for RDS PostgreSQL',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Database security group
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: false,
    });

    // Lambda security group
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Lambda functions',
    });

    // Allow Lambda to connect to database
    dbSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda functions to connect to PostgreSQL'
    );

    // RDS PostgreSQL instance
    this.database = new rds.DatabaseInstance(this, 'PostgresDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_2,
      }),
      instanceType: props.environment === 'prod' 
        ? ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)
        : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: this.vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      databaseName: 'mindsync',
      credentials: rds.Credentials.fromGeneratedSecret('postgres', {
        secretName: `mindsync-${props.environment}-db-credentials`,
      }),
      backupRetention: cdk.Duration.days(props.environment === 'prod' ? 7 : 3),
      deleteAutomatedBackups: props.environment !== 'prod',
      deletionProtection: props.environment === 'prod',
      multiAz: props.environment === 'prod',
      storageEncrypted: true,
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      autoMinorVersionUpgrade: true,
      allowMajorVersionUpgrade: false,
    });

    // DynamoDB Tables for News Service
    this.newsTable = new dynamodb.Table(this, 'NewsArticlesTable', {
      tableName: `mindsync-${props.environment}-news-articles`,
      partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'publishedAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.ON_DEMAND,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: props.environment === 'prod',
      timeToLiveAttribute: 'ttl',
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // Global Secondary Index for mood-based queries
    this.newsTable.addGlobalSecondaryIndex({
      indexName: 'mood-index',
      partitionKey: { name: 'mood', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'publishedAt', type: dynamodb.AttributeType.STRING },
    });

    // User preferences table
    this.userPrefsTable = new dynamodb.Table(this, 'UserPreferencesTable', {
      tableName: `mindsync-${props.environment}-user-preferences`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.ON_DEMAND,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: props.environment === 'prod',
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // S3 bucket for static assets
    this.staticBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      bucketName: `mindsync-${props.environment}-static-assets`,
      versioned: props.environment === 'prod',
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });

    // CORS configuration for S3
    this.staticBucket.addCorsRule({
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
      allowedOrigins: [
        'https://app.mindsync.com',
        'https://dev-app.mindsync.com',
        'exp://192.168.1.100:19000',
        'capacitor://localhost',
        'ionic://localhost'
      ],
      allowedHeaders: ['*'],
      maxAge: 3600,
    });

    // CloudFront distribution for CDN
    const distribution = new cloudfront.Distribution(this, 'CDNDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.staticBucket),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/fallback/404.jpg',
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe
    });

    // IAM role for Lambda functions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
      inlinePolicies: {
        DatabaseAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'rds:DescribeDBInstances',
                'rds-db:connect',
              ],
              resources: [this.database.instanceArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:BatchGetItem',
                'dynamodb:BatchWriteItem',
              ],
              resources: [
                this.newsTable.tableArn,
                this.userPrefsTable.tableArn,
                `${this.newsTable.tableArn}/index/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ],
              resources: [`${this.staticBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
              ],
              resources: [this.database.secret!.secretArn],
            }),
          ],
        }),
      },
    });

    // Lambda function for auth service
    const authFunction = new nodejs.NodejsFunction(this, 'AuthFunction', {
      functionName: `mindsync-${props.environment}-auth-service`,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: '../lambda/auth/index.ts',
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: props.environment,
        DB_SECRET_ARN: this.database.secret!.secretArn,
        DB_HOST: this.database.instanceEndpoint.hostname,
        DB_PORT: this.database.instanceEndpoint.port.toString(),
        DB_NAME: 'mindsync',
        USER_PREFS_TABLE: this.userPrefsTable.tableName,
        AWS_REGION: this.region,
      },
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      role: lambdaRole,
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: false,
      },
    });

    // Lambda function for news service
    const newsFunction = new nodejs.NodejsFunction(this, 'NewsFunction', {
      functionName: `mindsync-${props.environment}-news-service`,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: '../lambda/news/index.ts',
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      environment: {
        NODE_ENV: props.environment,
        NEWS_TABLE: this.newsTable.tableName,
        USER_PREFS_TABLE: this.userPrefsTable.tableName,
        S3_BUCKET: this.staticBucket.bucketName,
        CLOUDFRONT_URL: distribution.distributionDomainName,
        NEWS_API_KEY: 'YOUR_NEWS_API_KEY', // Replace with actual key
        GNEWS_API_KEY: 'YOUR_GNEWS_API_KEY', // Replace with actual key
        AWS_REGION: this.region,
      },
      role: lambdaRole,
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: false,
      },
    });

    // Lambda function for tasks service
    const tasksFunction = new nodejs.NodejsFunction(this, 'TasksFunction', {
      functionName: `mindsync-${props.environment}-tasks-service`,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: '../lambda/tasks/index.ts',
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: props.environment,
        DB_SECRET_ARN: this.database.secret!.secretArn,
        DB_HOST: this.database.instanceEndpoint.hostname,
        DB_PORT: this.database.instanceEndpoint.port.toString(),
        DB_NAME: 'mindsync',
        S3_BUCKET: this.staticBucket.bucketName,
        AWS_REGION: this.region,
      },
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      role: lambdaRole,
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: false,
      },
    });

    // Lambda function for weather service
    const weatherFunction = new nodejs.NodejsFunction(this, 'WeatherFunction', {
      functionName: `mindsync-${props.environment}-weather-service`,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: '../lambda/weather/index.ts',
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_ENV: props.environment,
        WEATHER_API_KEY: 'YOUR_OPENWEATHER_API_KEY', // Replace with actual key
        AWS_REGION: this.region,
      },
      role: lambdaRole,
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
        sourceMap: false,
      },
    });

    // API Gateway with CORS
    this.api = new apigateway.RestApi(this, 'MindsyncApi', {
      restApiName: `mindsync-${props.environment}-api`,
      description: `MindSync Core API - ${props.environment}`,
      deployOptions: {
        stageName: props.environment,
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: props.environment !== 'prod',
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: [
          'https://app.mindsync.com',
          'https://dev-app.mindsync.com',
          'exp://192.168.1.100:19000',
          'mindsync://auth',
          'capacitor://localhost',
          'ionic://localhost'
        ],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Device-Type',
          'X-App-Version'
        ],
      },
      binaryMediaTypes: ['image/*', 'application/pdf'],
    });

    // API resources and methods
    const authResource = this.api.root.addResource('auth');
    const newsResource = this.api.root.addResource('news');
    const tasksResource = this.api.root.addResource('tasks');
    const weatherResource = this.api.root.addResource('weather');

    // Auth endpoints
    authResource.addMethod('POST', new apigateway.LambdaIntegration(authFunction));
    authResource.addMethod('GET', new apigateway.LambdaIntegration(authFunction));
    authResource.addMethod('PUT', new apigateway.LambdaIntegration(authFunction));
    
    // Auth sub-resources
    authResource.addResource('register').addMethod('POST', new apigateway.LambdaIntegration(authFunction));
    authResource.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(authFunction));
    authResource.addResource('google').addMethod('POST', new apigateway.LambdaIntegration(authFunction));
    authResource.addResource('apple').addMethod('POST', new apigateway.LambdaIntegration(authFunction));
    authResource.addResource('refresh').addMethod('POST', new apigateway.LambdaIntegration(authFunction));
    authResource.addResource('profile').addMethod('GET', new apigateway.LambdaIntegration(authFunction));
    authResource.addResource('profile').addMethod('PUT', new apigateway.LambdaIntegration(authFunction));

    // News endpoints
    newsResource.addMethod('GET', new apigateway.LambdaIntegration(newsFunction));
    newsResource.addResource('personalized').addMethod('GET', new apigateway.LambdaIntegration(newsFunction));
    newsResource.addResource('categories').addMethod('GET', new apigateway.LambdaIntegration(newsFunction));
    newsResource.addResource('category').addResource('{category}').addMethod('GET', new apigateway.LambdaIntegration(newsFunction));
    newsResource.addResource('mood').addResource('{mood}').addMethod('GET', new apigateway.LambdaIntegration(newsFunction));

    // Tasks endpoints
    tasksResource.addMethod('GET', new apigateway.LambdaIntegration(tasksFunction));
    tasksResource.addMethod('POST', new apigateway.LambdaIntegration(tasksFunction));
    tasksResource.addResource('{taskId}').addMethod('GET', new apigateway.LambdaIntegration(tasksFunction));
    tasksResource.addResource('{taskId}').addMethod('PUT', new apigateway.LambdaIntegration(tasksFunction));
    tasksResource.addResource('{taskId}').addMethod('DELETE', new apigateway.LambdaIntegration(tasksFunction));

    // Weather endpoints
    weatherResource.addResource('{city}').addMethod('GET', new apigateway.LambdaIntegration(weatherFunction));
    weatherResource.addResource('coordinates').addMethod('GET', new apigateway.LambdaIntegration(weatherFunction));

    // WAF for API protection (production only)
    if (props.environment === 'prod') {
      const webAcl = new wafv2.CfnWebACL(this, 'ApiWebAcl', {
        scope: 'REGIONAL',
        defaultAction: { allow: {} },
        rules: [
          {
            name: 'RateLimitRule',
            priority: 1,
            statement: {
              rateBasedStatement: {
                limit: 1000,
                aggregateKeyType: 'IP',
              },
            },
            action: { block: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'RateLimitRule',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: 'MindsyncApiWebAcl',
        },
      });

      new wafv2.CfnWebACLAssociation(this, 'ApiWebAclAssociation', {
        resourceArn: this.api.deploymentStage.stageArn,
        webAclArn: webAcl.attrArn,
      });
    }

    // Output important values
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      description: 'API Gateway endpoint URL',
      exportName: `MindsyncApiUrl-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL endpoint',
      exportName: `MindsyncDbEndpoint-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.staticBucket.bucketName,
      description: 'S3 bucket for static assets',
      exportName: `MindsyncS3Bucket-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionUrl', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution URL',
      exportName: `MindsyncCloudFrontUrl-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'NewsTableName', {
      value: this.newsTable.tableName,
      description: 'DynamoDB news articles table',
      exportName: `MindsyncNewsTable-${props.environment}`,
    });
  }
}
