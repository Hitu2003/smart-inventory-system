const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../config/multer');
const {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, getLowStockProducts, updateStock, getProductStats,
  uploadProductImage,
} = require('../controllers/productController');

router.use(protect);

router.get('/low-stock', getLowStockProducts);
router.get('/stats', getProductStats);
router.route('/').get(getProducts).post(authorize('admin', 'manager'), createProduct);
router.route('/:id')
  .get(getProduct)
  .put(authorize('admin', 'manager'), updateProduct)
  .delete(authorize('admin'), deleteProduct);
router.patch('/:id/stock', authorize('admin', 'manager', 'staff'), updateStock);
router.post('/:id/upload-image', authorize('admin', 'manager'), upload.single('image'), uploadProductImage);

module.exports = router;
