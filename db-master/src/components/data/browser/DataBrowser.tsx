import React, { useState, useMemo, useEffect } from 'react';
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
import { getTableData } from '@firebase/functions';

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
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
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
        
        const tableData = result?.data?.rows || [];
        const total = result?.data?.total || 0;
        
        // Set the data
        setData(tableData);
        setTotalRows(total);
        
        // Generate columns from the first row if we have data
        if (tableData.length > 0) {
          const firstRow = tableData[0];
          const generatedColumns = Object.keys(firstRow).map(key => 
            columnHelper.accessor(key, {
              header: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize first letter
              cell: info => {
                const value = info.getValue();
                
                // Format dates
                if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                  return new Date(value).toLocaleString();
                }
                
                // Return value as string
                return String(value ?? '');
              },
              footer: props => props.column.id,
              enableSorting: true,
              enableColumnFilter: true,
            })
          );
          
          setColumns(generatedColumns);
        }
      } catch (err) {
        console.error('Error fetching table data:', err);
        setError('Failed to fetch table data. Please try again.');
        setData([]);
        setTotalRows(0);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [connectionId, tableName, pagination, sorting, columnFilters]);
  
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
            Show All Columns
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
            Hide All Columns
          </button>
          
          <button
            onClick={() => {
              // Generate CSV
              const headers = table.getFlatHeaders().map(header => header.column.id);
              const rows = table.getRowModel().rows.map(row => 
                row.getVisibleCells().map(cell => String(cell.getValue()))
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
            }}
            className="px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            Export CSV
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
        <div className="bg-danger-100 text-danger-800 p-4 rounded mb-4">
          {error}
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
                            <span className="ml-2 text-xs">Show</span>
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
              </tr>
            ))}
          </tfoot>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center">
          <span className="text-sm text-gray-700 dark:text-gray-200">
            Page {' '}
            <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> of{' '}
            <span className="font-medium">{table.getPageCount()}</span>
            {' '} | Showing {' '}
            <span className="font-medium">{pagination.pageSize}</span> of{' '}
            <span className="font-medium">{totalRows}</span> rows
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
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DataBrowser;
