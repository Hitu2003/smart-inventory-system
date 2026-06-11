const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const APIFeatures = require('../utils/apiFeatures');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all customers
// @route   GET /api/customers
exports.getCustomers = async (req, res, next) => {
  try {
    const total = await Customer.countDocuments();
    const features = new APIFeatures(
      Customer.find().populate('createdBy', 'name'),
      req.query
    ).search(['fullName', 'phone', 'email', 'customerId']).filter().sort().paginate();

    const customers = await features.query;
    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page: features.page,
      pages: Math.ceil(total / (features.limit || 20)),
      data: customers,
    });
  } catch (err) { next(err); }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).populate('createdBy', 'name');
    if (!customer) return next(new ErrorResponse('Customer not found', 404));

    // Get customer transactions
    const transactions = await Transaction.find({
      'customer.phone': customer.phone,
      type: 'sale',
    }).sort('-createdAt').limit(10).select('transactionNumber netAmount status createdAt items');

    res.status(200).json({ success: true, data: customer, transactions });
  } catch (err) { next(err); }
};

// @desc    Create customer
// @route   POST /api/customers
exports.createCustomer = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err) { next(err); }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!customer) return next(new ErrorResponse('Customer not found', 404));
    res.status(200).json({ success: true, data: customer });
  } catch (err) { next(err); }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id, { status: 'inactive' }, { new: true }
    );
    if (!customer) return next(new ErrorResponse('Customer not found', 404));
    res.status(200).json({ success: true, message: 'Customer deactivated' });
  } catch (err) { next(err); }
};

// @desc    Get customer stats
// @route   GET /api/customers/stats
exports.getCustomerStats = async (req, res, next) => {
  try {
    const total = await Customer.countDocuments();
    const active = await Customer.countDocuments({ status: 'active' });
    const topCustomers = await Customer.find({ status: 'active' })
      .sort('-totalSpent').limit(5).select('fullName phone customerId totalSpent totalPurchases');
    res.status(200).json({ success: true, data: { total, active, inactive: total - active, topCustomers } });
  } catch (err) { next(err); }
};
