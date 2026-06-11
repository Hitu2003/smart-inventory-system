const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Supplier name is required'], trim: true, maxlength: 100 },
    code: { type: String, unique: true, uppercase: true, trim: true },
    contactPerson: { name: String, email: String, phone: String, designation: String },
    email: { type: String, lowercase: true },
    phone: String,
    website: String,
    address: { street: String, city: String, state: String, country: String, zipCode: String },
    taxId: String,
    paymentTerms: { type: String, enum: ['net15', 'net30', 'net45', 'net60', 'cod', 'prepaid'], default: 'net30' },
    currency: { type: String, default: 'USD' },
    rating: { type: Number, min: 1, max: 5, default: 3 },
    isActive: { type: Boolean, default: true },
    notes: String,
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

SupplierSchema.pre('save', async function (next) {
  if (!this.code) {
    const count = await mongoose.model('Supplier').countDocuments();
    this.code = `SUP-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

SupplierSchema.virtual('productCount', {
  ref: 'Product', localField: '_id', foreignField: 'supplier', count: true,
});

module.exports = mongoose.model('Supplier', SupplierSchema);
