const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboardStats, getSalesAnalytics } = require('../controllers/dashboardController');

router.use(protect);
router.get('/stats', getDashboardStats);
router.get('/analytics', getSalesAnalytics);

module.exports = router;
