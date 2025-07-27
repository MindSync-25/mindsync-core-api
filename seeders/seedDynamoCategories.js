// seeders/seedDynamoCategories.js
const dynamoService = require('../db/dynamodb');

const categories = [
  {
    name: 'general',
    displayName: 'General',
    description: 'General news and current events',
    icon: '📰',
    color: '#6B7280',
    sortOrder: 1,
    isActive: true,
    keywords: ['news', 'current events', 'headlines']
  },
  {
    name: 'business',
    displayName: 'Business',
    description: 'Business news and market updates',
    icon: '💼',
    color: '#10B981',
    sortOrder: 2,
    isActive: true,
    keywords: ['business', 'market', 'economy', 'finance']
  },
  {
    name: 'technology',
    displayName: 'Technology',
    description: 'Latest in tech and innovation',
    icon: '💻',
    color: '#3B82F6',
    sortOrder: 3,
    isActive: true,
    keywords: ['technology', 'tech', 'innovation', 'digital']
  },
  {
    name: 'science',
    displayName: 'Science',
    description: 'Scientific discoveries and research',
    icon: '🔬',
    color: '#8B5CF6',
    sortOrder: 4,
    isActive: true,
    keywords: ['science', 'research', 'discovery', 'study']
  },
  {
    name: 'health',
    displayName: 'Health',
    description: 'Health and wellness news',
    icon: '🏥',
    color: '#EF4444',
    sortOrder: 5,
    isActive: true,
    keywords: ['health', 'wellness', 'medical', 'healthcare']
  },
  {
    name: 'sports',
    displayName: 'Sports',
    description: 'Sports news and updates',
    icon: '⚽',
    color: '#F59E0B',
    sortOrder: 6,
    isActive: true,
    keywords: ['sports', 'game', 'team', 'player']
  },
  {
    name: 'entertainment',
    displayName: 'Entertainment',
    description: 'Entertainment and celebrity news',
    icon: '🎬',
    color: '#EC4899',
    sortOrder: 7,
    isActive: true,
    keywords: ['entertainment', 'celebrity', 'movie', 'music']
  },
  {
    name: 'politics',
    displayName: 'Politics',
    description: 'Political news and government updates',
    icon: '🏛️',
    color: '#DC2626',
    sortOrder: 8,
    isActive: true,
    keywords: ['politics', 'government', 'election', 'policy']
  },
  {
    name: 'world',
    displayName: 'World',
    description: 'International news and global events',
    icon: '🌍',
    color: '#059669',
    sortOrder: 9,
    isActive: true,
    keywords: ['world', 'international', 'global', 'foreign']
  },
  {
    name: 'finance',
    displayName: 'Finance',
    description: 'Financial markets and investment news',
    icon: '💰',
    color: '#16A34A',
    sortOrder: 10,
    isActive: true,
    keywords: ['finance', 'investment', 'stock', 'market']
  },
  {
    name: 'lifestyle',
    displayName: 'Lifestyle',
    description: 'Lifestyle and culture news',
    icon: '✨',
    color: '#A855F7',
    sortOrder: 11,
    isActive: true,
    keywords: ['lifestyle', 'culture', 'fashion', 'travel']
  },
  {
    name: 'education',
    displayName: 'Education',
    description: 'Education and learning news',
    icon: '📚',
    color: '#2563EB',
    sortOrder: 12,
    isActive: true,
    keywords: ['education', 'learning', 'school', 'university']
  },
  {
    name: 'environment',
    displayName: 'Environment',
    description: 'Environmental and climate news',
    icon: '🌱',
    color: '#22C55E',
    sortOrder: 13,
    isActive: true,
    keywords: ['environment', 'climate', 'sustainability', 'nature']
  },
  {
    name: 'travel',
    displayName: 'Travel',
    description: 'Travel and tourism news',
    icon: '✈️',
    color: '#06B6D4',
    sortOrder: 14,
    isActive: true,
    keywords: ['travel', 'tourism', 'destination', 'vacation']
  }
];

async function seedCategories() {
  console.log('🌱 Starting DynamoDB news categories seeding...');
  
  try {
    let createdCount = 0;
    
    for (const category of categories) {
      try {
        console.log(`📝 Creating category: ${category.displayName}`);
        await dynamoService.createCategory(category);
        createdCount++;
        console.log(`✅ Created: ${category.displayName}`);
      } catch (error) {
        console.error(`❌ Error creating category ${category.displayName}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Categories seeding completed!`);
    console.log(`✅ Successfully created: ${createdCount}/${categories.length} categories`);
    console.log(`💾 All categories stored in DynamoDB NewsCategories table`);
    
    return {
      success: true,
      created: createdCount,
      total: categories.length
    };
    
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedCategories()
    .then(() => {
      console.log('✅ Categories seeding completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Categories seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedCategories };
