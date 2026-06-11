const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) { next(err); }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorResponse('User not found', 404));
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { password, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!user) return next(new ErrorResponse('User not found', 404));
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return next(new ErrorResponse('Cannot delete your own account', 400));
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return next(new ErrorResponse('User not found', 404));
    res.status(200).json({ success: true, message: 'User deactivated' });
  } catch (err) { next(err); }
};
