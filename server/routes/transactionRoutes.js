const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTransactions, getTransaction, createTransaction,
  updateTransactionStatus, updatePaymentStatus,
  resendInvoice, sendPaymentReminder, deleteTransaction,
} = require('../controllers/transactionController');

router.use(protect);

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.route('/:id')
  .get(getTransaction)
  .delete(authorize('admin'), deleteTransaction);

router.patch('/:id/status', authorize('admin', 'manager'), updateTransactionStatus);
router.patch('/:id/payment-status', authorize('admin', 'manager'), updatePaymentStatus);
router.post('/:id/resend-invoice', authorize('admin', 'manager'), resendInvoice);
router.post('/:id/send-reminder', authorize('admin', 'manager'), sendPaymentReminder);

module.exports = router;
