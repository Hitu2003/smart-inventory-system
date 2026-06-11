const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT',
        'STOCK_UPDATE', 'TRANSACTION_CREATE', 'TRANSACTION_DELETE',
        'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
        'CATEGORY_CREATE', 'CATEGORY_UPDATE', 'CATEGORY_DELETE',
        'SUPPLIER_CREATE', 'SUPPLIER_UPDATE', 'SUPPLIER_DELETE',
        'CUSTOMER_CREATE', 'CUSTOMER_UPDATE', 'CUSTOMER_DELETE',
        'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE',
        'REPORT_EXPORT', 'PASSWORD_CHANGE', 'PERMISSION_DENIED',
      ],
    },
    module: {
      type: String,
      enum: ['auth', 'product', 'category', 'supplier', 'transaction', 'user', 'customer', 'report', 'stock'],
      required: true,
    },
    description: { type: String, required: true },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByName: { type: String },
    performedByRole: { type: String },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetModel: { type: String },
    targetName: { type: String },
    changes: {
      before: { type: mongoose.Schema.Types.Mixed },
      after: { type: mongoose.Schema.Types.Mixed },
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    status: { type: String, enum: ['success', 'failed', 'warning'], default: 'success' },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

AuditLogSchema.index({ performedBy: 1, createdAt: -1 });
AuditLogSchema.index({ module: 1, action: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
