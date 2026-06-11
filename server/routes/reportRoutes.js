const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getInventoryReport, getSalesReport, getStockMovementReport } = require('../controllers/reportController');

router.use(protect);
router.get('/inventory', getInventoryReport);
router.get('/sales', getSalesReport);
router.get('/stock-movement', getStockMovementReport);

module.exports = router;
