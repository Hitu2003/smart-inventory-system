/**
 * Export Service — CSV, Excel, PDF helpers
 */

/**
 * Export data to CSV file
 * @param {Array} data - Array of row objects
 * @param {string} filename - Output filename (without extension)
 * @param {Array} columns - [{key: 'nested.key', label: 'Column Header'}]
 */
export const exportToCSV = (data, filename, columns) => {
  const headers = columns.map((c) => `"${c.label}"`).join(',');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        // Support nested keys like 'price.selling'
        const val = c.key.split('.').reduce((o, k) => (o != null ? o[k] : ''), row) ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export data to Excel file using SheetJS (xlsx)
 * @param {Array} data - Array of row objects
 * @param {string} filename - Output filename (without extension)
 * @param {string} sheetName - Sheet tab name
 * @param {Array} columns - Optional [{key, label}] for column mapping
 */
export const exportToExcel = async (data, filename, sheetName = 'Sheet1', columns = null) => {
  try {
    const XLSX = await import('xlsx');

    let worksheetData;
    if (columns) {
      // Build rows from column definitions
      const headers = columns.map((c) => c.label);
      const rows = data.map((row) =>
        columns.map((c) => {
          const val = c.key.split('.').reduce((o, k) => (o != null ? o[k] : ''), row) ?? '';
          return val;
        })
      );
      worksheetData = [headers, ...rows];
    } else {
      worksheetData = data;
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Auto-size columns
    const colWidths = worksheetData[0]?.map((_, colIdx) => ({
      wch: Math.max(
        ...worksheetData.map((row) => String(row[colIdx] ?? '').length),
        10
      ),
    }));
    if (colWidths) worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (err) {
    console.error('Excel export failed:', err);
    throw err;
  }
};
