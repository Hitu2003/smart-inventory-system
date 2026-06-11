const Product = require('../models/Product');
const Notification = require('../models/Notification');
const APIFeatures = require('../utils/apiFeatures');
const ErrorResponse = require('../utils/errorResponse');
const { createAuditLog } = require('../utils/auditLogger');

// @desc    Get all products
// @route   GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    // Build base query
    const baseFilter = { isActive: true };

    // Stock status filter
    if (req.query.stockStatus) {
      const statusMap = {
        in_stock: { $expr: { $and: [{ $gt: ['$quantity', '$reorderPoint'] }, { $lte: ['$quantity', { $multiply: ['$reorderPoint', 3] }] }] } },
        low_stock: { $expr: { $and: [{ $lte: ['$quantity', '$reorderPoint'] }, { $gt: ['$quantity', 0] }] } },
        out_of_stock: { quantity: 0 },
        overstock: { $expr: { $gt: ['$quantity', { $multiply: ['$reorderPoint', 3] }] } },
      };
      Object.assign(baseFilter, statusMap[req.query.stockStatus] || {});
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      baseFilter['price.selling'] = {};
      if (req.query.minPrice) baseFilter['price.selling'].$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) baseFilter['price.selling'].$lte = parseFloat(req.query.maxPrice);
    }

    // Supplier filter
    if (req.query.supplier) {
      baseFilter.supplier = req.query.supplier;
    }

    // Category filter
    if (req.query.category) {
      baseFilter.category = req.query.category;
    }

    // Strip handled params before passing to APIFeatures
    const cleanQuery = { ...req.query };
    ['stockStatus', 'minPrice', 'maxPrice', 'supplier', 'category'].forEach((k) => delete cleanQuery[k]);

    const total = await Product.countDocuments(baseFilter);
    const features = new APIFeatures(
      Product.find(baseFilter).populate('category', 'name color icon').populate('supplier', 'name code'),
      cleanQuery
    ).search(['name', 'sku', 'barcode']).sort().limitFields().paginate();

    const products = await features.query;

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: features.page,
      pages: Math.ceil(total / (features.limit || 20)),
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name color icon')
      .populate('supplier', 'name code email phone')
      .populate('createdBy', 'name email');

    if (!product) return next(new ErrorResponse('Product not found', 404));
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// @desc    Create product
// @route   POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    const product = await Product.create(req.body);

    await createAuditLog({
      action: 'PRODUCT_CREATE', module: 'product',
      description: `Created product "${product.name}" (${product.sku})`,
      performedBy: req.user._id, performedByName: req.user.name, performedByRole: req.user.role,
      targetId: product._id, targetModel: 'Product', targetName: product.name,
      changes: { after: { name: product.name, sku: product.sku, quantity: product.quantity, price: product.price } },
      ipAddress: req.ip, status: 'success',
    });

    const io = req.app.get('io');
    if (io) io.emit('product:created', product);
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
};

// @desc    Update product
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    req.body.updatedBy = req.user.id;
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('category', 'name color icon').populate('supplier', 'name code');

    if (!product) return next(new ErrorResponse('Product not found', 404));

    // Check low stock after update
    if (product.quantity <= product.reorderPoint && product.quantity > 0) {
      await Notification.create({
        title: 'Low Stock Alert',
        message: `${product.name} (${product.sku}) is running low. Current stock: ${product.quantity}`,
        type: 'low_stock',
        priority: 'high',
        relatedProduct: product._id,
        actionUrl: `/products/${product._id}`,
      });
      const io = req.app.get('io');
      if (io) io.emit('notification:new', { type: 'low_stock', product });
    }

    if (product.quantity === 0) {
      await Notification.create({
        title: 'Out of Stock',
        message: `${product.name} (${product.sku}) is out of stock`,
        type: 'out_of_stock',
        priority: 'critical',
        relatedProduct: product._id,
        actionUrl: `/products/${product._id}`,
      });
      const io = req.app.get('io');
      if (io) io.emit('notification:new', { type: 'out_of_stock', product });
    }

    const io = req.app.get('io');
    if (io) io.emit('product:updated', product);

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) return next(new ErrorResponse('Product not found', 404));

    const io = req.app.get('io');
    if (io) io.emit('product:deleted', { id: req.params.id });

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$reorderPoint'] },
    }).populate('category', 'name color').populate('supplier', 'name');

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
};

// @desc    Update stock quantity
// @route   PATCH /api/products/:id/stock
exports.updateStock = async (req, res, next) => {
  try {
    const { quantity, operation, notes } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorResponse('Product not found', 404));

    const previousStock = product.quantity;
    if (operation === 'add') product.quantity += quantity;
    else if (operation === 'subtract') {
      if (product.quantity < quantity) return next(new ErrorResponse('Insufficient stock', 400));
      product.quantity -= quantity;
    } else {
      product.quantity = quantity;
    }

    product.updatedBy = req.user.id;
    await product.save();

    // Audit log for stock change
    await createAuditLog({
      action: 'STOCK_UPDATE', module: 'stock',
      description: `Stock updated for "${product.name}" (${product.sku}): ${previousStock} → ${product.quantity} [${operation || 'set'}${notes ? ` | Note: ${notes}` : ''}]`,
      performedBy: req.user._id, performedByName: req.user.name, performedByRole: req.user.role,
      targetId: product._id, targetModel: 'Product', targetName: product.name,
      changes: {
        before: { quantity: previousStock },
        after: { quantity: product.quantity },
        operation: operation || 'set',
        difference: product.quantity - previousStock,
        notes,
      },
      ipAddress: req.ip, status: 'success',
    });

    const io = req.app.get('io');
    if (io) io.emit('stock:updated', { product, previousStock, newStock: product.quantity });

    res.status(200).json({ success: true, data: product, previousStock, newStock: product.quantity });
  } catch (err) { next(err); }
};

// @desc    Upload product image
// @route   POST /api/products/:id/upload-image
exports.uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) return next(new ErrorResponse('No image file provided', 400));

    const product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorResponse('Product not found', 404));

    const imageUrl = `/uploads/products/${req.file.filename}`;
    const isFirst = !product.images || product.images.length === 0;

    product.images.push({
      url: imageUrl,
      isPrimary: isFirst,
      uploadedAt: new Date(),
    });

    product.updatedBy = req.user.id;
    await product.save();

    const updatedProduct = await Product.findById(product._id)
      .populate('category', 'name color icon')
      .populate('supplier', 'name code');

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (err) {
    next(err);
  }
};

// @desc    Get product stats
// @route   GET /api/products/stats
exports.getProductStats = async (req, res, next) => {
  try {
    const stats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$price.cost'] } },
          totalRevenue: { $sum: { $multiply: ['$quantity', '$price.selling'] } },
          avgPrice: { $avg: '$price.selling' },
          lowStock: { $sum: { $cond: [{ $lte: ['$quantity', '$reorderPoint'] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] } },
        },
      },
    ]);

    res.status(200).json({ success: true, data: stats[0] || {} });
  } catch (err) {
    next(err);
  }
};
