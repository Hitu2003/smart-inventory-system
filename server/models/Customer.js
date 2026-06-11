const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    customerId: { type: String, unique: true },
    fullName: { type: String, required: [true, 'Full name is required'], trim: true, maxlength: 100 },
    phone: { type: String, required: [true, 'Phone number is required'], trim: true },
    phone2: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, required: [true, 'Address is required'] },
    address2: { type: String },
    city: { type: String },
    state: { type: String },
    district: { type: String },
    pincode: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    notes: { type: String },
    totalPurchases: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Auto-generate customer ID
CustomerSchema.pre('save', async function (next) {
  if (!this.customerId) {
    const count = await mongoose.model('Customer').countDocuments();
    this.customerId = `CUST-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual: transactions
CustomerSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'customerId',
});

module.exports = mongoose.model('Customer', CustomerSchema);
