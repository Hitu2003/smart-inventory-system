const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    createdAt: { type: Date, default: Date.now },
    transactionNumber: { type: String, unique: true },
    type: {
      type: String,
      enum: ['purchase', 'sale', 'adjustment', 'transfer', 'return', 'damage', 'expired'],
      required: [true, 'Transaction type is required'],
    },
    status: { type: String, enum: ['pending', 'completed', 'cancelled', 'partial'], default: 'pending' },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true },
        previousStock: Number,
        newStock: Number,
        notes: String,
      },
    ],
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    customer: {
      name: String,
      email: String,
      phone: String,
      address: String,
    },
    reference: { type: String, trim: true },
    totalAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'bank_transfer', 'check', 'online'], default: 'cash' },
    paymentStatus: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'unpaid' },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: Date,
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

TransactionSchema.pre('save', async function (next) {
  if (!this.transactionNumber) {
    const count = await mongoose.model('Transaction').countDocuments();
    const prefix = this.type.substring(0, 3).toUpperCase();
    this.transactionNumber = `${prefix}-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  if (this.items?.length > 0) {
    this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    this.netAmount = this.totalAmount - (this.discount || 0) + (this.tax || 0);
  }
  next();
});

TransactionSchema.index({ type: 1, status: 1, createdAt: -1 });
TransactionSchema.index({ 'items.product': 1 });
TransactionSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
