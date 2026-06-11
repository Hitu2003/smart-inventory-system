/**
 * Role-Based Access Control — Permission Matrix
 *
 * Roles: admin > manager > staff > viewer
 *
 * Format: { module: { action: [roles] } }
 */
const PERMISSIONS = {
  // ── Products ──────────────────────────────────────────
  product: {
    view:   ['admin', 'manager', 'staff', 'viewer'],
    create: ['admin', 'manager'],
    update: ['admin', 'manager'],
    delete: ['admin'],
    updateStock: ['admin', 'manager', 'staff'],
    export: ['admin', 'manager'],
  },

  // ── Categories ────────────────────────────────────────
  category: {
    view:   ['admin', 'manager', 'staff', 'viewer'],
    create: ['admin', 'manager'],
    update: ['admin', 'manager'],
    delete: ['admin'],
  },

  // ── Suppliers ─────────────────────────────────────────
  supplier: {
    view:   ['admin', 'manager', 'staff', 'viewer'],
    create: ['admin', 'manager'],
    update: ['admin', 'manager'],
    delete: ['admin'],
  },

  // ── Customers ─────────────────────────────────────────
  customer: {
    view:   ['admin', 'manager', 'staff', 'viewer'],
    create: ['admin', 'manager', 'staff'],
    update: ['admin', 'manager', 'staff'],
    delete: ['admin', 'manager'],
  },

  // ── Transactions ──────────────────────────────────────
  transaction: {
    view:   ['admin', 'manager', 'staff', 'viewer'],
    create: ['admin', 'manager', 'staff'],
    update: ['admin', 'manager'],
    delete: ['admin'],
    approve: ['admin', 'manager'],
  },

  // ── Reports ───────────────────────────────────────────
  report: {
    view:   ['admin', 'manager'],
    export: ['admin', 'manager'],
  },

  // ── Users ─────────────────────────────────────────────
  user: {
    view:   ['admin'],
    create: ['admin'],
    update: ['admin'],
    delete: ['admin'],
  },

  // ── Dashboard ─────────────────────────────────────────
  dashboard: {
    view:       ['admin', 'manager', 'staff', 'viewer'],
    viewStats:  ['admin', 'manager'],
    viewCharts: ['admin', 'manager'],
  },

  // ── Audit Logs ────────────────────────────────────────
  auditLog: {
    view: ['admin'],
  },
};

/**
 * Check if a role has permission for a module+action
 */
const hasPermission = (role, module, action) => {
  const modulePerms = PERMISSIONS[module];
  if (!modulePerms) return false;
  const allowedRoles = modulePerms[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
};

/**
 * Express middleware — checks permission and returns 403 if denied
 */
const checkPermission = (module, action) => {
  return async (req, res, next) => {
    const role = req.user?.role;
    if (!role) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!hasPermission(role, module, action)) {
      // Log the denied attempt
      const { createAuditLog } = require('../utils/auditLogger');
      await createAuditLog({
        action: 'PERMISSION_DENIED',
        module,
        description: `${role} attempted ${action} on ${module} — DENIED`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        performedByRole: role,
        ipAddress: req.ip,
        status: 'failed',
      });
      return res.status(403).json({
        success: false,
        message: `Your role (${role}) does not have permission to ${action} ${module}`,
        requiredRoles: PERMISSIONS[module]?.[action] || [],
      });
    }
    next();
  };
};

/**
 * Get all permissions for a role (for frontend use)
 */
const getRolePermissions = (role) => {
  const result = {};
  for (const [module, actions] of Object.entries(PERMISSIONS)) {
    result[module] = {};
    for (const [action, roles] of Object.entries(actions)) {
      result[module][action] = roles.includes(role);
    }
  }
  return result;
};

module.exports = { PERMISSIONS, hasPermission, checkPermission, getRolePermissions };
