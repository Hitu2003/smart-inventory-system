const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Inventory valuation report
// @route   GET /api/reports/inventory
exports.getInventoryReport = async (req, res, next) => {
  try {
    const report = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData',
        },
      },
      {
        $addFields: {
          categoryInfo: { $arrayElemAt: ['$categoryData', 0] },
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] },
          color: { $first: { $ifNull: ['$categoryInfo.color', '#94a3b8'] } },
          products: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalCostValue: {
            $sum: { $multiply: ['$quantity', { $ifNull: ['$price.cost', 0] }] },
          },
          totalRetailValue: {
            $sum: { $multiply: ['$quantity', { $ifNull: ['$price.selling', 0] }] },
          },
          lowStockItems: {
            $sum: {
              $cond: [
                { $and: [{ $lte: ['$quantity', '$reorderPoint'] }, { $gt: ['$quantity', 0] }] },
                1,
                0,
              ],
            },
          },
          outOfStockItems: {
            $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] },
          },
        },
      },
      { $sort: { totalCostValue: -1 } },
    ]);

    const totals = report.reduce(
      (acc, cat) => ({
        products: acc.products + (cat.products || 0),
        totalCostValue: acc.totalCostValue + (cat.totalCostValue || 0),
        totalRetailValue: acc.totalRetailValue + (cat.totalRetailValue || 0),
        lowStockItems: acc.lowStockItems + (cat.lowStockItems || 0),
        outOfStockItems: acc.outOfStockItems + (cat.outOfStockItems || 0),
      }),
      { products: 0, totalCostValue: 0, totalRetailValue: 0, lowStockItems: 0, outOfStockItems: 0 }
    );

    res.status(200).json({ success: true, data: { categories: report, totals } });
  } catch (err) {
    next(err);
  }
};

// @desc    Sales report
// @route   GET /api/reports/sales
exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const matchStage = { type: 'sale', status: 'completed' };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const dateFormat =
      groupBy === 'month' ? '%Y-%m' : groupBy === 'year' ? '%Y' : '%Y-%m-%d';

    const salesData = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          revenue: { $sum: { $ifNull: ['$netAmount', 0] } },
          count: { $sum: 1 },
          avgOrderValue: { $avg: { $ifNull: ['$netAmount', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const summary = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$netAmount', 0] } },
          totalTransactions: { $sum: 1 },
          avgOrderValue: { $avg: { $ifNull: ['$netAmount', 0] } },
          maxOrder: { $max: { $ifNull: ['$netAmount', 0] } },
          minOrder: { $min: { $ifNull: ['$netAmount', 0] } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: { salesData, summary: summary[0] || {} },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Stock movement report
// @route   GET /api/reports/stock-movement
exports.getStockMovementReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = { status: 'completed' };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const movements = await Transaction.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: { product: '$items.product', type: '$type' },
          totalQuantity: { $sum: { $ifNull: ['$items.quantity', 0] } },
          totalValue: { $sum: { $ifNull: ['$items.totalPrice', 0] } },
          transactions: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmpty: true } },
      {
        $project: {
          productName: { $ifNull: ['$product.name', 'Unknown'] },
          sku: { $ifNull: ['$product.sku', '-'] },
          type: '$_id.type',
          totalQuantity: 1,
          totalValue: 1,
          transactions: 1,
        },
      },
      { $sort: { totalValue: -1 } },
      { $limit: 50 },
    ]);

    res.status(200).json({ success: true, data: movements });
  } catch (err) {
    next(err);
  }
};
