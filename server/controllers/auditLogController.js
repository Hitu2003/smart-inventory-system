const AuditLog = require('../models/AuditLog');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all audit logs (admin only)
// @route   GET /api/audit-logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 25, module, action,
      userId, startDate, endDate, status, search,
    } = req.query;

    const filter = {};
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (userId) filter.performedBy = userId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { performedByName: { $regex: search, $options: 'i' } },
        { targetName: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'name email role avatar')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: logs,
    });
  } catch (err) { next(err); }
};

// @desc    Get audit log stats
// @route   GET /api/audit-logs/stats
exports.getAuditStats = async (req, res, next) => {
  try {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalLogs, recentLogs, byModule, byAction, byUser, failedAttempts] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ createdAt: { $gte: last30Days } }),
      AuditLog.aggregate([
        { $group: { _id: '$module', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: last30Days } } },
        { $group: { _id: '$performedBy', name: { $first: '$performedByName' }, role: { $first: '$performedByRole' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      AuditLog.countDocuments({ status: 'failed', createdAt: { $gte: last30Days } }),
    ]);

    res.status(200).json({
      success: true,
      data: { totalLogs, recentLogs, byModule, byAction, byUser, failedAttempts },
    });
  } catch (err) { next(err); }
};

// @desc    Get single audit log
// @route   GET /api/audit-logs/:id
exports.getAuditLog = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('performedBy', 'name email role');
    if (!log) return next(new ErrorResponse('Audit log not found', 404));
    res.status(200).json({ success: true, data: log });
  } catch (err) { next(err); }
};

// @desc    Delete old audit logs (admin only)
// @route   DELETE /api/audit-logs/cleanup
exports.cleanupAuditLogs = async (req, res, next) => {
  try {
    const { olderThanDays = 90 } = req.body;
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const result = await AuditLog.deleteMany({ createdAt: { $lt: cutoffDate } });
    res.status(200).json({ success: true, message: `Deleted ${result.deletedCount} old audit logs` });
  } catch (err) { next(err); }
};
