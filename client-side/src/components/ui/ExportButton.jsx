import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Button from './Button';
import { useToast } from '@/context/ToastContext';

/**
 * ExportButton — A premium, reusable utility to export JSON data to Excel (.xlsx).
 * 
 * @param {Array} data - The array of objects to export.
 * @param {string} filename - Desired filename (without extension).
 * @param {string} sheetName - Name of the worksheet.
 * @param {Array} columns - Optional array of column definitions [{ header: 'Name', key: 'name' }].
 */
export default function ExportButton({ data, filename = 'report', sheetName = 'Sheet1', columns, ...props }) {
  const { showToast } = useToast();

  const handleExport = () => {
    if (!data || data.length === 0) {
      showToast('No data available to export', 'error');
      return;
    }

    try {
      // 1. Prepare data based on columns or raw data
      let processedData;
      if (columns && columns.length > 0) {
        processedData = data.map(item => {
          const row = {};
          columns.forEach(col => {
            row[col.header] = item[col.key] ?? '—';
          });
          return row;
        });
      } else {
        processedData = data;
      }

      // 2. Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(processedData);
      
      // 3. Auto-calculate column widths for better "Nini" presentation
      const objectMaxLength = [];
      processedData.forEach((row) => {
        Object.keys(row).forEach((key, i) => {
          const value = row[key] ? row[key].toString() : '';
          const length = value.length > key.length ? value.length : key.length;
          objectMaxLength[i] = objectMaxLength[i] > length ? objectMaxLength[i] : length;
        });
      });
      worksheet['!cols'] = objectMaxLength.map((w) => ({ width: w + 2 }));

      // 4. Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // 5. Trigger download
      XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      showToast('Report exported successfully!', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Failed to export report', 'error');
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleExport}
      leftIcon={<Download size={16} />}
      className="shrink-0"
      {...props}
    >
      Export Report
    </Button>
  );
}
