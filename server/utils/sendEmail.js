const nodemailer = require('nodemailer');
const logger = require('./logger');

// ── Core email sender ──────────────────────────────────────────────────────
const sendEmail = async ({ email, subject, html, message }) => {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPass = process.env.SMTP_PASSWORD;
  const isConfigured = smtpEmail &&
    smtpEmail !== 'your_email@gmail.com' &&
    smtpPass &&
    smtpPass !== 'your_16_char_app_password_here' &&
    smtpPass.length >= 10;

  if (!isConfigured) {
    logger.warn(`[EMAIL SKIPPED] SMTP not configured. Target: ${email} | Subject: ${subject}`);
    logger.warn('[EMAIL SETUP] Add SMTP_EMAIL and SMTP_PASSWORD to .env then restart server');
    // Return fake success so app doesn't crash
    return { messageId: 'smtp-not-configured', skipped: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: smtpEmail, pass: smtpPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'SmartInventory Pro'}" <${process.env.FROM_EMAIL || smtpEmail}>`,
      to: email,
      subject,
      html: html || message,
    });

    logger.info(`✅ Email sent to ${email} | ID: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`❌ Email failed to ${email}: ${err.message}`);
    throw new Error(getEmailErrorMessage(err));
  }
};

// ── Friendly error messages ────────────────────────────────────────────────
const getEmailErrorMessage = (err) => {
  const msg = err.message || '';
  if (msg.includes('535') || msg.includes('Username and Password') || msg.includes('BadCredentials')) {
    return 'Gmail App Password is wrong. Go to myaccount.google.com/apppasswords and generate a new 16-character App Password. Then update SMTP_PASSWORD in .env file.';
  }
  if (msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT')) {
    return 'Cannot connect to Gmail SMTP. Check your internet connection.';
  }
  if (msg.includes('EAUTH')) {
    return 'Gmail authentication failed. Make sure 2-Step Verification is enabled and you are using an App Password (not your regular Gmail password).';
  }
  return `Email error: ${msg}`;
};

// ── Shared header/footer ──────────────────────────────────────────────────
const emailHeader = (title, subtitle, gradient) => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f0f4f8; }
  .wrapper { max-width: 640px; margin: 20px auto; background: #f0f4f8; padding: 0 16px 30px; }
  .header { background: ${gradient}; padding: 36px 30px; border-radius: 14px 14px 0 0; text-align: center; }
  .header h1 { color: #fff; font-size: 26px; font-weight: 800; margin: 0 0 6px; }
  .header p { color: rgba(255,255,255,0.88); font-size: 14px; margin: 0; }
  .body { background: #fff; padding: 28px 30px; border-radius: 0 0 14px 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .section { background: #f8fafc; border-radius: 10px; padding: 18px 20px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
  .section h3 { color: #1a202c; font-size: 15px; font-weight: 700; margin-bottom: 14px; }
  .info-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #edf2f7; font-size: 13px; }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: #718096; font-weight: 500; }
  .info-value { color: #2d3748; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #edf2f7; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; color: #4a5568; text-transform: uppercase; letter-spacing: 0.04em; }
  td { padding: 11px 12px; border-bottom: 1px solid #edf2f7; font-size: 13px; color: #2d3748; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  .amount-box { text-align: right; margin-top: 16px; }
  .amount-row { font-size: 13px; color: #718096; margin-bottom: 4px; }
  .total-btn { display: inline-block; padding: 10px 24px; border-radius: 8px; font-size: 16px; font-weight: 800; color: #fff; margin-top: 8px; }
  .footer { text-align: center; color: #a0aec0; font-size: 11px; margin-top: 20px; line-height: 1.6; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
  .badge-green { background: #d1fae5; color: #065f46; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-yellow { background: #fef3c7; color: #92400e; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .pay-btn { display: block; text-align: center; background: #6366f1; color: #fff !important; padding: 14px 30px; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none; margin: 16px 0 8px; }
  .pay-offline { display: block; text-align: center; background: #f0fdf4; color: #166534; padding: 12px 30px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; margin-top: 8px; border: 1.5px solid #86efac; }
</style></head><body>
<div class="wrapper">
  <div class="header">
    <h1>${title}</h1>
    <p>${subtitle}</p>
  </div>
  <div class="body">`;

const emailFooter = () => `
  </div>
  <div class="footer">
    <p><strong>SmartInventory Pro</strong> · Automated Billing System</p>
    <p>This is an automatically generated email. Please do not reply.</p>
  </div>
</div></body></html>`;

// ── Format date ────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  const date = d ? new Date(d) : new Date();
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

const fmtINR = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ── 1. AUTO-GENERATED INVOICE / BILL EMAIL ────────────────────────────────
const invoiceEmailHTML = (transaction) => {
  const customer = transaction.customer || {};
  const items = transaction.items || [];
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const isPaid = transaction.paymentStatus === 'paid';
  const statusBadge = isPaid
    ? '<span class="badge badge-green">✅ PAID</span>'
    : '<span class="badge badge-yellow">⏳ PAYMENT PENDING</span>';

  const itemRows = items.map((item, i) => `
    <tr style="${i % 2 === 0 ? '' : 'background:#f8fafc;'}">
      <td><strong>${item.product?.name || 'Product'}</strong><br><span style="color:#718096;font-size:11px;">${item.product?.sku || ''}</span></td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">${fmtINR(item.unitPrice)}</td>
      <td style="text-align:right;font-weight:700;">${fmtINR(item.totalPrice)}</td>
    </tr>`).join('');

  return emailHeader(
    '🧾 Invoice / Bill',
    `Invoice #${transaction.transactionNumber} · ${fmtDate(transaction.createdAt)}`,
    'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
  ) + `
    <!-- Invoice Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:12px;">
      <div>
        <div style="font-size:22px;font-weight:800;color:#1a202c;">INVOICE</div>
        <div style="font-size:13px;color:#718096;margin-top:4px;">#${transaction.transactionNumber}</div>
        <div style="margin-top:8px;">${statusBadge}</div>
      </div>
      <div style="text-align:right;font-size:13px;color:#4a5568;">
        <div><strong>Issue Date:</strong> ${fmtDate(transaction.createdAt)}</div>
        ${!isPaid ? `<div style="color:#dc2626;"><strong>Due Date:</strong> ${fmtDate(dueDate)}</div>` : ''}
      </div>
    </div>

    <!-- Customer Info -->
    <div class="section">
      <h3>👤 Bill To</h3>
      <div class="info-row"><span class="info-label">Name</span><span class="info-value">${customer.name || 'Customer'}</span></div>
      ${customer.email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-value">${customer.email}</span></div>` : ''}
      ${customer.phone ? `<div class="info-row"><span class="info-label">Phone</span><span class="info-value">${customer.phone}</span></div>` : ''}
      ${customer.address ? `<div class="info-row"><span class="info-label">Address</span><span class="info-value">${customer.address}</span></div>` : ''}
    </div>

    <!-- Items -->
    <div class="section">
      <h3>🛒 Items Purchased</h3>
      <table>
        <thead><tr><th>Product</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div class="amount-box">
        <div class="amount-row">Subtotal: ${fmtINR(transaction.totalAmount)}</div>
        ${transaction.discount > 0 ? `<div class="amount-row" style="color:#16a34a;">Discount: -${fmtINR(transaction.discount)}</div>` : ''}
        ${transaction.tax > 0 ? `<div class="amount-row">GST/Tax: +${fmtINR(transaction.tax)}</div>` : ''}
        <div style="margin-top:10px;padding-top:10px;border-top:2px solid #e2e8f0;">
          <span class="total-btn" style="background:${isPaid ? '#059669' : '#6366f1'};">
            ${isPaid ? '✅ Amount Paid' : '💰 Amount Due'}: ${fmtINR(transaction.netAmount)}
          </span>
        </div>
      </div>
    </div>

    <!-- Payment Options (only if not paid) -->
    ${!isPaid ? `
    <div class="section">
      <h3>💳 Payment Options</h3>
      <p style="font-size:13px;color:#4a5568;margin-bottom:16px;">
        Please complete your payment of <strong>${fmtINR(transaction.netAmount)}</strong> using any of the options below:
      </p>

      <!-- Online Payment -->
      <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:10px;padding:16px;margin-bottom:12px;">
        <div style="color:#fff;font-weight:700;font-size:14px;margin-bottom:8px;">💻 Pay Online</div>
        <div style="color:rgba(255,255,255,0.85);font-size:12px;margin-bottom:12px;">Fast & secure digital payment</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <span style="background:rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;">📱 UPI</span>
          <span style="background:rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;">💳 Credit/Debit Card</span>
          <span style="background:rgba(255,255,255,0.2);color:#fff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;">🏦 Net Banking</span>
        </div>
      </div>

      <!-- Offline Payment -->
      <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:16px;">
        <div style="color:#166534;font-weight:700;font-size:14px;margin-bottom:10px;">🏪 Pay Offline</div>
        <div style="font-size:13px;color:#4a5568;line-height:1.8;">
          <div>💵 <strong>Cash</strong> — Pay at our store/office</div>
          <div>🏦 <strong>Bank Transfer</strong> — NEFT/RTGS/IMPS</div>
          <div>📝 <strong>Cheque</strong> — In favor of SmartInventory</div>
        </div>
      </div>
    </div>

    <!-- Payment reminder -->
    <div style="background:#fff7ed;border:1.5px solid #fdba74;border-radius:10px;padding:14px;margin-bottom:16px;">
      <div style="color:#c2410c;font-weight:700;font-size:13px;">⚠️ Payment Reminder</div>
      <div style="color:#9a3412;font-size:12px;margin-top:4px;">
        Please complete payment by <strong>${fmtDate(dueDate)}</strong> to avoid any inconvenience.
        Contact us at <strong>${process.env.SMTP_EMAIL || 'support@smartinventory.com'}</strong> if you have questions.
      </div>
    </div>
    ` : `
    <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:16px;margin-bottom:16px;text-align:center;">
      <div style="font-size:32px;margin-bottom:8px;">✅</div>
      <div style="color:#166534;font-weight:700;font-size:15px;">Payment Received! Thank you.</div>
      <div style="color:#4a5568;font-size:12px;margin-top:4px;">Your payment of ${fmtINR(transaction.netAmount)} has been received successfully.</div>
    </div>
    `}

    <!-- Notes -->
    ${transaction.notes ? `<div class="section"><h3>📝 Notes</h3><p style="font-size:13px;color:#4a5568;line-height:1.6;">${transaction.notes}</p></div>` : ''}
  ` + emailFooter();
};

// ── 2. PAYMENT CONFIRMATION EMAIL ─────────────────────────────────────────
const paymentConfirmationEmailHTML = (transaction) => {
  const customer = transaction.customer || {};
  return emailHeader(
    '✅ Payment Confirmed!',
    `Your payment has been received — Thank you, ${customer.name || 'Customer'}!`,
    'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  ) + `
    <div style="text-align:center;padding:10px 0 20px;">
      <div style="font-size:56px;">🎉</div>
      <h2 style="color:#1a202c;font-size:20px;margin:12px 0 6px;">Payment Successful</h2>
      <p style="color:#718096;font-size:13px;">Transaction #${transaction.transactionNumber}</p>
    </div>

    <div class="section">
      <div class="info-row"><span class="info-label">Amount Paid</span><span class="info-value" style="color:#059669;font-size:18px;font-weight:800;">${fmtINR(transaction.netAmount)}</span></div>
      <div class="info-row"><span class="info-label">Payment Method</span><span class="info-value">${(transaction.paymentMethod || 'Cash').replace(/_/g, ' ').toUpperCase()}</span></div>
      <div class="info-row"><span class="info-label">Date</span><span class="info-value">${fmtDate(transaction.createdAt)}</span></div>
      <div class="info-row"><span class="info-label">Invoice #</span><span class="info-value">${transaction.transactionNumber}</span></div>
    </div>

    <div style="background:#f0fdf4;border-radius:10px;padding:16px;text-align:center;margin-bottom:16px;">
      <p style="color:#166534;font-size:13px;line-height:1.7;">
        Your items are ready. Keep this email as your payment receipt.<br>
        For support: <strong>${process.env.SMTP_EMAIL || 'support@smartinventory.com'}</strong>
      </p>
    </div>
  ` + emailFooter();
};

// ── 3. PAYMENT REMINDER EMAIL ─────────────────────────────────────────────
const paymentReminderEmailHTML = (transaction, daysOverdue = 0) => {
  const customer = transaction.customer || {};
  const urgencyColor = daysOverdue > 7 ? '#dc2626' : daysOverdue > 3 ? '#d97706' : '#6366f1';
  const urgencyText = daysOverdue > 7 ? '🔴 OVERDUE' : daysOverdue > 3 ? '🟡 URGENT' : '🔵 REMINDER';

  return emailHeader(
    `${urgencyText} — Payment Due`,
    `Invoice #${transaction.transactionNumber} · ${fmtINR(transaction.netAmount)} pending`,
    `linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}cc 100%)`
  ) + `
    <div style="background:#fff7ed;border:2px solid ${urgencyColor}40;border-radius:10px;padding:16px;margin-bottom:20px;text-align:center;">
      <div style="font-size:13px;color:#92400e;font-weight:700;margin-bottom:6px;">${urgencyText} — Action Required</div>
      <div style="font-size:28px;font-weight:800;color:${urgencyColor};">${fmtINR(transaction.netAmount)}</div>
      <div style="font-size:12px;color:#718096;margin-top:4px;">
        ${daysOverdue > 0 ? `${daysOverdue} days overdue` : 'Payment due soon'}
      </div>
    </div>

    <div class="section">
      <h3>📋 Invoice Details</h3>
      <div class="info-row"><span class="info-label">Invoice #</span><span class="info-value">${transaction.transactionNumber}</span></div>
      <div class="info-row"><span class="info-label">Customer</span><span class="info-value">${customer.name || '-'}</span></div>
      <div class="info-row"><span class="info-label">Invoice Date</span><span class="info-value">${fmtDate(transaction.createdAt)}</span></div>
      <div class="info-row"><span class="info-label">Amount Due</span><span class="info-value" style="color:${urgencyColor};font-size:16px;">${fmtINR(transaction.netAmount)}</span></div>
    </div>

    <div class="section">
      <h3>💳 Pay Now</h3>
      <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:10px;padding:16px;margin-bottom:10px;">
        <div style="color:#fff;font-weight:700;font-size:13px;margin-bottom:8px;">💻 Online Payment Options</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <span style="background:rgba(255,255,255,0.2);color:#fff;padding:5px 12px;border-radius:16px;font-size:12px;">📱 UPI / GPay / PhonePe</span>
          <span style="background:rgba(255,255,255,0.2);color:#fff;padding:5px 12px;border-radius:16px;font-size:12px;">💳 Card</span>
          <span style="background:rgba(255,255,255,0.2);color:#fff;padding:5px 12px;border-radius:16px;font-size:12px;">🏦 Net Banking</span>
        </div>
      </div>
      <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:14px;">
        <div style="color:#166534;font-weight:700;font-size:13px;margin-bottom:6px;">🏪 Pay Offline</div>
        <div style="font-size:12px;color:#4a5568;line-height:1.8;">
          💵 Cash at our store &nbsp;|&nbsp; 🏦 Bank Transfer &nbsp;|&nbsp; 📝 Cheque
        </div>
      </div>
    </div>

    <div style="background:#fee2e2;border:1.5px solid #fca5a5;border-radius:10px;padding:14px;text-align:center;">
      <div style="color:#991b1b;font-size:13px;font-weight:600;">
        Please clear this payment immediately to continue enjoying our services.
        Contact: <strong>${process.env.SMTP_EMAIL || 'billing@smartinventory.com'}</strong>
      </div>
    </div>
  ` + emailFooter();
};

