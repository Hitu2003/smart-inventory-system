const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find()
      .sort('-createdAt')
      .limit(50)
      .populate('relatedProduct', 'name sku');
    const unreadCount = await Notification.countDocuments({ isRead: false });
    res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (err) { next(err); }
};

exports.markAsRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      isRead: true,
      $push: { readBy: { user: req.user.id, readAt: Date.now() } },
    });
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) { next(err); }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (err) { next(err); }
};
