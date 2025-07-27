// scripts/createDynamoTables.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const dynamoDBConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined, // For local development
  credentials: process.env.NODE_ENV === 'development' ? {
    accessKeyId: 'local',
    secretAccessKey: 'local'
  } : undefined
};

const client = new DynamoDBClient(dynamoDBConfig);

async function tableExists(tableName) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function createNewsArticlesTable() {
  const params = {
    TableName: 'NewsArticles',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },  // CATEGORY#category
      { AttributeName: 'SK', KeyType: 'RANGE' }  // ARTICLE#publishedAt#id
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'GSI1PK', AttributeType: 'S' },
      { AttributeName: 'GSI1SK', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GSI1',
        KeySchema: [
          { AttributeName: 'GSI1PK', KeyType: 'HASH' },  // MOOD#mood
          { AttributeName: 'GSI1SK', KeyType: 'RANGE' }  // publishedAt
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10
    },
    TimeToLiveSpecification: {
      AttributeName: 'TTL',
      Enabled: true
    }
  };

  return await client.send(new CreateTableCommand(params));
}

async function createUserPreferencesTable() {
  const params = {
    TableName: 'UserPreferences',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },  // USER#userId
      { AttributeName: 'SK', KeyType: 'RANGE' }  // PREFERENCES#NEWS
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  return await client.send(new CreateTableCommand(params));
}

async function createUserActivityTable() {
  const params = {
    TableName: 'UserActivity',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },  // USER#userId
      { AttributeName: 'SK', KeyType: 'RANGE' }  // ACTIVITY#timestamp#actionType
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    },
    TimeToLiveSpecification: {
      AttributeName: 'TTL',
      Enabled: true
    }
  };

  return await client.send(new CreateTableCommand(params));
}

async function createUserBookmarksTable() {
  const params = {
    TableName: 'UserBookmarks',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },  // USER#userId
      { AttributeName: 'SK', KeyType: 'RANGE' }  // BOOKMARK#articleId
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  return await client.send(new CreateTableCommand(params));
}

async function createNewsCategoriesTable() {
  const params = {
    TableName: 'NewsCategories',
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },  // CATEGORY#name
      { AttributeName: 'SK', KeyType: 'RANGE' }  // METADATA
    ],
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  return await client.send(new CreateTableCommand(params));
}

async function createAllTables() {
  const tables = [
    { name: 'NewsArticles', createFunc: createNewsArticlesTable },
    { name: 'UserPreferences', createFunc: createUserPreferencesTable },
    { name: 'UserActivity', createFunc: createUserActivityTable },
    { name: 'UserBookmarks', createFunc: createUserBookmarksTable },
    { name: 'NewsCategories', createFunc: createNewsCategoriesTable }
  ];

  console.log('🚀 Starting DynamoDB table creation...\n');

  for (const table of tables) {
    try {
      console.log(`📋 Checking if ${table.name} exists...`);
      
      if (await tableExists(table.name)) {
        console.log(`✅ ${table.name} already exists, skipping...\n`);
        continue;
      }

      console.log(`🔨 Creating ${table.name}...`);
      await table.createFunc();
      console.log(`✅ ${table.name} created successfully!\n`);
      
    } catch (error) {
      console.error(`❌ Error creating ${table.name}:`, error.message);
      if (error.name !== 'ResourceInUseException') {
        process.exit(1);
      }
    }
  }

  console.log('🎉 All DynamoDB tables created successfully!');
  console.log('\n📊 Table Structure:');
  console.log('├── NewsArticles (Articles with TTL, GSI for mood-based queries)');
  console.log('├── UserPreferences (User interests and settings)');
  console.log('├── UserActivity (Activity tracking with TTL)');
  console.log('├── UserBookmarks (User bookmarked articles)');
  console.log('└── NewsCategories (Available news categories)');
  console.log('\n💡 Next: Run "npm run seed-dynamo-categories" to populate categories');
}

// Run if called directly
if (require.main === module) {
  createAllTables()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to create tables:', error);
      process.exit(1);
    });
}

module.exports = { createAllTables };
