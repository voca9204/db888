import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { Button, Card, Select, Spinner, Input, Tabs } from '../../ui';
import { 
  ArrowDownTrayIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  ArrowsUpDownIcon,
  ChartBarIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { DataVisualization } from '../visualization';
import { ExportButton } from '../export';

interface QueryResultsProps {
  data?: {
    columns: { name: string; type: string }[];
    rows: any[];
    total: number;
    executionTime?: number;
  };
  isLoading?: boolean;
  error?: string;
}

const QueryResults: React.FC<QueryResultsProps> = ({
  data,
  isLoading = false,
  error,
}) => {
  // View mode for results (table or visualization)
  const [viewMode, setViewMode] = useState<'table' | 'visualization'>('table');
  
  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [globalFilter, setGlobalFilter] = useState('');
  
  // Generate column definitions
  const columnHelper = createColumnHelper<any>();
  const columns = React.useMemo(() => {
    if (!data?.columns) return [];
    
    return data.columns.map(column => 
      columnHelper.accessor(column.name, {
        header: () => (
          <div className="font-semibold text-left">{column.name}</div>
        ),
        cell: info => {
          const value = info.getValue();
          
          // Display null values
          if (value === null || value === undefined) {
            return <span className="text-gray-400 italic">NULL</span>;
          }
          
          // Format dates
          if (typeof value === 'object' && value instanceof Date) {
            return value.toLocaleString();
          }
          
          // Long text truncation
          if (typeof value === 'string' && value.length > 100) {
            return (
              <div className="relative group">
                <span className="truncate block max-w-md">{value.substring(0, 100)}...</span>
                <div className="hidden group-hover:block absolute z-10 bg-white dark:bg-gray-800 p-2 border dark:border-gray-600 rounded shadow-lg max-w-lg">
                  {value}
                </div>
              </div>
            );
          }
          
          // Return as string for everything else
          return String(value);
        },
        footer: info => column.name,
        meta: {
          type: column.type
        }
      })
    );
  }, [data?.columns]);
  
  // Create table instance
  const table = useReactTable({
    data: data?.rows || [],
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    enableColumnFilters: true,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: undefined, // Use server-side filtering
    globalFilterFn: 'includesString',
  });
  
  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    table.setPageSize(newSize);
  };
  
  // Export to CSV
  const exportToCsv = () => {
    if (!data?.rows || data.rows.length === 0) return;
    
    const headers = data.columns.map(c => c.name).join(',');
    const csvRows = data.rows.map(row => {
      return data.columns.map(col => {
        // Handle null values
        if (row[col.name] === null || row[col.name] === undefined) {
          return '';
        }
        
        // Quote strings to handle commas and quotes in data
        const value = String(row[col.name]);
        return `"${value.replace(/"/g, '""')}"`;
      }).join(',');
    });
    
    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `query_result_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Toggle column visibility all at once
  const toggleAllColumns = (visible: boolean) => {
    const newState: VisibilityState = {};
    table.getAllLeafColumns().forEach(column => {
      newState[column.id] = visible;
    });
    setColumnVisibility(newState);
  };
  
  if (error) {
    return (
      <Card title="Query Results">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md">
          <p className="font-medium">Error executing query</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </Card>
    );
  }
  
  // Render the table view
  const renderTableView = () => (
    <div className="space-y-4">
      {/* Results toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center space-x-2">
          {data?.rows && data.rows.length > 0 && (
            <ExportButton
              data={{
                columns: data.columns,
                rows: data.rows
              }}
              defaultFileName={`query_result_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`}
              queryInfo={{
                executedAt: new Date(),
                duration: data.executionTime
              }}
              buttonText="Export Data"
            />
          )}
          
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toggleAllColumns(true)}
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            Show All
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toggleAllColumns(false)}
          >
            <EyeSlashIcon className="h-4 w-4 mr-1" />
            Hide All
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowFilterRow(!showFilterRow)}
          >
            <ArrowsUpDownIcon className="h-4 w-4 mr-1" />
            {showFilterRow ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={globalFilter || ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search all columns..."
            className="text-sm sm:w-64"
          />
        </div>
      </div>
      
      {/* Column visibility menu */}
      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
        <div className="text-sm font-medium mb-2">Visible Columns:</div>
        <div className="flex flex-wrap gap-2">
          {table.getAllLeafColumns().map(column => (
            <label
              key={column.id}
              className="flex items-center space-x-1 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                onChange={column.getToggleVisibilityHandler()}
                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700"
              />
              <span>{column.id}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Results table */}
      <div className="border dark:border-gray-700 rounded-md overflow-auto max-h-[500px]">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {table.getHeaderGroups().map(headerGroup => (
                headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? 'cursor-pointer select-none flex items-center gap-1'
                            : '',
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))
              ))}
            </tr>
            
            {/* Filter row */}
            {showFilterRow && (
              <tr>
                {table.getHeaderGroups().map(headerGroup => (
                  headerGroup.headers.map(header => (
                    <th
                      key={header.id + '-filter'}
                      className="px-6 py-2 bg-gray-100 dark:bg-gray-700"
                    >
                      {!header.isPlaceholder && header.column.getCanFilter() ? (
                        <Input
                          type="text"
                          value={(header.column.getFilterValue() as string) ?? ''}
                          onChange={e => header.column.setFilterValue(e.target.value)}
                          placeholder={`Filter ${header.column.id}`}
                          className="text-xs w-full"
                          size="sm"
                        />
                      ) : null}
                    </th>
                  ))
                ))}
              </tr>
            )}
          </thead>
          
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  <div className="flex justify-center items-center space-x-2">
                    <Spinner size="sm" />
                    <span>Loading results...</span>
                  </div>
                </td>
              </tr>
            ) : data?.rows && data.rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  {data ? 'No results found' : 'Execute a query to see results'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination controls */}
      {data?.rows && data.rows.length > 0 && (
        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page
            </span>
            <span className="font-medium text-sm">
              {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
            <Select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="text-sm"
              aria-label="Rows per page"
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>
                  {size} rows
                </option>
              ))}
            </Select>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
  
  // Render the visualization view
  const renderVisualizationView = () => (
    <div className="space-y-4">
      {data?.rows && data.rows.length > 0 ? (
        <DataVisualization 
          data={data.rows} 
          columns={data.columns} 
        />
      ) : (
        <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-md text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {isLoading 
              ? 'Loading results...' 
              : (data ? 'No results found' : 'Execute a query to see visualizations')}
          </p>
        </div>
      )}
    </div>
  );
  
  return (
    <Card title="Query Results">
      <div className="space-y-4">
        {/* Execution info */}
        {data?.executionTime !== undefined && (
          <div className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
            <div>
              <span className="font-medium">{data.rows?.length || 0}</span> rows returned
              {data.total > (data.rows?.length || 0) && (
                <span> (of <span className="font-medium">{data.total}</span> total)</span>
              )}
            </div>
            <div>
              Executed in <span className="font-medium">{data.executionTime.toFixed(2)}</span> ms
            </div>
          </div>
        )}
        
        {/* View mode tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-4">
            <button
              type="button"
              className={`py-2 px-1 flex items-center text-sm font-medium border-b-2 ${
                viewMode === 'table'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setViewMode('table')}
            >
              <TableCellsIcon className="h-4 w-4 mr-1" />
              Table View
            </button>
            <button
              type="button"
              className={`py-2 px-1 flex items-center text-sm font-medium border-b-2 ${
                viewMode === 'visualization'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setViewMode('visualization')}
            >
              <ChartBarIcon className="h-4 w-4 mr-1" />
              Visualization
            </button>
          </div>
        </div>
        
        {/* View content */}
        <div className="mt-4">
          {viewMode === 'table' ? renderTableView() : renderVisualizationView()}
        </div>
      </div>
    </Card>
  );
};

export default QueryResults;