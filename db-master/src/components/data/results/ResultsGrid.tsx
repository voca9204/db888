import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ColumnResizeMode,
  ColumnDef,
  ColumnPinningState,
  RowSelectionState,
  Column,
  Table as TableInstance,
  RowData,
} from '@tanstack/react-table';
import { Button, Card, Select, Spinner, Input, Badge } from '../../ui';
import { 
  ArrowDownTrayIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  ArrowsUpDownIcon,
  AdjustmentsHorizontalIcon,
  DocumentDuplicateIcon,
  ArrowsRightLeftIcon,
  PaperClipIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { getCellRenderer } from './CellRenderers';

// A generic interface for filters to use with various data types
interface FilterProps<T> {
  column: Column<T, unknown>;
  table: TableInstance<T>;
}

// Text filter component
function TextFilter<T>({ column, table }: FilterProps<T>) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);

  const columnFilterValue = column.getFilterValue();

  return (
    <Input
      type="text"
      value={(columnFilterValue ?? '') as string}
      onChange={e => column.setFilterValue(e.target.value)}
      placeholder={`Search...`}
      className="w-full text-xs"
      size="sm"
    />
  );
}

// Numeric filter component
function NumberFilter<T>({ column, table }: FilterProps<T>) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);

  const columnFilterValue = column.getFilterValue() as [number, number];

  const min = useMemo(() => 
    (table.getColumn(column.id)?.getFacetedMinMaxValues()?.[0] as number) ?? 0,
    [table, column.id]
  );
  
  const max = useMemo(() => 
    (table.getColumn(column.id)?.getFacetedMinMaxValues()?.[1] as number) ?? 100,
    [table, column.id]
  );

  return (
    <div className="flex gap-1 text-xs">
      <Input
        type="number"
        min={min}
        max={max}
        value={columnFilterValue?.[0] ?? ''}
        onChange={e => 
          column.setFilterValue((old: [number, number]) => [
            e.target.value ? parseInt(e.target.value) : undefined,
            old?.[1],
          ])
        }
        placeholder={`Min`}
        className="w-16 text-xs"
        size="sm"
      />
      <Input
        type="number"
        min={min}
        max={max}
        value={columnFilterValue?.[1] ?? ''}
        onChange={e => 
          column.setFilterValue((old: [number, number]) => [
            old?.[0],
            e.target.value ? parseInt(e.target.value) : undefined,
          ])
        }
        placeholder={`Max`}
        className="w-16 text-xs"
        size="sm"
      />
    </div>
  );
}

// Date filter component
function DateFilter<T>({ column, table }: FilterProps<T>) {
  const columnFilterValue = column.getFilterValue() as [string, string];

  return (
    <div className="flex gap-1 text-xs">
      <Input
        type="date"
        value={columnFilterValue?.[0] ?? ''}
        onChange={e => 
          column.setFilterValue((old: [string, string]) => [
            e.target.value,
            old?.[1],
          ])
        }
        className="w-full text-xs"
        size="sm"
      />
      <Input
        type="date"
        value={columnFilterValue?.[1] ?? ''}
        onChange={e => 
          column.setFilterValue((old: [string, string]) => [
            old?.[0],
            e.target.value,
          ])
        }
        className="w-full text-xs"
        size="sm"
      />
    </div>
  );
}

// Select filter component (for enum values or categories)
function SelectFilter<T>({ column, table }: FilterProps<T>) {
  const options = useMemo(() => {
    const facetedUniqueValues = column.getFacetedUniqueValues();
    return Array.from(facetedUniqueValues.keys()).sort();
  }, [column]);

  const columnFilterValue = column.getFilterValue() as string;

  return (
    <Select
      value={columnFilterValue ?? ''}
      onChange={e => column.setFilterValue(e.target.value)}
      className="text-xs w-full"
      size="sm"
    >
      <option value="">All</option>
      {options.map((option, i) => (
        <option key={i} value={option}>
          {String(option)}
        </option>
      ))}
    </Select>
  );
}

