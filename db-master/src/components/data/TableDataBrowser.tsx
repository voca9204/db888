import React, { useState, useEffect, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useDbConnectionStore, useSchemaStore, useTableDataStore } from '../../store';
import { Button, Card, Select, Spinner } from '../ui';
import { getTableData } from '../../firebase/functions';

interface TableDataBrowserProps {
  connectionId?: string;
  tableName?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const TableDataBrowser: React.FC<TableDataBrowserProps> = ({
  connectionId: propConnectionId,
  tableName: propTableName,
}) => {
  // Get stores
  const { getActiveConnection } = useDbConnectionStore();
  const { getSchema } = useSchemaStore();
  const {
    getActiveTableData,
    setActiveTable,
    setTableData,
    setLoading,
    setError,
    pagination,
    setPagination,
    sorting,
    setSorting,
    filters,
    activeTable,
  } = useTableDataStore();

  // Get connection ID from props or active connection
  const activeConnection = getActiveConnection();
  const connectionId = propConnectionId || activeConnection?.id;
  
  // State for table selection
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(propTableName || null);

  // Get schema data when connection changes
  useEffect(() => {
    if (!connectionId) return;
    
    const schemaData = getSchema(connectionId);
    if (schemaData?.schema?.tables) {
      const tableNames = Object.keys(schemaData.schema.tables);
      setAvailableTables(tableNames);
      
      // If we have tables and no table is selected, select the first one
      if (tableNames.length > 0 && !selectedTable) {
        setSelectedTable(tableNames[0]);
      }
    }
  }, [connectionId, getSchema, selectedTable]);

  // Update active table when selected table changes
  useEffect(() => {
    if (connectionId && selectedTable) {
      setActiveTable(connectionId, selectedTable);
    }
  }, [connectionId, selectedTable, setActiveTable]);

  // Load table data when pagination, sorting, or filters change
  useEffect(() => {
    const loadTableData = async () => {
      if (!connectionId || !selectedTable) return;

      try {
        setLoading(connectionId, selectedTable, true);
        
        // Map filters to the format expected by the API
        const apiFilters = filters.map(filter => ({
          column: filter.column,
          operator: filter.operator,
          value: filter.value,
        }));
        
        // Call the API to get table data
        const response = await getTableData(
          connectionId,
          selectedTable,
          pagination.page,
          pagination.pageSize,
          sorting.column || undefined,
          sorting.direction || undefined,
          apiFilters.length > 0 ? apiFilters : undefined
        );
        
        if (response?.data) {
          setTableData(connectionId, selectedTable, {
            rows: response.data.rows || [],
            columns: response.data.columns || [],
            total: response.data.total || 0,
            page: pagination.page,
            pageSize: pagination.pageSize,
          });
        }
      } catch (error) {
        console.error('Error loading table data:', error);
        setError(connectionId, selectedTable, error instanceof Error ? error.message : 'Failed to load table data');
      }
    };

    loadTableData();
  }, [connectionId, selectedTable, pagination, sorting, filters, setLoading, setTableData, setError]);

  // Get the active table data
  const tableData = getActiveTableData();

  // Create column definitions for the table
  const columnHelper = createColumnHelper<any>();
  const columns = useMemo(() => {
    if (!tableData?.columns?.length) return [];
    
    return tableData.columns.map(column => 
      columnHelper.accessor(column.name, {
        id: column.name,
        header: column.name,
        cell: info => {
          const value = info.getValue();
          if (value === null || value === undefined) {
            return <span className="text-gray-400 italic">NULL</span>;
          }
          
          // Format based on data type
          if (typeof value === 'object' && value instanceof Date) {
            return value.toLocaleString();
          }
          
          return String(value);
        },
        footer: info => info.column.id,
      })
    );
  }, [tableData?.columns]);

  // TanStack Table pagination state
  const [tablePageCount, setTablePageCount] = useState(0);
  
  // Create table instance
  const table = useReactTable({
    data: tableData?.rows || [],
    columns,
    state: {
      pagination: {
        pageIndex: pagination.page - 1, // TanStack Table uses 0-based indexing
        pageSize: pagination.pageSize,
      } as PaginationState,
      sorting: sorting.column ? [{
        id: sorting.column,
        desc: sorting.direction === 'desc',
      }] : [] as SortingState,
    },
    pageCount: tablePageCount,
    manualPagination: true,
    onPaginationChange: (updater) => {
      const newPagination = updater instanceof Function
        ? updater({
            pageIndex: pagination.page - 1,
            pageSize: pagination.pageSize,
          })
        : updater;
        
      setPagination(
        newPagination.pageIndex + 1, // Convert back to 1-based indexing
        newPagination.pageSize
      );
    },
    manualSorting: true,
    onSortingChange: (updater) => {
      const newSorting = updater instanceof Function
        ? updater(sorting.column ? [{
            id: sorting.column,
            desc: sorting.direction === 'desc',
          }] : [])
        : updater;
        
      if (newSorting.length > 0) {
        setSorting(
          newSorting[0].id,
          newSorting[0].desc ? 'desc' : 'asc'
        );
      } else {
        setSorting(null, null);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Update the page count when the total changes
  useEffect(() => {
    if (tableData?.total && tableData?.pageSize) {
      setTablePageCount(Math.ceil(tableData.total / tableData.pageSize));
    }
  }, [tableData?.total, tableData?.pageSize]);

  // If there's no connection, show a message
  if (!connectionId) {
    return (
      <Card title="Table Data Browser">
        <div className="text-center p-4">
          <p className="text-gray-600 dark:text-gray-300 mb-2">No connection selected.</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Please select a connection to view table data.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Table Data Browser">
      <div className="space-y-4">
        {/* Table selection */}
        <div className="flex gap-4 items-center">
          <Select
            id="tableSelect"
            label="Select Table"
            value={selectedTable || ''}
            onChange={(e) => setSelectedTable(e.target.value)}
            disabled={!connectionId || availableTables.length === 0}
            className="w-48"
          >
            <option value="" disabled>
              {availableTables.length === 0 ? 'No tables available' : 'Select a table'}
            </option>
            {availableTables.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </Select>

          {/* Reload button */}
          <Button
            variant="secondary"
            size="sm"
            disabled={!connectionId || !selectedTable || (tableData?.loading || false)}
            onClick={() => {
              if (connectionId && selectedTable) {
                setLoading(connectionId, selectedTable, true);
                // Force reload by changing pagination state slightly
                setPagination(pagination.page, pagination.pageSize);
              }
            }}
          >
            {tableData?.loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Loading...
              </>
            ) : (
              'Reload'
            )}
          </Button>
        </div>

        {/* Error message */}
        {tableData?.error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md">
            <p className="font-medium">Error loading table data</p>
            <p className="text-sm mt-1">{tableData.error}</p>
          </div>
        )}

        {/* Table */}
        <div className="border dark:border-gray-700 rounded-md overflow-auto max-h-[calc(100vh-350px)]">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
                        header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center space-x-1">
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        {header.column.getIsSorted() ? (
                          header.column.getIsSorted() === 'asc' ? (
                            <span className="text-gray-500">↑</span>
                          ) : (
                            <span className="text-gray-500">↓</span>
                          )
                        ) : header.column.getCanSort() ? (
                          <span className="text-gray-300 dark:text-gray-600">⇅</span>
                        ) : null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
              ) : tableData?.loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex justify-center items-center space-x-2">
                      <Spinner size="sm" />
                      <span>Loading data...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex justify-between items-center border-t dark:border-gray-700 pt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page
            </span>
            <span className="font-medium text-sm">
              {pagination.page} of {tablePageCount || 1}
            </span>
            <Select
              value={pagination.pageSize}
              onChange={e => {
                setPagination(1, Number(e.target.value));
              }}
              className="text-sm"
              aria-label="Rows per page"
            >
              {PAGE_SIZE_OPTIONS.map(size => (
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
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Data summary */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {tableData?.total ? (
            <p>
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, tableData.total)} of{' '}
              {tableData.total} rows
            </p>
          ) : (
            <p>No data</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TableDataBrowser;
