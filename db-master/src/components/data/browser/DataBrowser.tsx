import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  flexRender,
  createColumnHelper,
  Row,
} from '@tanstack/react-table';

// Define types manually since they're not exported directly in the current version
type SortingState = {
  id: string;
  desc: boolean;
}[];

type ColumnFiltersState = {
  id: string;
  value: any;
}[];

type VisibilityState = {
  [key: string]: boolean;
};

type PaginationState = {
  pageIndex: number;
  pageSize: number;
};
import { getTableData } from '../../../firebase/functions.real';
import { useToast } from '../../../context/ToastContext';
import { getUserFriendlyErrorMessage, logError } from '../../../utils/errorUtils';
import { updateTableRow } from '../../../services/tableService';

// Using ColumnHelper instead of directly using ColumnDef
const columnHelper = createColumnHelper<any>();

// Column filter component
const ColumnFilter = ({ column }: any) => {
  const columnFilterValue = column.getFilterValue();

  return (
    <input
      type="text"
      value={(columnFilterValue ?? '') as string}
      onChange={e => column.setFilterValue(e.target.value)}
      placeholder={`Filter ${column.id}...`}
      className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-dark-400 dark:border-dark-600 dark:text-white"
    />
  );
};

// Types for the component props
interface DataBrowserProps {
  connectionId: string;
  tableName: string;
  className?: string;
}

// Types for the data
interface TableData {
  [key: string]: any;
}

