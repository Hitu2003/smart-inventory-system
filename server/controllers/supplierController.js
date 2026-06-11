const Supplier = require('../models/Supplier');
const APIFeatures = require('../utils/apiFeatures');
const ErrorResponse = require('../utils/errorResponse');

exports.getSuppliers = async (req, res, next) => {
  try {
    const total = await Supplier.countDocuments({ isActive: true });
    const features = new APIFeatures(
      Supplier.find({ isActive: true }).populate('productCount').populate('categories', 'name'),
      req.query
    ).search(['name', 'code', 'email']).filter().sort().paginate();

    const suppliers = await features.query;
    res.status(200).json({ success: true, count: suppliers.length, total, data: suppliers });
  } catch (err) { next(err); }
};

exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id).populate('productCount').populate('categories', 'name color');
    if (!supplier) return next(new ErrorResponse('Supplier not found', 404));
    res.status(200).json({ success: true, data: supplier });
  } catch (err) { next(err); }
};

exports.createSupplier = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (err) { next(err); }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return next(new ErrorResponse('Supplier not found', 404));
    res.status(200).json({ success: true, data: supplier });
  } catch (err) { next(err); }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!supplier) return next(new ErrorResponse('Supplier not found', 404));
    res.status(200).json({ success: true, message: 'Supplier deleted' });
  } catch (err) { next(err); }
};