// Boolean filter component
function BooleanFilter<T>({ column, table }: FilterProps<T>) {
  const columnFilterValue = column.getFilterValue();

  return (
    <Select
      value={columnFilterValue === undefined ? '' : String(columnFilterValue)}
      onChange={e => {
        const value = e.target.value;
        column.setFilterValue(
          value === '' 
            ? undefined 
            : value === 'true' 
              ? true 
              : false
        );
      }}
      className="text-xs w-full"
      size="sm"
    >
      <option value="">All</option>
      <option value="true">Yes</option>
      <option value="false">No</option>
    </Select>
  );
}

// Data formatting functions for different types
const formatters = {
  date: (value: any) => {
    if (!value) return '';
    if (value instanceof Date) return value.toLocaleDateString();
    try {
      return new Date(value).toLocaleDateString();
    } catch (e) {
      return String(value);
    }
  },
  
  datetime: (value: any) => {
    if (!value) return '';
    if (value instanceof Date) return value.toLocaleString();
    try {
      return new Date(value).toLocaleString();
    } catch (e) {
      return String(value);
    }
  },
  
  number: (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      // Format numbers with thousands separators
      return value.toLocaleString(undefined, { maximumFractionDigits: 10 });
    }
    return String(value);
  },
  
  boolean: (value: any) => {
    if (value === null || value === undefined) return '';
    return value ? 'Yes' : 'No';
  },
  
  // Default formatter for string and other types
  default: (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
};

// Types for cell highlighting
interface HighlightCondition {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'empty' | 'not-empty';
  value: any;
  color: string; // Tailwind color class like 'bg-red-100'
}

// Main component props
interface ResultsGridProps {
  data?: {
    columns: { name: string; type: string }[];
    rows: any[];
    total: number;
    executionTime?: number;
  };
  isLoading?: boolean;
  error?: string;
  onRowClick?: (row: any) => void;
  highlightConditions?: HighlightCondition[];
  enabledFeatures?: {
    columnResizing?: boolean;
    columnFiltering?: boolean;
    rowSelection?: boolean;
    columnPinning?: boolean;
    export?: boolean;
    globalFilter?: boolean;
    pagination?: boolean;
    rowHighlighting?: boolean;
  };
}

// Function to determine the filter component for a column based on its type
function getFilterComponentForType(type: string) {
  const lowerType = type.toLowerCase();
  
  if (
    lowerType.includes('int') || 
    lowerType.includes('decimal') || 
    lowerType.includes('float') || 
    lowerType.includes('double') || 
    lowerType.includes('numeric')
  ) {
    return NumberFilter;
  } else if (
    lowerType === 'date' || 
    lowerType.includes('datetime') || 
    lowerType.includes('timestamp')
  ) {
    return DateFilter;
  } else if (
    lowerType === 'boolean' || 
    lowerType === 'tinyint(1)'
  ) {
    return BooleanFilter;
  } else if (
    lowerType.includes('enum') || 
    lowerType.includes('set')
  ) {
    return SelectFilter;
  } else {
    return TextFilter;
  }
}

// Function to determine the formatter for a column based on its type
function getFormatterForType(type: string) {
  const lowerType = type.toLowerCase();
  
  if (lowerType === 'date') {
    return formatters.date;
  } else if (
    lowerType.includes('datetime') || 
    lowerType.includes('timestamp')
  ) {
    return formatters.datetime;
  } else if (
    lowerType.includes('int') || 
    lowerType.includes('decimal') || 
    lowerType.includes('float') || 
    lowerType.includes('double') || 
    lowerType.includes('numeric')
  ) {
    return formatters.number;
  } else if (
    lowerType === 'boolean' || 
    lowerType === 'tinyint(1)'
  ) {
    return formatters.boolean;
  } else {
    return formatters.default;
  }
}

