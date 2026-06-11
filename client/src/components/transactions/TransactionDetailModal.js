import React, { useState } from 'react';
import { FiX, FiDownload, FiMail, FiBell, FiCheck } from 'react-icons/fi';
import { format } from 'date-fns';
import { generateInvoicePDF } from '../../services/pdfService';
import { formatINRFull } from '../../utils/currency';
import api from '../../services/api';
import toast from 'react-hot-toast';

const paymentStatusConfig = {
  paid: { label: '✅ Paid', color: 'var(--success)', bg: 'rgba(16,185,129,0.12)' },
  unpaid: { label: '❌ Unpaid', color: 'var(--danger)', bg: 'rgba(239,68,68,0.12)' },
  partial: { label: '⏳ Partial', color: 'var(--warning)', bg: 'rgba(245,158,11,0.12)' },
};

const TransactionDetailModal = ({ transaction: tx, onClose, onRefresh }) => {
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [emailInput, setEmailInput] = useState(tx.customer?.email || '');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailAction, setEmailAction] = useState('invoice');
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const ps = paymentStatusConfig[tx.paymentStatus] || paymentStatusConfig.unpaid;

  const handleResendInvoice = async () => {
    if (!emailInput) { toast.error('Please enter a customer email'); return; }
    setSendingInvoice(true);
    try {
      const { data } = await api.post(`/transactions/${tx._id}/resend-invoice`, { email: emailInput });
      if (data.success) {
        toast.success(data.message || '✅ Invoice sent!');
        setShowEmailForm(false);
      } else if (!data.configured) {
        // SMTP not configured — show setup guide
        toast.error('Email not configured. See setup instructions below.', { duration: 5000 });
        setShowSetupGuide(true);
        setShowEmailForm(false);
      } else {
        toast.error(data.message || 'Failed to send email');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error. Check SMTP settings.');
    }
    setSendingInvoice(false);
  };

  const handleSendReminder = async () => {
    if (!emailInput) { toast.error('Please enter a customer email'); return; }
    setSendingReminder(true);
    try {
      const { data } = await api.post(`/transactions/${tx._id}/send-reminder`, { email: emailInput, daysOverdue: 0 });
      toast.success(data.message || 'Reminder sent!');
      setShowEmailForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reminder');
    }
    setSendingReminder(false);
  };

  const openEmailForm = (action) => {
    setEmailAction(action);
    setEmailInput(tx.customer?.email || '');
    setShowEmailForm(true);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">🧾 Transaction Details</h3>
            <code style={{ fontSize: '0.78rem', color: 'var(--primary-light)', marginTop: 3, display: 'block' }}>
              #{tx.transactionNumber}
            </code>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Payment status badge */}
            <span style={{ background: ps.bg, color: ps.color, padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              {ps.label}
            </span>
            {/* PDF Download */}
            <button className="btn btn-ghost btn-sm" onClick={() => generateInvoicePDF(tx)}>
              <FiDownload size={13} /> PDF
            </button>
            {/* Resend Invoice (only for sales) */}
            {tx.type === 'sale' && (
              <button className="btn btn-sm" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', border: 'none' }} onClick={() => openEmailForm('invoice')}>
                <FiMail size={13} /> Send Bill
              </button>
            )}
            {/* Reminder (only for unpaid/partial sales) */}
            {tx.type === 'sale' && tx.paymentStatus !== 'paid' && (
              <button className="btn btn-sm" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', border: 'none' }} onClick={() => openEmailForm('reminder')}>
                <FiBell size={13} /> Remind
              </button>
            )}
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><FiX /></button>
          </div>
        </div>

        <div className="modal-body">
          {/* SMTP Setup Guide */}
          {showSetupGuide && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--warning)', fontSize: '0.9rem' }}>⚙️ Email Not Configured</div>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowSetupGuide(false)}><FiX size={13} /></button>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                To send emails, you need to configure Gmail SMTP. Follow these steps:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { step: '1', text: 'Open your .env file in the project root folder' },
                  { step: '2', text: 'Set: SMTP_EMAIL=jadavhitakshi@gmail.com' },
                  { step: '3', text: 'Set: SMTP_PASSWORD=your_16_character_app_password' },
                  { step: '4', text: 'In Gmail → Account Settings → Security → 2-Step Verification → App Passwords → Select "Mail" → Generate' },
                  { step: '5', text: 'Copy the 16-character password and paste it in SMTP_PASSWORD' },
                  { step: '6', text: 'Restart the server: npm run dev' },
                ].map(({ step, text }) => (
                  <div key={step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ background: 'var(--warning)', color: '#fff', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{step}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--primary-light)' }}>
                # In your .env file:<br />
                SMTP_EMAIL=jadavhitakshi@gmail.com<br />
                SMTP_PASSWORD=abcd efgh ijkl mnop<br />
                FROM_NAME=SmartInventory Pro<br />
                FROM_EMAIL=jadavhitakshi@gmail.com
              </div>
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 10, color: 'var(--primary-light)', fontSize: '0.82rem', fontWeight: 600 }}>
                🔗 Open Gmail App Passwords →
              </a>
            </div>
          )}

          {/* Email form popup */}
          {showEmailForm && (
            <div style={{ background: emailAction === 'invoice' ? 'rgba(99,102,241,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${emailAction === 'invoice' ? 'rgba(99,102,241,0.25)' : 'rgba(245,158,11,0.25)'}`, borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 10, color: emailAction === 'invoice' ? 'var(--primary-light)' : 'var(--warning)' }}>
                {emailAction === 'invoice' ? '📧 Send Invoice / Bill' : '⏰ Send Payment Reminder'}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="email"
                  className="form-control"
                  placeholder="customer@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  disabled={sendingInvoice || sendingReminder}
                  onClick={emailAction === 'invoice' ? handleResendInvoice : handleSendReminder}
                >
                  {(sendingInvoice || sendingReminder)
                    ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    : <><FiMail size={12} /> Send</>}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowEmailForm(false)}><FiX size={12} /></button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                {emailAction === 'invoice'
                  ? 'The customer will receive an auto-generated invoice with payment options (online & offline).'
                  : 'The customer will receive a payment reminder with online/offline payment instructions.'}
              </p>
            </div>
          )}

          {/* Meta info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Type', value: tx.type?.toUpperCase() },
              { label: 'Status', value: tx.status?.toUpperCase() },
              { label: 'Payment Method', value: tx.paymentMethod?.replace('_', ' ').toUpperCase() },
              { label: 'Date', value: format(new Date(tx.createdAt), 'dd MMM yyyy, HH:mm') },
              { label: 'Created By', value: tx.createdBy?.name },
              { label: 'Reference', value: tx.reference || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{value || '—'}</div>
              </div>
            ))}
          </div>

          {/* Customer / Supplier info */}
          {(tx.customer?.name || tx.supplier?.name) && (
            <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                {tx.type === 'sale' ? '👤 Customer' : '🚚 Supplier'}
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.875rem' }}>
                {tx.customer?.name && <div><strong>Name:</strong> {tx.customer.name}</div>}
                {tx.customer?.email && <div><strong>Email:</strong> {tx.customer.email}</div>}
                {tx.customer?.phone && <div><strong>Phone:</strong> {tx.customer.phone}</div>}
                {tx.supplier?.name && <div><strong>Name:</strong> {tx.supplier.name}</div>}
                {tx.supplier?.email && <div><strong>Email:</strong> {tx.supplier.email}</div>}
                {tx.supplier?.phone && <div><strong>Phone:</strong> {tx.supplier.phone}</div>}
              </div>
            </div>
          )}

          {/* Items table */}
          <div className="table-container" style={{ marginBottom: 16 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {tx.items?.map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{item.product?.name || 'Unknown'}</td>
                    <td><code style={{ fontSize: '0.78rem', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4 }}>{item.product?.sku || '—'}</code></td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatINRFull(item.unitPrice)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatINRFull(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 260, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              {[
                { label: 'Subtotal', value: formatINRFull(tx.totalAmount) },
                { label: 'Discount', value: `-${formatINRFull(tx.discount)}`, color: 'var(--success)' },
                { label: 'GST / Tax', value: `+${formatINRFull(tx.tax)}`, color: 'var(--warning)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ color: color || 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: ps.bg }}>
                <span style={{ fontWeight: 700 }}>Net Total</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: ps.color }}>
                  {formatINRFull(tx.netAmount)}
                </span>
              </div>
            </div>
          </div>

          {tx.notes && (
            <div style={{ marginTop: 14, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 700 }}>Notes</div>
              <p style={{ fontSize: '0.875rem' }}>{tx.notes}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-ghost" onClick={() => generateInvoicePDF(tx)}>
            <FiDownload size={13} /> Download PDF
          </button>
          {tx.type === 'sale' && (
            <button className="btn btn-primary" onClick={() => openEmailForm('invoice')}>
              <FiMail size={13} /> Email Invoice
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
