const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');

router.use(protect);
router.route('/').get(getSuppliers).post(authorize('admin', 'manager'), createSupplier);
router.route('/:id').get(getSupplier).put(authorize('admin', 'manager'), updateSupplier).delete(authorize('admin'), deleteSupplier);

module.exports = router;
