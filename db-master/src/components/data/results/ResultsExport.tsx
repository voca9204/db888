import React, { useState } from 'react';
import { 
  Button,
  Card,
  Select
} from '../../ui';
import { 
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

export interface ResultsExportProps {
  data?: any[];
  columns?: { name: string; type: string }[];
  filename?: string;
  onExport?: (format: string, data: any) => void;
  formats?: string[];
}

const ResultsExport: React.FC<ResultsExportProps> = ({
  data = [],
  columns = [],
  filename = `export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`,
  onExport,
  formats = ['csv', 'json', 'xlsx', 'sql']
}) => {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  
  // Helper to prepare the data based on format
  const prepareExportData = (format: string) => {
    switch (format) {
      case 'csv':
        return prepareCSV();
      case 'json':
        return prepareJSON();
      case 'sql':
        return prepareSQL();
      case 'xlsx':
        return data; // Raw data for XLSX
      default:
        return data;
    }
  };
  
  // Prepare CSV data
  const prepareCSV = () => {
    if (!data || data.length === 0 || !columns || columns.length === 0) {
      return '';
    }
    
    // Create header row
    const headers = columns.map(c => c.name).join(',');
    
    // Create data rows
    const csvRows = data.map(row => {
      return columns.map(col => {
        // Handle null values
        if (row[col.name] === null || row[col.name] === undefined) {
          return '';
        }
        
        // Quote strings to handle commas and quotes in data
        const value = String(row[col.name]);
        return `"${value.replace(/"/g, '""')}"`;
      }).join(',');
    });
    
    return [headers, ...csvRows].join('\n');
  };
  
  // Prepare JSON data
  const prepareJSON = () => {
    return JSON.stringify(data, null, 2);
  };
  
  // Prepare SQL INSERT statements
  const prepareSQL = () => {
    if (!data || data.length === 0 || !columns || columns.length === 0) {
      return '';
    }
    
    // Create table name from filename or use "exported_table"
    const tableName = filename.replace(/[^a-zA-Z0-9_]/g, '_') || 'exported_table';
    
    // Create SQL header
    let sql = `-- Export generated on ${new Date().toLocaleString()}\n\n`;
    
    // Create table structure SQL
    sql += `CREATE TABLE IF NOT EXISTS \`${tableName}\` (\n`;
    sql += columns.map(col => {
      // Map type to SQL type (simple mapping)
      let sqlType = 'VARCHAR(255)';
      if (col.type.includes('int')) sqlType = 'INT';
      else if (col.type.includes('float') || col.type.includes('double') || col.type.includes('decimal')) sqlType = 'DECIMAL(10,2)';
      else if (col.type.includes('date')) sqlType = 'DATE';
      else if (col.type.includes('datetime') || col.type.includes('timestamp')) sqlType = 'DATETIME';
      else if (col.type === 'boolean' || col.type === 'tinyint(1)') sqlType = 'BOOLEAN';
      else if (col.type.includes('text')) sqlType = 'TEXT';
      
      return `  \`${col.name}\` ${sqlType}`;
    }).join(',\n');
    sql += '\n);\n\n';
    
    // Generate INSERT statements (batched for efficiency)
    const BATCH_SIZE = 100;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      sql += `INSERT INTO \`${tableName}\` (${columns.map(c => `\`${c.name}\``).join(', ')}) VALUES\n`;
      
      sql += batch.map(row => {
        const values = columns.map(col => {
          const value = row[col.name];
          
          // Format values based on type
          if (value === null || value === undefined) {
            return 'NULL';
          } else if (typeof value === 'string') {
            return `'${value.replace(/'/g, "''")}'`;
          } else if (value instanceof Date) {
            return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
          } else {
            return String(value);
          }
        }).join(', ');
        
        return `  (${values})`;
      }).join(',\n');
      
      sql += ';\n\n';
    }
    
    return sql;
  };
  
  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const exportData = prepareExportData(selectedFormat);
      
      // If there's a custom export handler, use it
      if (onExport) {
        onExport(selectedFormat, exportData);
      } else {
        // Default export: Create a download
        let blob;
        let downloadFilename = `${filename}.${selectedFormat}`;
        
        switch (selectedFormat) {
          case 'csv':
            blob = new Blob([exportData], { type: 'text/csv;charset=utf-8;' });
            break;
          case 'json':
            blob = new Blob([exportData], { type: 'application/json;charset=utf-8;' });
            break;
          case 'sql':
            blob = new Blob([exportData], { type: 'text/plain;charset=utf-8;' });
            break;
          case 'xlsx':
            // XLSX export would require a library like ExcelJS or SheetJS
            // This is a placeholder for the actual implementation
            alert('XLSX export requires additional libraries. Please implement onExport handler.');
            setIsExporting(false);
            return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error during export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Format options
  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: TableCellsIcon },
    { value: 'json', label: 'JSON', icon: CodeBracketIcon },
    { value: 'sql', label: 'SQL', icon: DocumentTextIcon },
    { value: 'xlsx', label: 'Excel', icon: TableCellsIcon }
  ].filter(fmt => formats.includes(fmt.value));
  
  return (
    <Card title="Export Data">
      <div className="p-4 space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Export {data.length} records in your preferred format.
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {formatOptions.map(format => {
            const Icon = format.icon;
            return (
              <div
                key={format.value}
                className={`border rounded-md p-3 cursor-pointer flex flex-col items-center justify-center transition-colors ${
                  selectedFormat === format.value
                    ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-600'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
                onClick={() => setSelectedFormat(format.value)}
              >
                <Icon className="h-8 w-8 text-gray-500 dark:text-gray-400 mb-2" />
                <span className="text-sm font-medium">{format.label}</span>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting || data.length === 0}
          >
            {isExporting ? (
              <>
                <ArrowDownTrayIcon className="h-5 w-5 mr-2 animate-bounce" />
                Exporting...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ResultsExport;