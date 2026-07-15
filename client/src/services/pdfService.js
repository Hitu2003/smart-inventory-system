import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

const PRIMARY = [99, 102, 241];
const DARK = [15, 23, 42];
const GRAY = [100, 116, 139];
const LIGHT = [248, 250, 252];
const SUCCESS = [16, 185, 129];
const WHITE = [255, 255, 255];

const fmtINR = (n) => `Rs.${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => format(d ? new Date(d) : new Date(), 'dd MMM yyyy');

// ── Branded header ──────────────────────────────────────────────────
const drawHeader = (doc, title) => {
  // Background gradient bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 35, 'F');

  // Logo circle
  doc.setFillColor(255, 255, 255, 0.2);
  doc.circle(20, 17.5, 10, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SI', 16.5, 20);

  // Company name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('SmartInventory Pro', 34, 14);

  // Subtitle
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 255);
  doc.text('Advanced Inventory Management System', 34, 20);

  // Document type
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text(title, 210 - 15, 20, { align: 'right' });

  doc.setTextColor(...DARK);
  return 42;
};

// ── Info box ────────────────────────────────────────────────────────
const drawInfoBox = (doc, x, y, w, h, label, lines, accentColor = PRIMARY) => {
  doc.setFillColor(...LIGHT);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  doc.setFillColor(...accentColor);
  doc.rect(x, y, 3, h, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY);
  doc.text(label.toUpperCase(), x + 7, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  lines.forEach((line, i) => doc.text(line, x + 7, y + 12 + i * 6));
};

// ── Footer ──────────────────────────────────────────────────────────
const drawFooter = (doc) => {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const y = doc.internal.pageSize.height - 12;
    doc.setFillColor(...LIGHT);
    doc.rect(0, y - 4, 210, 16, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text('SmartInventory Pro — Confidential Document', 15, y + 2);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, 105, y + 2, { align: 'center' });
    doc.text(`Page ${i} of ${pages}`, 195, y + 2, { align: 'right' });
  }
};

// ── INVOICE PDF ─────────────────────────────────────────────────────
export const generateInvoicePDF = (transaction) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = drawHeader(doc, 'INVOICE');

  const isPaid = transaction.paymentStatus === 'paid';
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Invoice meta
  doc.setFillColor(...LIGHT);
  doc.rect(14, y, 182, 22, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY);
  doc.text(`#${transaction.transactionNumber}`, 18, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`Issue Date: ${fmtDate(transaction.createdAt)}`, 18, y + 15);

  // Payment status badge
  const badgeColor = isPaid ? SUCCESS : [245, 158, 11];
  const badgeText = isPaid ? '✓ PAID' : '⏳ PAYMENT PENDING';
  doc.setFillColor(...badgeColor);
  doc.roundedRect(145, y + 4, 50, 10, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text(badgeText, 170, y + 11, { align: 'center' });

  if (!isPaid) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor([220, 38, 38]);
    doc.text(`Due: ${fmtDate(dueDate)}`, 180, y + 19, { align: 'right' });
  }

  y += 28;

  // Customer & Company info boxes
  const customer = transaction.customer || {};
  drawInfoBox(doc, 14, y, 86, 34, 'Bill To', [
    customer.name || 'Walk-in Customer',
    customer.email || '',
    customer.phone || '',
    customer.address || '',
  ]);

  drawInfoBox(doc, 108, y, 88, 34, 'Payment Info', [
    `Method: ${(transaction.paymentMethod || 'Cash').replace(/_/g, ' ').toUpperCase()}`,
    `Type: ${(transaction.type || 'Sale').toUpperCase()}`,
    `Status: ${(transaction.status || '').toUpperCase()}`,
    transaction.reference ? `Ref: ${transaction.reference}` : '',
  ], SUCCESS);

  y += 40;

  // Items table
  const itemRows = (transaction.items || []).map((item) => [
    item.product?.name || 'Product',
    item.product?.sku || '-',
    item.quantity?.toString(),
    fmtINR(item.unitPrice),
    fmtINR(item.totalPrice),
  ]);

  doc.autoTable({
    startY: y,
    head: [['Product', 'SKU', 'Qty', 'Unit Price', 'Amount']],
    body: itemRows,
    theme: 'striped',
    headStyles: {
      fillColor: PRIMARY,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: { fontSize: 9, cellPadding: 3.5 },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 65 },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Totals box
  const totals = [
    { label: 'Subtotal', value: fmtINR(transaction.totalAmount), bold: false },
    { label: `Discount`, value: `-${fmtINR(transaction.discount || 0)}`, bold: false, color: SUCCESS },
    { label: `GST/Tax`, value: `+${fmtINR(transaction.tax || 0)}`, bold: false, color: [245, 158, 11] },
    { label: 'NET TOTAL', value: fmtINR(transaction.netAmount), bold: true, color: isPaid ? SUCCESS : PRIMARY },
  ];

  doc.setFillColor(...LIGHT);
  doc.roundedRect(120, y, 76, totals.length * 9 + 6, 2, 2, 'F');

  totals.forEach((row, i) => {
    const rowY = y + 8 + i * 9;
    doc.setFontSize(row.bold ? 10 : 8.5);
    doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
    doc.setTextColor(...(row.color || GRAY));
    doc.text(row.label, 126, rowY);
    doc.setTextColor(...(row.bold ? (row.color || PRIMARY) : DARK));
    doc.text(row.value, 193, rowY, { align: 'right' });
  });

  y += totals.length * 9 + 14;

  // Payment instructions (if unpaid)
  if (!isPaid) {
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(14, y, 182, 28, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text('Payment Instructions', 18, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 53, 15);
    doc.text('Online: UPI / GPay / PhonePe / Paytm / Net Banking / Credit Card', 18, y + 14);
    doc.text('Offline: Cash at store | Bank Transfer (NEFT/RTGS/IMPS) | Cheque', 18, y + 20);
    doc.text(`Please complete payment by ${fmtDate(dueDate)} to avoid delays.`, 18, y + 26);
  }

  if (transaction.notes) {
    y += isPaid ? 0 : 34;
    doc.setFillColor(...LIGHT);
    doc.roundedRect(14, y, 182, 16, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GRAY);
    doc.text('NOTES', 18, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(transaction.notes, 18, y + 12);
  }

  drawFooter(doc);
  doc.save(`Invoice-${transaction.transactionNumber}.pdf`);
};

// ── INVENTORY REPORT PDF ────────────────────────────────────────────
export const generateInventoryReportPDF = (reportData) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = drawHeader(doc, 'INVENTORY REPORT');

  // Summary cards
  const totals = reportData.totals || {};
  const summaryItems = [
    { label: 'Total Products', value: totals.products || 0, color: PRIMARY },
    { label: 'Cost Value', value: `Rs.${((totals.totalCostValue || 0) / 100).toFixed(0)}`, color: SUCCESS },
    { label: 'Retail Value', value: `Rs.${((totals.totalRetailValue || 0) / 100).toFixed(0)}`, color: [14, 165, 233] },
    { label: 'Low Stock', value: totals.lowStockItems || 0, color: [245, 158, 11] },
  ];

  summaryItems.forEach((item, i) => {
    const x = 14 + i * 46;
    doc.setFillColor(...item.color);
    doc.roundedRect(x, y, 42, 18, 2, 2, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(String(item.value), x + 21, y + 10, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, x + 21, y + 15, { align: 'center' });
  });

  y += 24;

  const tableData = (reportData.categories || []).map((cat) => [
    cat._id || 'Uncategorized',
    cat.products,
    cat.totalQuantity,
    fmtINR(cat.totalCostValue),
    fmtINR(cat.totalRetailValue),
    fmtINR(cat.totalRetailValue - cat.totalCostValue),
    cat.lowStockItems,
    cat.outOfStockItems,
  ]);

  doc.autoTable({
    startY: y,
    head: [['Category', 'Products', 'Total Qty', 'Cost Value', 'Retail Value', 'Profit', 'Low Stock', 'Out of Stock']],
    body: tableData,
    foot: [[
      'TOTAL', totals.products, '',
      fmtINR(totals.totalCostValue),
      fmtINR(totals.totalRetailValue),
      fmtINR((totals.totalRetailValue || 0) - (totals.totalCostValue || 0)),
      totals.lowStockItems, totals.outOfStockItems,
    ]],
    theme: 'striped',
    headStyles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT },
    footStyles: { fillColor: DARK, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
    margin: { left: 14, right: 14 },
  });

  drawFooter(doc);
  doc.save(`Inventory-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// ── SALES REPORT PDF ────────────────────────────────────────────────
export const generateSalesReportPDF = (salesData, summary) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = drawHeader(doc, 'SALES REPORT');

  // Summary
  const summaryItems = [
    { label: 'Total Revenue', value: fmtINR(summary?.totalRevenue || 0), color: SUCCESS },
    { label: 'Transactions', value: summary?.totalTransactions || 0, color: PRIMARY },
    { label: 'Avg Order Value', value: fmtINR(summary?.avgOrderValue || 0), color: [14, 165, 233] },
  ];

  summaryItems.forEach((item, i) => {
    const x = 14 + i * 62;
    doc.setFillColor(...item.color);
    doc.roundedRect(x, y, 58, 18, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text(String(item.value), x + 29, y + 10, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, x + 29, y + 15, { align: 'center' });
  });

  y += 24;

  const tableData = (salesData || []).map((row) => [
    row._id,
    row.count,
    fmtINR(row.revenue),
    fmtINR(row.avgOrderValue),
  ]);

  doc.autoTable({
    startY: y,
    head: [['Date', 'Transactions', 'Revenue', 'Avg Order Value']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  drawFooter(doc);
  doc.save(`Sales-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