// Helper for checking if a value matches a highlight condition
function matchesCondition(value: any, condition: HighlightCondition): boolean {
  const { operator, value: conditionValue } = condition;
  
  if (value === null || value === undefined) {
    if (operator === 'empty') return true;
    if (operator === 'not-empty') return false;
    return false;
  }
  
  switch (operator) {
    case 'eq':
      return value === conditionValue;
    case 'neq':
      return value !== conditionValue;
    case 'gt':
      return value > conditionValue;
    case 'gte':
      return value >= conditionValue;
    case 'lt':
      return value < conditionValue;
    case 'lte':
      return value <= conditionValue;
    case 'contains':
      return String(value).includes(String(conditionValue));
    case 'empty':
      return value === '' || value === null || value === undefined;
    case 'not-empty':
      return value !== '' && value !== null && value !== undefined;
    default:
      return false;
  }
}

// Main component
const ResultsGrid: React.FC<ResultsGridProps> = ({
  data,
  isLoading = false,
  error,
  onRowClick,
  highlightConditions = [],
  enabledFeatures = {
    columnResizing: true,
    columnFiltering: true,
    rowSelection: true,
    columnPinning: true,
    export: true,
    globalFilter: true,
    pagination: true,
    rowHighlighting: true,
  },
}) => {
  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: []
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnResizeMode, setColumnResizeMode] = useState<ColumnResizeMode>('onChange');
  const [detailRow, setDetailRow] = useState<number | null>(null);
  
  // Ref for table element (for copying to clipboard)
  const tableRef = useRef<HTMLTableElement>(null);
  
  // Generate column definitions
  const columnHelper = createColumnHelper<any>();
  
  // Define columns with proper typing and features
  const columns = useMemo(() => {
    if (!data?.columns) return [];
    
    const result: ColumnDef<any, any>[] = [];
    
    // Add row selection column if enabled
    if (enabledFeatures.rowSelection) {
      result.push({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="rounded border-gray-300 text-primary-600 shadow-sm focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-gray-300 text-primary-600 shadow-sm focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700"
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
        size: 40,
      });
    }
    
    // Create columns from data
    data.columns.forEach(column => {
      const formatter = getFormatterForType(column.type);
      const filterComponent = getFilterComponentForType(column.type);
      
      result.push(
        columnHelper.accessor(column.name, {
          header: () => (
            <div className="font-semibold text-left truncate" title={column.name}>
              {column.name}
            </div>
          ),
          cell: info => {
            const value = info.getValue();
            const columnType = (column.type || '').toLowerCase();
            
            // Use custom cell renderers
            return getCellRenderer(value, columnType);
          },
          footer: info => column.name,
          filterFn: (row, columnId, filterValue) => {
            const value = row.getValue(columnId);
            
            // Handle different filter types
            if (Array.isArray(filterValue)) {
              // Range filter for numbers and dates
              const [min, max] = filterValue;
              
              if (min !== undefined && max !== undefined) {
                return value >= min && value <= max;
              } else if (min !== undefined) {
                return value >= min;
              } else if (max !== undefined) {
                return value <= max;
              }
              return true;
            } else if (typeof filterValue === 'string') {
              // Text filter
              if (!filterValue) return true;
              return String(value).toLowerCase().includes(filterValue.toLowerCase());
            } else if (typeof filterValue === 'boolean') {
              // Boolean filter
              return value === filterValue;
            }
            
            return true;
          },
          meta: {
            type: column.type,
            filterComponent,
          },
        })
      );
    });
    
    return result;
  }, [data?.columns, enabledFeatures.rowSelection]);
  
  // Create table instance
  const table = useReactTable({
    data: data?.rows || [],
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      columnPinning,
      rowSelection,
    },
    enableColumnFilters: true,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onColumnPinningChange: setColumnPinning,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: false, // We're using client-side pagination for now
    debugTable: process.env.NODE_ENV === 'development',
    columnResizeMode,
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
    
    // Get visible columns only
    const visibleColumns = table.getVisibleLeafColumns().map(col => col.id);
    
    // If we have selected rows, export only those, otherwise export all
    const rowsToExport = Object.keys(rowSelection).length > 0
      ? table.getSelectedRowModel().rows
      : table.getFilteredRowModel().rows;
    
    // Create header row
    const headers = visibleColumns
      .filter(colId => colId !== 'select') // Skip selection column
      .join(',');
    
    // Create data rows
    const csvRows = rowsToExport.map(row => {
      return visibleColumns
        .filter(colId => colId !== 'select') // Skip selection column
        .map(colId => {
          const value = row.getValue(colId);
          // Handle null values
          if (value === null || value === undefined) {
            return '';
          }
          
          // Quote strings to handle commas and quotes in data
          const strValue = String(value);
          return `"${strValue.replace(/"/g, '""')}"`;
        })
        .join(',');
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
  
  // Copy to clipboard
  const copyToClipboard = () => {
    if (!tableRef.current) return;
    
    // Create a selection range
    const range = document.createRange();
    range.selectNode(tableRef.current);
    
    // Clear any existing selections
    window.getSelection()?.removeAllRanges();
    
    // Add the new range
    window.getSelection()?.addRange(range);
    
    // Execute copy command
    document.execCommand('copy');
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    
    // Notify user
    alert('Table copied to clipboard!');
  };
  
  // Toggle column visibility all at once
  const toggleAllColumns = (visible: boolean) => {
    const newState: VisibilityState = {};
    table.getAllLeafColumns().forEach(column => {
      if (column.id !== 'select') { // Always keep select column visible
        newState[column.id] = visible;
      }
    });
    setColumnVisibility(newState);
  };
  
  // Function to get the background color for a row based on highlighting conditions
  const getRowHighlightClass = (row: any) => {
    if (!enabledFeatures.rowHighlighting || !highlightConditions?.length) return '';
    
    for (const condition of highlightConditions) {
      const value = row[condition.column];
      if (matchesCondition(value, condition)) {
        return condition.color;
      }
    }
    
    return '';
  };
  
  // Pin a column
  const pinColumn = (id: string, position: 'left' | 'right' | false) => {
    const newPinning = { ...columnPinning };
    
    if (position === false) {
      // Remove from both left and right
      newPinning.left = newPinning.left.filter(colId => colId !== id);
      newPinning.right = newPinning.right.filter(colId => colId !== id);
    } else if (position === 'left') {
      // Add to left, remove from right
      if (!newPinning.left.includes(id)) {
        newPinning.left.push(id);
      }
      newPinning.right = newPinning.right.filter(colId => colId !== id);
    } else {
      // Add to right, remove from left
      if (!newPinning.right.includes(id)) {
        newPinning.right.push(id);
      }
      newPinning.left = newPinning.left.filter(colId => colId !== id);
    }
    
    setColumnPinning(newPinning);
  };
  
  // Render filter for a column
  const renderColumnFilter = useCallback(
    ({ column }: { column: Column<any, unknown> }) => {
      const filterComponent = (column.columnDef.meta as any)?.filterComponent;
      
      if (!filterComponent) {
        return null;
      }
      
      return React.createElement(filterComponent, { column, table });
    },
    [table]
  );
  
  // Error state
  if (error) {
    return (
      <Card title="Results Grid">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-md">
          <p className="font-medium">Error fetching data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card title="Results Grid">
      <div className="space-y-4">
        {/* Results toolbar */}
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            {enabledFeatures.export && data?.rows && data.rows.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={exportToCsv}
                title="Export to CSV"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
            
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toggleAllColumns(true)}
              title="Show all columns"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              Show All
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toggleAllColumns(false)}
              title="Hide all columns"
            >
              <EyeSlashIcon className="h-4 w-4 mr-1" />
              Hide All
            </Button>
            
            {enabledFeatures.columnFiltering && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowFilterRow(!showFilterRow)}
                title={showFilterRow ? "Hide filters" : "Show filters"}
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                {showFilterRow ? 'Hide Filters' : 'Filters'}
              </Button>
            )}
            
            <Button
              size="sm"
              variant="secondary"
              onClick={copyToClipboard}
              title="Copy to clipboard"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>
          
          {enabledFeatures.globalFilter && (
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                value={globalFilter || ''}
                onChange={e => setGlobalFilter(e.target.value)}
                placeholder="Search all columns..."
                className="text-sm sm:w-64"
              />
            </div>
          )}
        </div>
        
        {/* Column management panel */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Column Management</h3>
            <div className="flex space-x-2">
              <Button
                size="xs"
                variant="secondary"
                onClick={() => {
                  table.resetColumnOrder();
                  setColumnPinning({ left: [], right: [] });
                }}
              >
                Reset
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Visible columns */}
            <div>
              <h4 className="text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">Visible Columns</h4>
              <div className="flex flex-wrap gap-2">
                {table.getAllLeafColumns()
                  .filter(column => column.id !== 'select')
                  .map(column => (
                    <label
                      key={column.id}
                      className="flex items-center space-x-1 text-xs cursor-pointer"
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
            
            {/* Column pinning */}
            {enabledFeatures.columnPinning && (
              <div>
                <h4 className="text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">Column Pinning</h4>
                <div className="flex flex-wrap gap-2">
                  {table.getAllLeafColumns()
                    .filter(column => column.id !== 'select' && column.getIsVisible())
                    .map(column => {
                      const isPinnedLeft = columnPinning.left?.includes(column.id);
                      const isPinnedRight = columnPinning.right?.includes(column.id);
                      
                      return (
                        <div key={column.id} className="flex items-center space-x-1 text-xs">
                          <span>{column.id}</span>
                          <div className="flex">
                            <Button
                              size="xs"
                              variant={isPinnedLeft ? "primary" : "secondary"}
                              className="rounded-r-none px-1"
                              onClick={() => pinColumn(column.id, isPinnedLeft ? false : 'left')}
                              title={isPinnedLeft ? "Unpin" : "Pin to left"}
                            >
                              L
                            </Button>
                            <Button
                              size="xs"
                              variant={isPinnedRight ? "primary" : "secondary"}
                              className="rounded-l-none px-1"
                              onClick={() => pinColumn(column.id, isPinnedRight ? false : 'right')}
                              title={isPinnedRight ? "Unpin" : "Pin to right"}
                            >
                              R
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            
            {/* Selected rows count */}
            {enabledFeatures.rowSelection && (
              <div>
                <h4 className="text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">Selection</h4>
                <div className="text-sm">
                  {Object.keys(rowSelection).length} of {data?.rows?.length || 0} rows selected
                  {Object.keys(rowSelection).length > 0 && (
                    <Button
                      size="xs"
                      variant="secondary"
                      className="ml-2"
                      onClick={() => setRowSelection({})}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
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
        
        {/* Results table */}
        <div className="border dark:border-gray-700 rounded-md overflow-auto max-h-[600px]">
          <table 
            ref={tableRef}
            className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
            style={{ width: table.getCenterTotalSize() }}
          >
            <thead className="bg-gray-50 dark:bg-gray-800">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
                        header.column.getIsPinned() === 'left' 
                          ? 'sticky left-0 z-10 bg-gray-50 dark:bg-gray-800' 
                          : header.column.getIsPinned() === 'right' 
                          ? 'sticky right-0 z-10 bg-gray-50 dark:bg-gray-800' 
                          : ''
                      }`}
                      style={{
                        width: header.getSize(),
                        position: header.column.getIsPinned() ? 'sticky' : undefined,
                        left: header.column.getIsPinned() === 'left' 
                          ? `${header.getStart('left')}px` 
                          : undefined,
                        right: header.column.getIsPinned() === 'right' 
                          ? `${header.getStart('right')}px` 
                          : undefined,
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center justify-between gap-1">
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
                          
                          {enabledFeatures.columnResizing && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={`resizer ${
                                header.column.getIsResizing() ? 'isResizing' : ''
                              }`}
                              style={{
                                cursor: 'col-resize',
                                width: '5px',
                                height: '80%',
                                backgroundColor: header.column.getIsResizing() 
                                  ? '#2563eb' // blue-600
                                  : 'transparent',
                              }}
                            ></div>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
              
              {/* Filter row */}
              {showFilterRow && (
                <tr>
                  {table.getHeaderGroups().map(headerGroup => (
                    headerGroup.headers.map(header => (
                      <th
                        key={header.id + '-filter'}
                        className={`px-6 py-2 bg-gray-100 dark:bg-gray-700 ${
                          header.column.getIsPinned() === 'left' 
                            ? 'sticky left-0 z-10 bg-gray-100 dark:bg-gray-700' 
                            : header.column.getIsPinned() === 'right' 
                            ? 'sticky right-0 z-10 bg-gray-100 dark:bg-gray-700' 
                            : ''
                        }`}
                        style={{
                          position: header.column.getIsPinned() ? 'sticky' : undefined,
                          left: header.column.getIsPinned() === 'left' 
                            ? `${header.getStart('left')}px` 
                            : undefined,
                          right: header.column.getIsPinned() === 'right' 
                            ? `${header.getStart('right')}px` 
                            : undefined,
                        }}
                      >
                        {!header.isPlaceholder && header.column.getCanFilter() ? (
                          renderColumnFilter({ column: header.column })
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
                      <span>Loading data...</span>
                    </div>
                  </td>
                </tr>
              ) : data?.rows && data.rows.length > 0 ? (
                table.getRowModel().rows.map(row => {
                  const highlightClass = getRowHighlightClass(row.original);
                  const rowExpanded = detailRow === parseInt(row.id);
                  
                  return (
                    <React.Fragment key={row.id}>
                      <tr 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                          row.getIsSelected() ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        } ${highlightClass}`}
                        onClick={() => {
                          if (onRowClick) {
                            onRowClick(row.original);
                          } else if (enabledFeatures.rowSelection) {
                            row.toggleSelected();
                          } else {
                            setDetailRow(detailRow === parseInt(row.id) ? null : parseInt(row.id));
                          }
                        }}
                        style={{ cursor: onRowClick || enabledFeatures.rowSelection ? 'pointer' : 'default' }}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td
                            key={cell.id}
                            className={`px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300 ${
                              cell.column.getIsPinned() === 'left' 
                                ? 'sticky left-0 z-10 bg-white dark:bg-gray-900' 
                                : cell.column.getIsPinned() === 'right' 
                                ? 'sticky right-0 z-10 bg-white dark:bg-gray-900' 
                                : ''
                            }`}
                            style={{
                              position: cell.column.getIsPinned() ? 'sticky' : undefined,
                              left: cell.column.getIsPinned() === 'left' 
                                ? `${cell.column.getStart('left')}px` 
                                : undefined,
                              right: cell.column.getIsPinned() === 'right' 
                                ? `${cell.column.getStart('right')}px` 
                                : undefined,
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                      
                      {/* Detail row */}
                      {rowExpanded && (
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <td colSpan={row.getVisibleCells().length} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {Object.entries(row.original).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <div className="font-medium text-gray-700 dark:text-gray-300">{key}</div>
                                  <div className="text-gray-900 dark:text-gray-100 break-all">
                                    {value === null || value === undefined 
                                      ? <span className="text-gray-400 italic">NULL</span>
                                      : String(value)
                                    }
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={columns.length || 1}
                    className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {data ? 'No results found' : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination controls */}
        {enabledFeatures.pagination && data?.rows && data.rows.length > 0 && (
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
        
        {/* Row count and selected info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
          <div>
            {table.getFilteredRowModel().rows.length} of {data?.rows?.length || 0} rows
            {Object.keys(rowSelection).length > 0 && (
              <span> ({Object.keys(rowSelection).length} selected)</span>
            )}
          </div>
          
          {enabledFeatures.rowSelection && Object.keys(rowSelection).length > 0 && (
            <div>
              <Button
                size="xs"
                variant="secondary"
                onClick={() => {
                  const message = `Selected row IDs: ${Object.keys(rowSelection).join(', ')}`;
                  alert(message);
                }}
              >
                View Selected
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ResultsGrid;