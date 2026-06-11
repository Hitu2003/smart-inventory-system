/**
 * Format number as Indian Rupees
 * Uses Indian numbering system: 1,00,000 (lakhs)
 */
export const formatINR = (amount, decimals = 0) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// Short version: ₹89,950
export const formatINRShort = (amount) => formatINR(amount, 0);

// With decimals: ₹89,950.00
export const formatINRFull = (amount) => formatINR(amount, 2);

// Compact: ₹1.2L, ₹3.4Cr
export const formatINRCompact = (amount) => {
  if (!amount) return '₹0';
  const num = parseFloat(amount);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
};
