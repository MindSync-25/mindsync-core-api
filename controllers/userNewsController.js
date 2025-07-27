// controllers/userNewsController.js
const UserNewsPreference = require('../models/UserNewsPreference');
const NewsCategory = require('../models/NewsCategory');
const User = require('../models/User');

module.exports = {
  // POST /api/user/news/preferences
  async savePreferences(req, res) {
    try {
      const { interests, setupComplete } = req.body;
      const userId = req.user.id;

      // Clear existing preferences
      await UserNewsPreference.destroy({ where: { userId } });

      // Add new preferences
      if (interests && interests.length > 0) {
        const categories = await NewsCategory.findAll({
          where: { name: interests }
        });

        const preferences = categories.map(category => ({
          userId,
          categoryId: category.id,
          isSelected: true,
          priorityLevel: 'medium'
        }));

        await UserNewsPreference.bulkCreate(preferences);
      }

      // Update user onboarding status
      if (setupComplete !== undefined) {
        await User.update(
          { newsOnboardingComplete: setupComplete },
          { where: { id: userId } }
        );
      }

      res.json({ success: true, message: 'Preferences saved successfully' });
    } catch (error) {
      console.error('Error saving preferences:', error);
      res.status(500).json({ error: 'Failed to save preferences', details: error.message });
    }
  },

  // GET /api/user/news/preferences
  async getPreferences(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      const preferences = await UserNewsPreference.findAll({
        where: { userId, isSelected: true },
        include: [{ model: NewsCategory, attributes: ['name'] }]
      });

      const interests = preferences.map(pref => pref.NewsCategory.name);
      const preferencesMap = {};
      preferences.forEach(pref => {
        preferencesMap[pref.NewsCategory.name] = {
          priority: pref.priorityLevel
        };
      });

      res.json({
        interests,
        setupComplete: user.newsOnboardingComplete || false,
        preferences: preferencesMap
      });
    } catch (error) {
      console.error('Error fetching preferences:', error);
      res.status(500).json({ error: 'Failed to fetch preferences', details: error.message });
    }
  },

  // PUT /api/user/news/onboarding/complete
  async completeOnboarding(req, res) {
    try {
      const { completed } = req.body;
      const userId = req.user.id;

      await User.update(
        { 
          newsOnboardingComplete: completed,
          newsPermissionGranted: completed 
        },
        { where: { id: userId } }
      );

      res.json({ success: true, message: 'Onboarding completed successfully' });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      res.status(500).json({ error: 'Failed to complete onboarding', details: error.message });
    }
  }
};
