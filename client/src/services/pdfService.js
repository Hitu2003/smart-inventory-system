import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

const addHeader = (doc, title) => {
  // Header background
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SmartInventory Pro', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 20);

  doc.setTextColor(200, 200, 255);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 210 - 14, 20, { align: 'right' });

  doc.setTextColor(0, 0, 0);
};

const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    doc.text('SmartInventory Pro - Confidential', 14, 290);
  }
};

export const generateInvoicePDF = (transaction) => {
  const doc = new jsPDF();
  addHeader(doc, 'INVOICE');

  // Invoice details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('Invoice Details', 14, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const details = [
    ['Invoice No:', transaction.transactionNumber],
    ['Date:', format(new Date(transaction.createdAt), 'PPP')],
    ['Type:', transaction.type?.toUpperCase()],
    ['Status:', transaction.status?.toUpperCase()],
    ['Payment:', transaction.paymentMethod?.replace('_', ' ').toUpperCase()],
  ];

  details.forEach(([label, value], i) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, 46 + i * 7);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', 55, 46 + i * 7);
  });

  // Supplier/Customer info
  if (transaction.supplier) {
    doc.setFont('helvetica', 'bold');
    doc.text('Supplier:', 120, 46);
    doc.setFont('helvetica', 'normal');
    doc.text(transaction.supplier.name || '-', 120, 53);
    doc.text(transaction.supplier.email || '', 120, 60);
    doc.text(transaction.supplier.phone || '', 120, 67);
  }

  if (transaction.customer?.name) {
    doc.setFont('helvetica', 'bold');
    doc.text('Customer:', 120, 46);
    doc.setFont('helvetica', 'normal');
    doc.text(transaction.customer.name, 120, 53);
    doc.text(transaction.customer.email || '', 120, 60);
    doc.text(transaction.customer.phone || '', 120, 67);
  }

  // Items table
  const tableData = transaction.items?.map((item) => [
    item.product?.name || 'Unknown',
    item.product?.sku || '-',
    item.quantity,
    `$${item.unitPrice?.toFixed(2)}`,
    `$${item.totalPrice?.toFixed(2)}`,
  ]) || [];

  doc.autoTable({
    startY: 90,
    head: [['Product', 'SKU', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  const totals = [
    ['Subtotal:', `$${transaction.totalAmount?.toFixed(2)}`],
    ['Discount:', `-$${transaction.discount?.toFixed(2) || '0.00'}`],
    ['Tax:', `+$${transaction.tax?.toFixed(2) || '0.00'}`],
    ['NET TOTAL:', `$${transaction.netAmount?.toFixed(2)}`],
  ];

  totals.forEach(([label, value], i) => {
    const isLast = i === totals.length - 1;
    if (isLast) {
      doc.setFillColor(99, 102, 241);
      doc.rect(130, finalY + i * 8 - 5, 66, 9, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(80, 80, 80);
    }
    doc.setFont('helvetica', isLast ? 'bold' : 'normal');
    doc.setFontSize(isLast ? 10 : 9);
    doc.text(label, 135, finalY + i * 8);
    doc.text(value, 192, finalY + i * 8, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  });

  if (transaction.notes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, finalY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(transaction.notes, 14, finalY + 17);
  }

  addFooter(doc);
  doc.save(`invoice-${transaction.transactionNumber}.pdf`);
};

export const generateInventoryReportPDF = (reportData) => {
  const doc = new jsPDF();
  addHeader(doc, 'INVENTORY VALUATION REPORT');

  const tableData = reportData.categories?.map((cat) => [
    cat._id || 'Uncategorized',
    cat.products,
    cat.totalQuantity,
    `$${cat.totalCostValue?.toFixed(2)}`,
    `$${cat.totalRetailValue?.toFixed(2)}`,
    cat.lowStockItems,
    cat.outOfStockItems,
  ]) || [];

  doc.autoTable({
    startY: 35,
    head: [['Category', 'Products', 'Total Qty', 'Cost Value', 'Retail Value', 'Low Stock', 'Out of Stock']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    foot: [[
      'TOTAL',
      reportData.totals?.products,
      '',
      `$${reportData.totals?.totalCostValue?.toFixed(2)}`,
      `$${reportData.totals?.totalRetailValue?.toFixed(2)}`,
      reportData.totals?.lowStockItems,
      reportData.totals?.outOfStockItems,
    ]],
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
  });

  addFooter(doc);
  doc.save(`inventory-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateSalesReportPDF = (salesData, summary) => {
  const doc = new jsPDF();
  addHeader(doc, 'SALES REPORT');

  // Summary boxes
  const summaryItems = [
    { label: 'Total Revenue', value: `$${summary?.totalRevenue?.toFixed(2) || '0.00'}` },
    { label: 'Transactions', value: summary?.totalTransactions || 0 },
    { label: 'Avg Order Value', value: `$${summary?.avgOrderValue?.toFixed(2) || '0.00'}` },
  ];

  summaryItems.forEach((item, i) => {
    const x = 14 + i * 62;
    doc.setFillColor(248, 250, 252);
    doc.rect(x, 35, 58, 20, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(item.label, x + 4, 43);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text(String(item.value), x + 4, 51);
    doc.setFont('helvetica', 'normal');
  });

  const tableData = salesData?.map((row) => [
    row._id,
    row.count,
    `$${row.revenue?.toFixed(2)}`,
    `$${row.avgOrderValue?.toFixed(2)}`,
  ]) || [];

  doc.autoTable({
    startY: 62,
    head: [['Date', 'Transactions', 'Revenue', 'Avg Order']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  addFooter(doc);
  doc.save(`sales-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
