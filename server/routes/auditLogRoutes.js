const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getAuditLogs, getAuditStats, getAuditLog, cleanupAuditLogs } = require('../controllers/auditLogController');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAuditStats);
router.get('/', getAuditLogs);
router.get('/:id', getAuditLog);
router.delete('/cleanup', cleanupAuditLogs);

module.exports = router;
