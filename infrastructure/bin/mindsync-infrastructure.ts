#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MindsyncDevStack } from '../lib/dev-stack';
import { MindsyncStagingStack } from '../lib/staging-stack';
import { MindsyncProdStack } from '../lib/prod-stack';

const app = new cdk.App();

// Development Environment
new MindsyncDevStack(app, 'MindsyncDevStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  environment: 'dev',
  domainName: 'dev-api.mindsync.com',
  tags: {
    Project: 'MindSync',
    Environment: 'Development',
    Owner: 'MindsyncTeam'
  }
});

// Staging Environment
new MindsyncStagingStack(app, 'MindsyncStagingStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  environment: 'staging',
  domainName: 'staging-api.mindsync.com',
  tags: {
    Project: 'MindSync',
    Environment: 'Staging',
    Owner: 'MindsyncTeam'
  }
});

// Production Environment
new MindsyncProdStack(app, 'MindsyncProdStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  environment: 'prod',
  domainName: 'api.mindsync.com',
  tags: {
    Project: 'MindSync',
    Environment: 'Production',
    Owner: 'MindsyncTeam'
  }
});

app.synth();
