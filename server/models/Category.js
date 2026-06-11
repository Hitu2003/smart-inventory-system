const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], unique: true, trim: true, maxlength: 50 },
    slug: { type: String, unique: true },
    description: { type: String, maxlength: 200 },
    icon: { type: String, default: 'box' },
    color: { type: String, default: '#4A90E2' },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

CategorySchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      + '-' + Date.now();
  }
  next();
});

CategorySchema.virtual('productCount', {
  ref: 'Product', localField: '_id', foreignField: 'category', count: true,
});

module.exports = mongoose.model('Category', CategorySchema);
