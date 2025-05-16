import React, { useState } from 'react';
import DataBrowser from './DataBrowser';

interface DataTableProps {
  connectionId: string;
  tables: { name: string; rowCount: number }[];
  className?: string;
}

const DataTable: React.FC<DataTableProps> = ({ 
  connectionId, 
  tables,
  className = ''
}) => {
  const [selectedTable, setSelectedTable] = useState<string | null>(
    tables.length > 0 ? tables[0].name : null
  );
  
  return (
    <div className={className}>
      <div className="mb-6">
        <label htmlFor="table-select" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Select Table
        </label>
        <div className="flex space-x-4">
          <select
            id="table-select"
            value={selectedTable || ''}
            onChange={e => setSelectedTable(e.target.value)}
            className="block w-full md:w-64 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-400 dark:border-dark-600 dark:text-white"
          >
            {tables.map(table => (
              <option key={table.name} value={table.name}>
                {table.name} ({table.rowCount} rows)
              </option>
            ))}
          </select>
          
          <div className="flex-1"></div>
          
          <button
            onClick={() => {
              // Open SQL Query interface
              alert('SQL Query feature will be implemented in future releases');
            }}
            className="px-4 py-2 bg-secondary-500 text-white rounded hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-secondary-400 flex items-center space-x-2"
          >
            <span>Custom SQL Query</span>
          </button>
        </div>
      </div>
      
      {selectedTable ? (
        <DataBrowser 
          connectionId={connectionId} 
          tableName={selectedTable} 
        />
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-md dark:bg-dark-400 dark:text-white">
          No table selected or no tables available.
        </div>
      )}
    </div>
  );
};

export default DataTable;
