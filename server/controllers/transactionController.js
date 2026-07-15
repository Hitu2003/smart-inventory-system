const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const User = require('../models/User');
const APIFeatures = require('../utils/apiFeatures');
const ErrorResponse = require('../utils/errorResponse');
const {
  sendEmail, invoiceEmailHTML, paymentConfirmationEmailHTML,
  paymentReminderEmailHTML, newPurchaseEmailHTML,
} = require('../utils/sendEmail');
const { sendWhatsApp, messages: waMessages } = require('../services/whatsappService');
const logger = require('../utils/logger');

// ── Helper: send email silently (never breaks main flow) ──────────────────
const silentEmail = async (opts) => {
  try { await sendEmail(opts); }
  catch (err) { logger.warn(`Email notification skipped: ${err.message}`); }
};

// ── Helper: get admin emails ──────────────────────────────────────────────
const getAdminEmails = async () => {
  const admins = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true }).select('email');
  return admins.map((a) => a.email).filter(Boolean);
};

// @desc    Get all transactions
// @route   GET /api/transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

    const total = await Transaction.countDocuments(filter);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;

    const transactions = await Transaction.find(filter)
      .populate('items.product', 'name sku images')
      .populate('supplier', 'name code email')
      .populate('createdBy', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: transactions,
    });
  } catch (err) { next(err); }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('items.product', 'name sku images price')
      .populate('supplier', 'name code email phone address')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');
    if (!transaction) return next(new ErrorResponse('Transaction not found', 404));
    res.status(200).json({ success: true, data: transaction });
  } catch (err) { next(err); }
};

// @desc    Create transaction — auto sends bill/invoice email
// @route   POST /api/transactions
exports.createTransaction = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;

    // Clean up empty string fields that cause ObjectId cast errors
    if (!req.body.supplier || req.body.supplier === '') delete req.body.supplier;
    if (!req.body.customer?.name && !req.body.customer?.email && !req.body.customer?.phone) delete req.body.customer;

    // ── Validate stock & build item details ──────────────────────────────
    const stockUpdates = [];
    for (const item of req.body.items) {
      const product = await Product.findById(item.product);
      if (!product) return next(new ErrorResponse(`Product ${item.product} not found`, 404));

      item.unitPrice = item.unitPrice || (req.body.type === 'sale' ? product.price.selling : product.price.cost);
      item.totalPrice = item.quantity * item.unitPrice;
      item.previousStock = product.quantity;

      if (req.body.type === 'sale') {
        if (product.quantity < item.quantity) {
          return next(new ErrorResponse(`Insufficient stock for "${product.name}". Available: ${product.quantity}`, 400));
        }
        item.newStock = product.quantity - item.quantity;
      } else if (req.body.type === 'purchase') {
        item.newStock = product.quantity + item.quantity;
      } else {
        item.newStock = item.quantity;
      }
      stockUpdates.push({ product, newStock: item.newStock });
    }

    const transaction = await Transaction.create(req.body);

    // ── Update stock levels ──────────────────────────────────────────────
    for (const { product, newStock } of stockUpdates) {
      product.quantity = newStock;
      product.updatedBy = req.user.id;
      await product.save();

      if (product.quantity <= product.reorderPoint) {
        await Notification.create({
          title: product.quantity === 0 ? 'Out of Stock' : 'Low Stock Alert',
          message: `${product.name} (${product.sku}) stock is now ${product.quantity}`,
          type: product.quantity === 0 ? 'out_of_stock' : 'low_stock',
          priority: product.quantity === 0 ? 'critical' : 'high',
          relatedProduct: product._id,
        });
      }
    }

    if (req.body.status === 'completed') {
      transaction.completedAt = Date.now();
      await transaction.save();
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) io.emit('transaction:created', transaction);

    // ── Populate for email ───────────────────────────────────────────────
    const populated = await Transaction.findById(transaction._id)
      .populate('items.product', 'name sku')
      .populate('supplier', 'name code email phone')
      .populate('createdBy', 'name email');

    // ── AUTO-SEND EMAILS & WHATSAPP ─────────────────────────────────────
    if (populated.type === 'sale') {
      const customerEmail = req.body.customer?.email;
      const customerPhone = req.body.customer?.phone;

      // Email invoice to customer
      if (customerEmail) {
        await silentEmail({
          email: customerEmail,
          subject: `🧾 Invoice #${populated.transactionNumber} — ${populated.paymentStatus === 'paid' ? 'Payment Received' : 'Payment Due'}`,
          html: invoiceEmailHTML(populated),
        });
      }

      // WhatsApp to customer
      if (customerPhone) {
        await sendWhatsApp(customerPhone, waMessages.orderConfirmation(populated));
      }

      // Notify admin about new sale
      const adminEmails = await getAdminEmails();
      for (const adminEmail of adminEmails) {
        await silentEmail({
          email: adminEmail,
          subject: `💰 New Sale #${populated.transactionNumber} — ${populated.customer?.name || 'Customer'}`,
          html: invoiceEmailHTML(populated),
        });
      }

      // Create in-app notification
      await Notification.create({
        title: 'New Sale Created',
        message: `Sale #${populated.transactionNumber} for ₹${populated.netAmount?.toFixed(2)}`,
        type: 'new_transaction',
        priority: 'medium',
        relatedTransaction: populated._id,
      });

    } else if (populated.type === 'purchase') {
      // Send purchase order to admins
      const adminEmails = await getAdminEmails();
      for (const adminEmail of adminEmails) {
        await silentEmail({
          email: adminEmail,
          subject: `🛒 Purchase Order #${populated.transactionNumber} — ${populated.supplier?.name || 'Supplier'}`,
          html: newPurchaseEmailHTML(populated),
        });
      }

      await Notification.create({
        title: 'New Purchase Order',
        message: `Purchase #${populated.transactionNumber} for ₹${populated.netAmount?.toFixed(2)}`,
        type: 'new_transaction',
        priority: 'low',
        relatedTransaction: populated._id,
      });
    }

    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
};