// Main DataBrowser component
const DataBrowser: React.FC<DataBrowserProps> = ({ 
  connectionId, 
  tableName,
  className = ''
}) => {
  // State for table data and loading
  const [data, setData] = useState<TableData[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const { showToast } = useToast();
  
  // Editing states
  const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});
  const [savingRow, setSavingRow] = useState(false);
  const [primaryKeyColumn, setPrimaryKeyColumn] = useState<string | null>(null);
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
  // Handle row edit start
  const handleEditRow = useCallback((row: Row<any>) => {
    setEditingRow(row.original);
    setEditingValues({...row.original});
  }, []);
  
  // Handle edit value change
  const handleEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditingValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);
  
  // Save edited row
  const handleSaveRow = useCallback(async () => {
    if (!editingRow || !primaryKeyColumn) return;
    
    setSavingRow(true);
    
    try {
      const primaryKeyValue = editingRow[primaryKeyColumn];
      
      const result = await updateTableRow(
        connectionId,
        tableName,
        primaryKeyColumn,
        primaryKeyValue,
        editingValues
      );
      
      if (result.success) {
        // Update local data
        setData(prev => prev.map(row => 
          row[primaryKeyColumn] === primaryKeyValue ? editingValues : row
        ));
        
        showToast('행이 성공적으로 업데이트되었습니다.', 'success');
        setEditingRow(null);
      } else {
        showToast(`행 업데이트 실패: ${result.message}`, 'error');
      }
    } catch (err) {
      const errorMessage = getUserFriendlyErrorMessage(err);
      logError(err, 'handleSaveRow');
      showToast(`행 업데이트 실패: ${errorMessage}`, 'error');
    } finally {
      setSavingRow(false);
    }
  }, [connectionId, tableName, primaryKeyColumn, editingRow, editingValues, showToast]);
  
  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingRow(null);
    setEditingValues({});
  }, []);
  
  // Fetch data from the server
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Calculate pagination parameters
        const page = pagination.pageIndex + 1; // API is 1-indexed
        const pageSize = pagination.pageSize;
        
        // Get sort parameters
        const sortColumn = sorting.length > 0 ? sorting[0].id : undefined;
        const sortDirection = sorting.length > 0 
          ? (sorting[0].desc ? 'desc' : 'asc') 
          : undefined;
        
        // Convert column filters to API format
        const filters = columnFilters.map(filter => ({
          column: filter.id,
          operator: 'contains', // Default operator
          value: filter.value,
        }));
        
        // Fetch the data
        const result = await getTableData(
          connectionId,
          tableName,
          page,
          pageSize,
          sortColumn,
          sortDirection as 'asc' | 'desc' | undefined,
          filters
        );
        
        if (!result.data) {
          throw new Error('서버로부터 유효하지 않은 응답이 왔습니다.');
        }
        
        const tableData = result.data.rows || [];
        const total = result.data.total || 0;
        
        // Set the data
        setData(tableData);
        setTotalRows(total);
        
        // Generate columns from the first row if we have data
        if (tableData.length > 0) {
          const firstRow = tableData[0];
          
          // Try to identify primary key column
          // We'll consider columns with "id" in their name as potential primary keys
          const potentialPrimaryKeys = Object.keys(firstRow).filter(key => 
            key.toLowerCase() === 'id' || 
            key.toLowerCase().endsWith('_id') || 
            key.toLowerCase().endsWith('id')
          );
          
          // Set the first potential primary key as the primary key
          if (potentialPrimaryKeys.length > 0) {
            setPrimaryKeyColumn(potentialPrimaryKeys[0]);
          } else {
            // If no potential primary key, use the first column
            setPrimaryKeyColumn(Object.keys(firstRow)[0]);
          }
          
          const generatedColumns = Object.keys(firstRow).map(key => 
            columnHelper.accessor(key, {
              header: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize first letter
              cell: info => {
                const row = info.row;
                const columnId = info.column.id;
                const value = info.getValue();
                
                // If this row is being edited, render an input for this cell
                if (editingRow && row.original === editingRow) {
                  return (
                    <input
                      name={columnId}
                      value={editingValues[columnId] ?? ''}
                      onChange={handleEditChange}
                      className="w-full px-2 py-1 border rounded"
                      disabled={columnId === primaryKeyColumn} // Don't allow editing primary key
                    />
                  );
                }
                
                // Format dates
                if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                  return new Date(value).toLocaleString();
                }
                
                // Handle null or undefined
                if (value === null || value === undefined) {
                  return '<null>';
                }
                
                // Handle boolean values
                if (typeof value === 'boolean') {
                  return value ? 'Yes' : 'No';
                }
                
                // Return value as string
                return String(value);
              },
              footer: props => props.column.id,
              enableSorting: true,
              enableColumnFilter: true,
            })
          );
          
          setColumns(generatedColumns);
        } else {
          // Clear columns if no data
          setColumns([]);
          showToast(`"${tableName}" 테이블에 데이터가 없습니다.`, 'info');
        }
      } catch (err) {
        const errorMessage = getUserFriendlyErrorMessage(err);
        logError(err, 'DataBrowser.fetchData');
        setError(errorMessage);
        showToast(`테이블 데이터를 가져오는데 실패했습니다: ${errorMessage}`, 'error');
        setData([]);
        setTotalRows(0);
        setColumns([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [connectionId, tableName, pagination, sorting, columnFilters, showToast]);
  
  // Memoize the table instance
  const table = useReactTable({
    data,
    columns: useMemo(() => columns, [columns]),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true, // We're handling pagination on the server
    pageCount: Math.ceil(totalRows / pagination.pageSize),
    debugTable: process.env.NODE_ENV === 'development',
  });
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold dark:text-white">
          {tableName} Data
        </h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => table.setColumnVisibility({})}
            className="px-3 py-1 bg-secondary-500 text-white rounded hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-secondary-400"
          >
            모든 컬럼 표시
          </button>
          
          <button
            onClick={() => {
              const hiddenColumns = Object.fromEntries(
                table.getAllLeafColumns().map(column => [column.id, false])
              );
              table.setColumnVisibility(hiddenColumns);
            }}
            className="px-3 py-1 bg-secondary-500 text-white rounded hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-secondary-400"
          >
            모든 컬럼 숨기기
          </button>
          
          <button
            onClick={() => {
              // Generate CSV
              try {
                const headers = table.getFlatHeaders().map(header => header.column.id);
                const rows = table.getRowModel().rows.map(row => 
                  row.getVisibleCells().map(cell => String(cell.getValue() ?? ''))
                );
                
                const csv = [
                  headers.join(','),
                  ...rows.map(row => row.join(','))
                ].join('\n');
                
                // Download CSV
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `${tableName}_export.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showToast('CSV 파일이 다운로드되었습니다.', 'success');
              } catch (err) {
                const errorMessage = getUserFriendlyErrorMessage(err);
                logError(err, 'DataBrowser.exportCSV');
                showToast(`CSV 내보내기에 실패했습니다: ${errorMessage}`, 'error');
              }
            }}
            className="px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            CSV 내보내기
          </button>
        </div>
      </div>
      
      {/* Global filter */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search all columns..."
          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-dark-400 dark:border-dark-600 dark:text-white"
          onChange={e => {
            // Apply global filter to all columns
            table.getAllLeafColumns().forEach(column => {
              if (column.getCanFilter()) {
                column.setFilterValue(e.target.value);
              }
            });
          }}
        />
      </div>
      
      {/* Loading and error states */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-danger-100 text-danger-800 p-4 rounded mb-4 dark:bg-danger-900 dark:text-danger-200">
          <p className="font-medium">오류가 발생했습니다:</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-600">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
          <thead className="bg-gray-50 dark:bg-dark-500">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div>
                        <div
                          className={`cursor-pointer flex items-center space-x-1 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span>{flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}</span>
                          
                          {/* Sort icons */}
                          <span>
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted() as string] ?? ' '}
                          </span>
                        </div>
                        
                        {/* Column visibility toggle */}
                        <div className="mt-2">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              checked={header.column.getIsVisible()}
                              onChange={header.column.getToggleVisibilityHandler()}
                            />
                            <span className="ml-2 text-xs">표시</span>
                          </label>
                        </div>
                        
                        {/* Column filters */}
                        {header.column.getCanFilter() ? (
                          <div className="mt-2">
                            <ColumnFilter column={header.column} />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            ))}
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-400 dark:divide-dark-600">
            {table.getRowModel().rows.map(row => (
              <tr 
                key={row.id}
                className={`hover:bg-gray-50 dark:hover:bg-dark-500 ${
                  row.getIsSelected() ? 'bg-primary-50 dark:bg-primary-900' : ''
                }`}
              >
                {row.getVisibleCells().map(cell => (
                  <td 
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {editingRow === row.original ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveRow}
                        disabled={savingRow}
                        className="text-green-500 hover:text-green-700"
                      >
                        {savingRow ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={savingRow}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditRow(row)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      편집
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          
          {/* Footer */}
          <tfoot className="bg-gray-50 dark:bg-dark-500">
            {table.getFooterGroups().map(footerGroup => (
              <tr key={footerGroup.id}>
                {footerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      flexRender(
                        header.column.columnDef.footer,
                        header.getContext()
                      )
                    )}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            ))}
          </tfoot>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center">
          <span className="text-sm text-gray-700 dark:text-gray-200">
            페이지 {' '}
            <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> / {' '}
            <span className="font-medium">{table.getPageCount()}</span>
            {' '} | 표시: {' '}
            <span className="font-medium">{pagination.pageSize}</span> / {' '}
            <span className="font-medium">{totalRows}</span> 행
          </span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className={`px-3 py-1 rounded border border-gray-300 dark:border-dark-600 ${
              !table.getCanPreviousPage() 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-100 dark:hover:bg-dark-500'
            }`}
          >
            {'<<'}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={`px-3 py-1 rounded border border-gray-300 dark:border-dark-600 ${
              !table.getCanPreviousPage() 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-100 dark:hover:bg-dark-500'
            }`}
          >
            {'<'}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={`px-3 py-1 rounded border border-gray-300 dark:border-dark-600 ${
              !table.getCanNextPage() 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-100 dark:hover:bg-dark-500'
            }`}
          >
            {'>'}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className={`px-3 py-1 rounded border border-gray-300 dark:border-dark-600 ${
              !table.getCanNextPage() 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-100 dark:hover:bg-dark-500'
            }`}
          >
            {'>>'}
          </button>
          
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value));
            }}
            className="px-3 py-1 rounded border border-gray-300 dark:border-dark-600 dark:bg-dark-400 dark:text-white"
          >
            {[10, 25, 50, 100].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize}행 표시
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DataBrowser;
