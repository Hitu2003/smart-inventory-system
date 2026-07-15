const Razorpay = require('razorpay');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id') {
    throw new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
exports.createOrder = async (req, res, next) => {
  try {
    const { transactionId } = req.body;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return next(new ErrorResponse('Transaction not found', 404));

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: Math.round(transaction.netAmount * 100), // paise
      currency: 'INR',
      receipt: transaction.transactionNumber,
      notes: {
        transactionId: transaction._id.toString(),
        customerName: transaction.customer?.name || 'Customer',
      },
    });

    res.status(200).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
      transaction: {
        id: transaction._id,
        number: transaction.transactionNumber,
        amount: transaction.netAmount,
        customer: transaction.customer,
      },
    });
  } catch (err) {
    next(new ErrorResponse(err.message, 500));
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return next(new ErrorResponse('Payment verification failed — invalid signature', 400));
    }

    // Update transaction payment status
    const transaction = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        paymentStatus: 'paid',
        'paymentDetails.razorpayOrderId': razorpay_order_id,
        'paymentDetails.razorpayPaymentId': razorpay_payment_id,
        paymentMethod: 'online',
      },
      { new: true }
    );

    logger.info(`Payment verified: ${razorpay_payment_id} for transaction ${transaction?.transactionNumber}`);

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Razorpay config (public key only)
// @route   GET /api/payments/config
exports.getPaymentConfig = async (req, res) => {
  const isConfigured = !!(process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id');

  res.status(200).json({
    success: true,
    configured: isConfigured,
    key: isConfigured ? process.env.RAZORPAY_KEY_ID : null,
    message: isConfigured ? 'Razorpay is configured' : 'Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env to enable online payments',
  });
};
