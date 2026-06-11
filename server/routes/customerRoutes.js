const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCustomers, getCustomer, createCustomer,
  updateCustomer, deleteCustomer, getCustomerStats,
} = require('../controllers/customerController');

router.use(protect);
router.get('/stats', getCustomerStats);
router.route('/').get(getCustomers).post(createCustomer);
router.route('/:id').get(getCustomer).put(updateCustomer).delete(authorize('admin', 'manager'), deleteCustomer);

module.exports = router;
