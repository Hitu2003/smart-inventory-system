const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 100 },
    sku: { type: String, required: [true, 'SKU is required'], unique: true, uppercase: true, trim: true },
    barcode: { type: String, unique: true, sparse: true },
    description: { type: String, maxlength: 1000 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
    images: [{ url: String, publicId: String, isPrimary: { type: Boolean, default: false } }],
    price: {
      cost: { type: Number, required: true, min: 0 },
      selling: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'USD' },
    },
    quantity: { type: Number, required: true, min: [0, 'Quantity cannot be negative'], default: 0 },
    unit: { type: String, enum: ['piece', 'kg', 'liter', 'meter', 'box', 'pack', 'dozen', 'set'], default: 'piece' },
    reorderPoint: { type: Number, default: 10, min: 0 },
    reorderQuantity: { type: Number, default: 50, min: 0 },
    maxStock: { type: Number, default: 1000 },
    location: { warehouse: String, aisle: String, shelf: String, bin: String },
    tags: [String],
    weight: { value: Number, unit: { type: String, enum: ['kg', 'g', 'lb', 'oz'], default: 'kg' } },
    dimensions: { length: Number, width: Number, height: Number, unit: { type: String, default: 'cm' } },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    expiryDate: Date,
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ProductSchema.index({ name: 'text', sku: 'text', description: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ quantity: 1, reorderPoint: 1 });

ProductSchema.virtual('stockStatus').get(function () {
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= this.reorderPoint) return 'low_stock';
  if (this.quantity >= this.maxStock) return 'overstock';
  return 'in_stock';
});

ProductSchema.virtual('profitMargin').get(function () {
  if (!this.price?.cost || !this.price?.selling) return 0;
  return (((this.price.selling - this.price.cost) / this.price.selling) * 100).toFixed(2);
});

ProductSchema.virtual('totalValue').get(function () {
  return (this.quantity * (this.price?.cost || 0)).toFixed(2);
});

module.exports = mongoose.model('Product', ProductSchema);
