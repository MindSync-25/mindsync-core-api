// routes/newsRoutes.js
const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const userNewsController = require('../controllers/userNewsController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.get('/categories', newsController.getCategories);
router.get('/articles', newsController.getArticles);

// Protected routes (require JWT)
router.get('/articles/mood/:mood', authenticateToken, newsController.getArticlesByMood);
router.post('/articles/:articleId/bookmark', authenticateToken, newsController.bookmarkArticle);
router.delete('/articles/:articleId/bookmark', authenticateToken, newsController.removeBookmark);
router.get('/bookmarks', authenticateToken, newsController.getBookmarks);
router.post('/articles/:articleId/view', authenticateToken, newsController.trackView);
router.post('/articles/:articleId/share', authenticateToken, newsController.trackShare);

// User preferences routes
router.post('/user/preferences', authenticateToken, userNewsController.savePreferences);
router.get('/user/preferences', authenticateToken, userNewsController.getPreferences);
router.put('/user/onboarding/complete', authenticateToken, userNewsController.completeOnboarding);

module.exports = router;
