const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, recommendationController.getRecommendations);

module.exports = router;