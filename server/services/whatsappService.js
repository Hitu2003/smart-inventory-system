const logger = require('../utils/logger');

/**
 * WhatsApp notification service using Twilio
 * Setup: https://www.twilio.com/whatsapp
 * Free sandbox available for testing
 */

const isConfigured = () => {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM &&
    process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid'
  );
};

const getTwilioClient = () => {
  if (!isConfigured()) return null;
  const twilio = require('twilio');
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

/**
 * Send WhatsApp message
 */
const sendWhatsApp = async (to, message) => {
  if (!isConfigured()) {
    logger.warn(`[WhatsApp SKIPPED] Not configured. Message for ${to}: ${message.substring(0, 50)}...`);
    return { skipped: true };
  }

  try {
    const from = process.env.TWILIO_WHATSAPP_FROM.startsWith('whatsapp:')
      ? process.env.TWILIO_WHATSAPP_FROM
      : `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;

    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const client = getTwilioClient();
    const msg = await client.messages.create({
      from,
      to: toFormatted,
      body: message,
    });

    logger.info(`✅ WhatsApp sent to ${to}: ${msg.sid}`);
    return msg;
  } catch (err) {
    logger.error(`❌ WhatsApp failed to ${to}: ${err.message}`);
    return { error: err.message };
  }
};

// ── Message Templates ──────────────────────────────────────────────

const orderConfirmationMessage = (transaction) => {
  const items = (transaction.items || [])
    .map((i) => `  • ${i.product?.name || 'Product'} x${i.quantity} = ₹${(i.totalPrice || 0).toFixed(2)}`)
    .join('\n');

  return `🧾 *SmartInventory Pro*
━━━━━━━━━━━━━━━━━━
✅ *Order Confirmed!*

Invoice: #${transaction.transactionNumber}
Customer: ${transaction.customer?.name || 'Customer'}

*Items:*
${items}

*Subtotal:* ₹${(transaction.totalAmount || 0).toFixed(2)}
*Discount:* -₹${(transaction.discount || 0).toFixed(2)}
*GST/Tax:* +₹${(transaction.tax || 0).toFixed(2)}
*Net Total:* ₹${(transaction.netAmount || 0).toFixed(2)}

*Payment:* ${(transaction.paymentMethod || 'Cash').replace(/_/g, ' ').toUpperCase()}
*Status:* ${transaction.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Payment Pending'}

Thank you for your business! 🙏
━━━━━━━━━━━━━━━━━━`;
};

const paymentReminderMessage = (transaction, daysOverdue = 0) => {
  const urgency = daysOverdue > 7 ? '🔴 OVERDUE' : daysOverdue > 3 ? '🟡 URGENT' : '🔵 REMINDER';
  return `${urgency} *Payment Due*
━━━━━━━━━━━━━━━━━━
Dear ${transaction.customer?.name || 'Customer'},

Invoice #${transaction.transactionNumber} is pending.

*Amount Due:* ₹${(transaction.netAmount || 0).toFixed(2)}
${daysOverdue > 0 ? `*Overdue by:* ${daysOverdue} days` : '*Please pay at earliest*'}

*Payment Options:*
💻 Online: UPI / GPay / PhonePe
🏪 Offline: Cash / Bank Transfer

Contact us for any queries.
SmartInventory Pro 📦
━━━━━━━━━━━━━━━━━━`;
};

const lowStockAlertMessage = (items) => {
  const itemList = items
    .slice(0, 5)
    .map((i) => `  ⚠️ ${i.name} (${i.sku}) — Stock: *${i.quantity}*`)
    .join('\n');

  return `⚠️ *Low Stock Alert*
━━━━━━━━━━━━━━━━━━
The following items need restocking:

${itemList}
${items.length > 5 ? `\n  ...and ${items.length - 5} more items` : ''}

Please reorder immediately.
SmartInventory Pro 📦
━━━━━━━━━━━━━━━━━━`;
};

const purchaseOrderMessage = (transaction) => {
  return `🛒 *New Purchase Order*
━━━━━━━━━━━━━━━━━━
PO: #${transaction.transactionNumber}
Supplier: ${transaction.supplier?.name || 'Supplier'}
Items: ${transaction.items?.length || 0}
*Amount:* ₹${(transaction.netAmount || 0).toFixed(2)}
Status: ${(transaction.status || '').toUpperCase()}

SmartInventory Pro 📦
━━━━━━━━━━━━━━━━━━`;
};

module.exports = {
  sendWhatsApp,
  isWhatsAppConfigured: isConfigured,
  messages: {
    orderConfirmation: orderConfirmationMessage,
    paymentReminder: paymentReminderMessage,
    lowStockAlert: lowStockAlertMessage,
    purchaseOrder: purchaseOrderMessage,
  },
};
