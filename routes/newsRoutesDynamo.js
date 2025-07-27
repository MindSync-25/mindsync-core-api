// routes/newsRoutesDynamo.js
const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsControllerDynamo');
const userNewsController = require('../controllers/userNewsControllerDynamo');
const authMiddleware = require('../middleware/auth');

// Public news routes (no authentication required)
router.get('/categories', newsController.getCategories);
router.get('/category/:category', newsController.getArticlesByCategory);
router.get('/recent', newsController.getRecentArticles);
router.get('/mood/:mood', newsController.getMoodBasedArticles);

// Track article view (can work without auth for analytics)
router.post('/article/:articleId/view', authMiddleware.optional, newsController.trackArticleView);

// User-specific news routes (authentication required)
router.use(authMiddleware.required); // All routes below require authentication

// Personalized news feed
router.get('/personalized', newsController.getPersonalizedFeed);

// User preferences
router.post('/user/preferences', userNewsController.savePreferences);
router.get('/user/preferences', userNewsController.getPreferences);

// User bookmarks
router.post('/user/bookmarks', userNewsController.addBookmark);
router.delete('/user/bookmarks/:articleId', userNewsController.removeBookmark);
router.get('/user/bookmarks', userNewsController.getBookmarks);
router.get('/user/bookmarks/:articleId/check', userNewsController.checkBookmark);

// User activity tracking
router.post('/user/activity', userNewsController.trackActivity);
router.get('/user/stats', userNewsController.getReadingStats);

module.exports = router;
