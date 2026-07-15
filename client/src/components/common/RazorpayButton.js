import React, { useState, useEffect } from 'react';
import { FiCreditCard, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * RazorpayButton — initiates online payment for a transaction
 * Props:
 *   transactionId - MongoDB transaction _id
 *   amount        - display amount (₹)
 *   customerName  - prefill customer name
 *   customerEmail - prefill customer email
 *   customerPhone - prefill customer phone
 *   onSuccess(paymentId) - called after successful payment
 */
const RazorpayButton = ({ transactionId, amount, customerName, customerEmail, customerPhone, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(null);

  useEffect(() => {
    api.get('/payments/config')
      .then(({ data }) => setConfigured(data.configured))
      .catch(() => setConfigured(false));
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { toast.error('Failed to load payment gateway. Check internet connection.'); setLoading(false); return; }

      const { data } = await api.post('/payments/create-order', { transactionId });

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: 'INR',
        name: 'SmartInventory Pro',
        description: `Invoice #${data.transaction.number}`,
        order_id: data.order.id,
        prefill: {
          name: customerName || '',
          email: customerEmail || '',
          contact: customerPhone || '',
        },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              transactionId,
            });
            toast.success('✅ Payment successful!');
            if (onSuccess) onSuccess(response.razorpay_payment_id);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
    }
    setLoading(false);
  };

  if (configured === false) {
    return (
      <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: '0.82rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--warning)', fontWeight: 600, marginBottom: 4 }}>
          <FiAlertCircle size={14} /> Razorpay Not Configured
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
          Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env to enable online payments.
          Get keys at razorpay.com (free account available).
        </p>
      </div>
    );
  }

  return (
    <button
      className="btn btn-success"
      onClick={handlePayment}
      disabled={loading || configured === null}
      style={{ gap: 8 }}
    >
      {loading ? (
        <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
      ) : (
        <FiCreditCard size={15} />
      )}
      {loading ? 'Processing...' : `Pay ₹${amount?.toFixed(2)} Online`}
    </button>
  );
};

export default RazorpayButton;
