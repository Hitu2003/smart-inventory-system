const AuditLog = require('../models/AuditLog');
const logger = require('./logger');

/**
 * Create an audit log entry
 */
const createAuditLog = async ({
  action, module, description,
  performedBy, performedByName, performedByRole,
  targetId, targetModel, targetName,
  changes, ipAddress, userAgent,
  status = 'success', metadata,
}) => {
  try {
    await AuditLog.create({
      action, module, description,
      performedBy, performedByName, performedByRole,
      targetId, targetModel, targetName,
      changes, ipAddress, userAgent,
      status, metadata,
    });
  } catch (err) {
    // Never let audit logging break the main flow
    logger.error(`Audit log failed: ${err.message}`);
  }
};

/**
 * Middleware factory — auto-logs after a successful request
 */
const auditMiddleware = (action, module, getDescription) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (body?.success && req.user) {
        try {
          const description = typeof getDescription === 'function'
            ? getDescription(req, body)
            : getDescription;

          await createAuditLog({
            action,
            module,
            description,
            performedBy: req.user._id,
            performedByName: req.user.name,
            performedByRole: req.user.role,
            targetId: body.data?._id || req.params?.id,
            targetModel: module,
            targetName: body.data?.name || body.data?.fullName || body.data?.transactionNumber,
            ipAddress: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent'],
            status: 'success',
          });
        } catch (e) {
          logger.error(`Audit middleware error: ${e.message}`);
        }
      }
      return originalJson(body);
    };
    next();
  };
};

module.exports = { createAuditLog, auditMiddleware };
