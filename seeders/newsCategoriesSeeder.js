// seeders/newsCategoriesSeeder.js
const NewsCategory = require('../models/NewsCategory');

const seedNewsCategories = async () => {
  try {
    const categories = [
      { name: 'technology', displayName: 'Technology', description: 'Latest tech news and innovations', icon: 'laptop-outline', color: '#007AFF', sortOrder: 1 },
      { name: 'health', displayName: 'Health & Wellness', description: 'Health tips and medical breakthroughs', icon: 'fitness-outline', color: '#34C759', sortOrder: 2 },
      { name: 'sports', displayName: 'Sports', description: 'Sports news and updates', icon: 'football-outline', color: '#FF9500', sortOrder: 3 },
      { name: 'entertainment', displayName: 'Entertainment', description: 'Movies, music, and celebrity news', icon: 'musical-notes-outline', color: '#AF52DE', sortOrder: 4 },
      { name: 'business', displayName: 'Business', description: 'Business and financial news', icon: 'briefcase-outline', color: '#FF3B30', sortOrder: 5 },
      { name: 'science', displayName: 'Science', description: 'Scientific discoveries and research', icon: 'flask-outline', color: '#5AC8FA', sortOrder: 6 },
      { name: 'world', displayName: 'World News', description: 'International news and events', icon: 'earth-outline', color: '#FFCC02', sortOrder: 7 },
      { name: 'lifestyle', displayName: 'Lifestyle', description: 'Fashion, travel, and lifestyle content', icon: 'heart-outline', color: '#FF2D92', sortOrder: 8 },
      { name: 'food', displayName: 'Food & Cooking', description: 'Recipes and culinary trends', icon: 'restaurant-outline', color: '#32D74B', sortOrder: 9 },
      { name: 'travel', displayName: 'Travel', description: 'Travel guides and destination news', icon: 'airplane-outline', color: '#007AFF', sortOrder: 10 },
      { name: 'education', displayName: 'Education', description: 'Learning resources and educational news', icon: 'school-outline', color: '#5856D6', sortOrder: 11 },
      { name: 'environment', displayName: 'Environment', description: 'Climate and environmental news', icon: 'leaf-outline', color: '#30B0C7', sortOrder: 12 },
      { name: 'politics', displayName: 'Politics', description: 'Political news and analysis', icon: 'library-outline', color: '#8E8E93', sortOrder: 13 },
      { name: 'gaming', displayName: 'Gaming', description: 'Video game news and reviews', icon: 'game-controller-outline', color: '#FF6B35', sortOrder: 14 }
    ];

    for (const category of categories) {
      await NewsCategory.findOrCreate({
        where: { name: category.name },
        defaults: category
      });
    }

    console.log('News categories seeded successfully');
  } catch (error) {
    console.error('Error seeding news categories:', error);
  }
};

module.exports = seedNewsCategories;
