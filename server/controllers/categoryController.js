const Category = require('../models/Category');
const ErrorResponse = require('../utils/errorResponse');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('productCount')
      .populate('parent', 'name')
      .sort('name');
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (err) { next(err); }
};

exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).populate('productCount').populate('parent', 'name');
    if (!category) return next(new ErrorResponse('Category not found', 404));
    res.status(200).json({ success: true, data: category });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return next(new ErrorResponse('Category not found', 404));
    res.status(200).json({ success: true, data: category });
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!category) return next(new ErrorResponse('Category not found', 404));
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
};
