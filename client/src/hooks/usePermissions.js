import { useSelector } from 'react-redux';

/**
 * Permission matrix — mirrors server/config/permissions.js
 */
const PERMISSIONS = {
  product:     { view: ['admin','manager','staff','viewer'], create: ['admin','manager'], update: ['admin','manager'], delete: ['admin'], updateStock: ['admin','manager','staff'], export: ['admin','manager'] },
  category:    { view: ['admin','manager','staff','viewer'], create: ['admin','manager'], update: ['admin','manager'], delete: ['admin'] },
  supplier:    { view: ['admin','manager','staff','viewer'], create: ['admin','manager'], update: ['admin','manager'], delete: ['admin'] },
  customer:    { view: ['admin','manager','staff','viewer'], create: ['admin','manager','staff'], update: ['admin','manager','staff'], delete: ['admin','manager'] },
  transaction: { view: ['admin','manager','staff','viewer'], create: ['admin','manager','staff'], update: ['admin','manager'], delete: ['admin'], approve: ['admin','manager'] },
  report:      { view: ['admin','manager'], export: ['admin','manager'] },
  user:        { view: ['admin'], create: ['admin'], update: ['admin'], delete: ['admin'] },
  dashboard:   { view: ['admin','manager','staff','viewer'], viewStats: ['admin','manager'], viewCharts: ['admin','manager'] },
  auditLog:    { view: ['admin'] },
};

/**
 * Hook — returns permission checker for current user
 *
 * Usage:
 *   const { can, role, isAdmin, isManager } = usePermissions();
 *   if (can('product', 'create')) { ... }
 */
const usePermissions = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role || 'viewer';

  const can = (module, action) => {
    const allowed = PERMISSIONS[module]?.[action];
    if (!allowed) return false;
    return allowed.includes(role);
  };

  const canAny = (module, actions) => actions.some((a) => can(module, a));

  return {
    can,
    canAny,
    role,
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isStaff: role === 'staff',
    isViewer: role === 'viewer',
    isAdminOrManager: ['admin', 'manager'].includes(role),
    permissions: PERMISSIONS,
  };
};

export default usePermissions;
