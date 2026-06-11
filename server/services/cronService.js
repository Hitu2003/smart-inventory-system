const cron = require('node-cron');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const { sendEmail, lowStockEmailHTML } = require('../utils/sendEmail');
const User = require('../models/User');
const logger = require('../utils/logger');

// Run every day at 8 AM - check low stock
const startCronJobs = () => {
  cron.schedule('0 8 * * *', async () => {
    try {
      logger.info('Running daily low stock check...');

      const lowStockItems = await Product.find({
        isActive: true,
        $expr: { $lte: ['$quantity', '$reorderPoint'] },
      }).populate('category', 'name');

      if (lowStockItems.length > 0) {
        // Create notifications
        for (const item of lowStockItems) {
          const existing = await Notification.findOne({
            relatedProduct: item._id,
            type: item.quantity === 0 ? 'out_of_stock' : 'low_stock',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          });

          if (!existing) {
            await Notification.create({
              title: item.quantity === 0 ? 'Out of Stock' : 'Low Stock Alert',
              message: `${item.name} (${item.sku}) - Current stock: ${item.quantity}`,
              type: item.quantity === 0 ? 'out_of_stock' : 'low_stock',
              priority: item.quantity === 0 ? 'critical' : 'high',
              relatedProduct: item._id,
            });
          }
        }

        // Email admins and managers
        const admins = await User.find({
          role: { $in: ['admin', 'manager'] },
          isActive: true,
          'preferences.notifications.lowStock': true,
        });

        for (const admin of admins) {
          await sendEmail({
            email: admin.email,
            subject: `⚠️ Low Stock Alert - ${lowStockItems.length} items need attention`,
            html: lowStockEmailHTML(lowStockItems),
          }).catch((err) => logger.error(`Failed to send email to ${admin.email}: ${err.message}`));
        }

        logger.info(`Low stock check complete. ${lowStockItems.length} items flagged.`);
      }
    } catch (err) {
      logger.error(`Cron job error: ${err.message}`);
    }
  });

  logger.info('Cron jobs started');
};

module.exports = startCronJobs;
