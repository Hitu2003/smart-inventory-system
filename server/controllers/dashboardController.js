const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Supplier = require('../models/Supplier');
const Category = require('../models/Category');
const User = require('../models/User');

// @desc    Get dashboard overview stats
// @route   GET /api/dashboard/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProducts, totalSuppliers, totalCategories, totalUsers,
      lowStockProducts, outOfStockProducts, recentTransactions,
      productStats, salesByMonth, topProducts, categoryDistribution,
      stockDistribution,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Supplier.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, $expr: { $and: [{ $lte: ['$quantity', '$reorderPoint'] }, { $gt: ['$quantity', 0] }] } }),
      Product.countDocuments({ isActive: true, quantity: 0 }),
      Transaction.find({ status: 'completed' }).sort('-createdAt').limit(10).populate('items.product', 'name sku').populate('createdBy', 'name'),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalInventoryValue: { $sum: { $multiply: ['$quantity', '$price.cost'] } }, totalRetailValue: { $sum: { $multiply: ['$quantity', '$price.selling'] } }, avgMargin: { $avg: { $subtract: ['$price.selling', '$price.cost'] } } } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'sale', status: 'completed', createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$netAmount' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'sale', status: 'completed' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.totalPrice' } } },
        { $sort: { revenue: -1 } }, { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { name: '$product.name', sku: '$product.sku', totalSold: 1, revenue: 1 } },
      ]),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 }, value: { $sum: { $multiply: ['$quantity', '$price.cost'] } } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $project: { name: '$category.name', color: '$category.color', count: 1, value: 1 } },
      ]),
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            inStock: { $sum: { $cond: [{ $and: [{ $gt: ['$quantity', '$reorderPoint'] }] }, 1, 0] } },
            lowStock: { $sum: { $cond: [{ $and: [{ $lte: ['$quantity', '$reorderPoint'] }, { $gt: ['$quantity', 0] }] }, 1, 0] } },
            outOfStock: { $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] } },
            overstock: { $sum: { $cond: [{ $gt: ['$quantity', { $multiply: ['$reorderPoint', 3] }] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const stats = productStats[0] || {};
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalProducts, totalSuppliers, totalCategories, totalUsers,
          lowStockProducts, outOfStockProducts,
          totalInventoryValue: stats.totalInventoryValue || 0,
          totalRetailValue: stats.totalRetailValue || 0,
          avgMargin: stats.avgMargin || 0,
        },
        recentTransactions, salesByMonth, topProducts, categoryDistribution,
        stockDistribution: stockDistribution[0] || { inStock: 0, lowStock: 0, outOfStock: 0, overstock: 0 },
      },
    });
  } catch (err) { next(err); }
};

// @desc    Get sales analytics for chart
// @route   GET /api/dashboard/analytics
exports.getSalesAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [salesData, purchaseData, transactionTypes, monthlySales, monthlyPurchases] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'sale', status: 'completed', createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$netAmount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Transaction.aggregate([
        { $match: { type: 'purchase', status: 'completed', createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, cost: { $sum: '$netAmount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$type', count: { $sum: 1 }, amount: { $sum: '$netAmount' } } },
      ]),
      // Monthly sales for last 12 months
      Transaction.aggregate([
        { $match: { type: 'sale', status: 'completed', createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$netAmount' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      // Monthly purchases for last 12 months
      Transaction.aggregate([
        { $match: { type: 'purchase', status: 'completed', createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, cost: { $sum: '$netAmount' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    // If no data, generate empty date labels so chart renders properly
    let finalSalesData = salesData;
    if (salesData.length === 0) {
      const labels = [];
      for (let i = days - 1; i >= 0; i -= Math.ceil(days / 10)) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        labels.push({ _id: d.toISOString().split('T')[0], revenue: 0, count: 0 });
      }
      finalSalesData = labels;
    }

    res.status(200).json({ success: true, data: { salesData: finalSalesData, purchaseData, transactionTypes, monthlySales, monthlyPurchases } });
  } catch (err) { next(err); }
};
