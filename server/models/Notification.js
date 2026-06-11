const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['low_stock', 'out_of_stock', 'new_transaction', 'system', 'alert', 'info'], default: 'info' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    isRead: { type: Boolean, default: false },
    readBy: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, readAt: Date }],
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    relatedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    relatedTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    actionUrl: String,
    expiresAt: Date,
  },
  { timestamps: true }
);

NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ isRead: 1, targetUsers: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