// @desc    Update transaction status
// @route   PATCH /api/transactions/:id/status
exports.updateTransactionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id)
      .populate('items.product', 'name sku')
      .populate('supplier', 'name');

    if (!transaction) return next(new ErrorResponse('Transaction not found', 404));

    transaction.status = status;
    if (status === 'completed') {
      transaction.completedAt = Date.now();
      transaction.approvedBy = req.user.id;
    }
    await transaction.save();

    res.status(200).json({ success: true, data: transaction });
  } catch (err) { next(err); }
};

// @desc    Update payment status — auto sends confirmation or reminder email
// @route   PATCH /api/transactions/:id/payment-status
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;
    if (!['paid', 'unpaid', 'partial'].includes(paymentStatus)) {
      return next(new ErrorResponse('Invalid payment status. Use: paid, unpaid, partial', 400));
    }

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    ).populate('items.product', 'name sku')
      .populate('supplier', 'name email')
      .populate('createdBy', 'name email');

    if (!transaction) return next(new ErrorResponse('Transaction not found', 404));

    // ── Send appropriate email based on new status ────────────────────
    const customerEmail = transaction.customer?.email;
    if (customerEmail) {
      if (paymentStatus === 'paid') {
        // Payment confirmed email
        await silentEmail({
          email: customerEmail,
          subject: `✅ Payment Confirmed — Invoice #${transaction.transactionNumber}`,
          html: paymentConfirmationEmailHTML(transaction),
        });
      } else if (paymentStatus === 'unpaid') {
        // Payment reminder email
        await silentEmail({
          email: customerEmail,
          subject: `⏰ Payment Reminder — Invoice #${transaction.transactionNumber}`,
          html: paymentReminderEmailHTML(transaction, 0),
        });
      } else if (paymentStatus === 'partial') {
        // Updated invoice showing partial status
        await silentEmail({
          email: customerEmail,
          subject: `💰 Partial Payment Received — Invoice #${transaction.transactionNumber}`,
          html: invoiceEmailHTML({ ...transaction.toObject(), paymentStatus: 'partial' }),
        });
      }
    }

    const io = req.app.get('io');
    if (io) io.emit('transaction:paymentUpdated', { id: transaction._id, paymentStatus });

    res.status(200).json({
      success: true,
      data: transaction,
      message: `Payment marked as ${paymentStatus}${customerEmail ? ` — email sent to ${customerEmail}` : ''}`,
    });
  } catch (err) { next(err); }
};

