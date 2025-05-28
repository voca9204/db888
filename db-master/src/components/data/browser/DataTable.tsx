import React, { useState } from 'react';
import DataBrowser from './DataBrowser';
import { useToast } from '../../../context/ToastContext';

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
  const { showToast } = useToast();
  
  return (
    <div className={className}>
      <div className="mb-6">
        <label htmlFor="table-select" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          테이블 선택
        </label>
        <div className="flex space-x-4">
          <select
            id="table-select"
            value={selectedTable || ''}
            onChange={e => {
              setSelectedTable(e.target.value);
              showToast(`"${e.target.value}" 테이블을 선택했습니다.`, 'info');
            }}
            className="block w-full md:w-64 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-dark-400 dark:border-dark-600 dark:text-white"
          >
            {tables.map(table => (
              <option key={table.name} value={table.name}>
                {table.name} ({table.rowCount}행)
              </option>
            ))}
          </select>
          
          <div className="flex-1"></div>
          
          <button
            onClick={() => {
              // Open SQL Query interface
              showToast('SQL 쿼리 기능은 향후 릴리스에서 구현될 예정입니다.', 'info');
            }}
            className="px-4 py-2 bg-secondary-500 text-white rounded hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-secondary-400 flex items-center space-x-2"
          >
            <span>커스텀 SQL 쿼리</span>
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
          선택된 테이블이 없거나 테이블을 찾을 수 없습니다.
        </div>
      )}
    </div>
  );
};

export default DataTable;