// ── 4. LOW STOCK EMAIL ────────────────────────────────────────────────────
const lowStockEmailHTML = (items) =>
  emailHeader('⚠️ Low Stock Alert', 'Immediate restocking required', 'linear-gradient(135deg,#f59e0b,#d97706)') + `
    <p style="color:#4a5568;font-size:13px;margin-bottom:16px;">The following items need immediate restocking:</p>
    <table>
      <thead><tr><th>Product</th><th>SKU</th><th style="text-align:center;color:#dc2626;">Stock</th><th style="text-align:center;">Reorder At</th></tr></thead>
      <tbody>
        ${items.map((item) => `
          <tr>
            <td><strong>${item.name}</strong></td>
            <td style="color:#718096;">${item.sku}</td>
            <td style="text-align:center;color:${item.quantity === 0 ? '#dc2626' : '#d97706'};font-weight:800;">${item.quantity}</td>
            <td style="text-align:center;color:#718096;">${item.reorderPoint}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  ` + emailFooter();

// ── 5. PURCHASE ORDER EMAIL (to supplier) ────────────────────────────────
const newPurchaseEmailHTML = (transaction) => {
  const items = transaction.items || [];
  const itemRows = items.map((item) => `
    <tr>
      <td><strong>${item.product?.name || 'Unknown'}</strong><br><span style="color:#718096;font-size:11px;">${item.product?.sku || ''}</span></td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;">${fmtINR(item.unitPrice)}</td>
      <td style="text-align:right;font-weight:700;">${fmtINR(item.totalPrice)}</td>
    </tr>`).join('');

  return emailHeader(
    '🛒 New Purchase Order',
    `PO #${transaction.transactionNumber} · ${fmtDate(transaction.createdAt)}`,
    'linear-gradient(135deg,#10b981,#059669)'
  ) + `
    <div class="section">
      <h3>📋 Order Details</h3>
      <div class="info-row"><span class="info-label">PO Number</span><span class="info-value">${transaction.transactionNumber}</span></div>
      <div class="info-row"><span class="info-label">Supplier</span><span class="info-value">${transaction.supplier?.name || '-'}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="badge badge-green">${(transaction.status || '').toUpperCase()}</span></span></div>
      <div class="info-row"><span class="info-label">Payment</span><span class="info-value">${(transaction.paymentMethod || '-').replace(/_/g, ' ').toUpperCase()}</span></div>
    </div>
    <div class="section">
      <h3>📦 Items</h3>
      <table>
        <thead><tr><th>Product</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div class="amount-box">
        <div class="amount-row">Subtotal: ${fmtINR(transaction.totalAmount)}</div>
        <div class="amount-row">Discount: -${fmtINR(transaction.discount)}</div>
        <div class="amount-row">Tax: +${fmtINR(transaction.tax)}</div>
        <span class="total-btn" style="background:#10b981;">Net Total: ${fmtINR(transaction.netAmount)}</span>
      </div>
    </div>
  ` + emailFooter();
};

// ── 6. ORDER COMPLETION (old compat) ─────────────────────────────────────
const orderCompletionEmailHTML = (transaction) => invoiceEmailHTML({
  ...transaction,
  paymentStatus: 'paid',
});

module.exports = {
  sendEmail,
  invoiceEmailHTML,
  paymentConfirmationEmailHTML,
  paymentReminderEmailHTML,
  lowStockEmailHTML,
  newPurchaseEmailHTML,
  orderCompletionEmailHTML,
};