// @desc    Resend invoice email manually
// @route   POST /api/transactions/:id/resend-invoice
exports.resendInvoice = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('items.product', 'name sku')
      .populate('supplier', 'name email');

    if (!transaction) return next(new ErrorResponse('Transaction not found', 404));

    const { email } = req.body;
    const targetEmail = email || transaction.customer?.email;

    if (!targetEmail) {
      return next(new ErrorResponse('No customer email found. Please enter an email address.', 400));
    }

    // Check if SMTP is configured
    const smtpConfigured = process.env.SMTP_EMAIL && process.env.SMTP_EMAIL !== 'your_email@gmail.com';
    if (!smtpConfigured) {
      return res.status(200).json({
        success: false,
        configured: false,
        message: 'SMTP email is not configured. Please set up your email credentials in the .env file to send emails.',
        setupGuide: {
          steps: [
            '1. Open your .env file in the project root',
            '2. Set SMTP_EMAIL=your_gmail@gmail.com',
            '3. Set SMTP_PASSWORD=your_16_char_app_password',
            '4. In Gmail: Go to Account → Security → 2-Step Verification → App Passwords → Generate',
            '5. Restart the server: npm run dev',
          ],
        },
      });
    }

    await sendEmail({
      email: targetEmail,
      subject: `🧾 Invoice #${transaction.transactionNumber} — SmartInventory Pro`,
      html: invoiceEmailHTML(transaction),
    });

    res.status(200).json({
      success: true,
      message: `✅ Invoice emailed successfully to ${targetEmail}`,
    });
  } catch (err) {
    // Return friendly error instead of 500
    res.status(200).json({
      success: false,
      message: `Email failed: ${err.message}`,
      hint: 'Check that your Gmail App Password is correct in the .env file.',
    });
  }
};

// @desc    Send payment reminder manually
// @route   POST /api/transactions/:id/send-reminder
exports.sendPaymentReminder = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('items.product', 'name sku');

    if (!transaction) return next(new ErrorResponse('Transaction not found', 404));
    if (transaction.paymentStatus === 'paid') {
      return next(new ErrorResponse('This transaction is already paid', 400));
    }

    const { email, daysOverdue = 0 } = req.body;
    const targetEmail = email || transaction.customer?.email;

    if (!targetEmail) {
      return next(new ErrorResponse('No customer email found. Please provide an email address.', 400));
    }

    await sendEmail({
      email: targetEmail,
      subject: `⏰ Payment Reminder — Invoice #${transaction.transactionNumber} — ₹${transaction.netAmount?.toFixed(2)} Due`,
      html: paymentReminderEmailHTML(transaction, parseInt(daysOverdue)),
    });

    res.status(200).json({ success: true, message: `Payment reminder sent to ${targetEmail}` });
  } catch (err) { next(err); }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return next(new ErrorResponse('Transaction not found', 404));
    if (transaction.status === 'completed') {
      return next(new ErrorResponse('Cannot delete a completed transaction', 400));
    }
    await transaction.deleteOne();
    res.status(200).json({ success: true, message: 'Transaction deleted' });
  } catch (err) { next(err); }
};
