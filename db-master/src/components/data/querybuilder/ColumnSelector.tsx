import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Badge } from '../../ui';
import useQueryStore from '../../../store/core/queryStore';
import { useSchemaStore } from '../../../store';
import { QueryColumn, DbColumn, DbTable } from '../../../types/store';
import { PlusIcon, XMarkIcon, CheckIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

interface ColumnSelectorProps {
  connectionId: string;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ connectionId }) => {
  const { queryState, addColumn, updateColumn, removeColumn, clearColumns } = useQueryStore();
  const { getSchema } = useSchemaStore();
  
  // State for available columns and tables
  const [availableColumns, setAvailableColumns] = useState<DbColumn[]>([]);
  const [availableTables, setAvailableTables] = useState<{ [key: string]: DbTable }>({});
  const [selectedAllColumns, setSelectedAllColumns] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  
  // Load available columns when table changes
  useEffect(() => {
    if (!connectionId || !queryState.selectedTable) return;
    
    const schemaData = getSchema(connectionId);
    if (schemaData?.schema?.tables) {
      // Store all tables for potential joins
      setAvailableTables(schemaData.schema.tables);
      
      // Get columns for the selected table
      const columns = schemaData.schema.tables[queryState.selectedTable]?.columns || [];
      setAvailableColumns(columns);
      
      // Check if all columns are selected
      if (columns.length > 0 && 
          queryState.columns.length === columns.length && 
          queryState.columns.every(c => columns.some(col => col.name === c.column))) {
        setSelectedAllColumns(true);
      } else {
        setSelectedAllColumns(false);
      }
    }
  }, [connectionId, queryState.selectedTable, queryState.columns, getSchema]);
  
  // Add new column with default values
  const handleAddColumn = () => {
    if (availableColumns.length === 0) return;
    
    addColumn({
      table: queryState.selectedTable,
      column: availableColumns[0].name,
      alias: '',
      aggregate: undefined,
    });
  };
  
  // Clear all selected columns
  const handleClearColumns = () => {
    clearColumns();
    setSelectedAllColumns(false);
  };
  
  // Handle "Select All" columns
  const handleSelectAllColumns = () => {
    if (selectedAllColumns) {
      clearColumns();
      setSelectedAllColumns(false);
    } else {
      clearColumns();
      availableColumns.forEach(col => {
        addColumn({
          table: queryState.selectedTable,
          column: col.name,
          alias: '',
          aggregate: undefined,
        });
      });
      setSelectedAllColumns(true);
    }
  };
  
  // Show if column is already selected
  const isColumnSelected = (columnName: string) => {
    return queryState.columns.some(col => col.column === columnName);
  };
  
  // Handle drag and drop for reordering columns
  const handleDragStart = (columnId: string) => {
    setDraggedColumn(columnId);
  };
  
  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    // Logic for visual indication of drag location would go here
  };
  
  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumnId) return;
    
    // Get current column order
    const currentOrder = queryState.columns.slice();
    const sourceIndex = currentOrder.findIndex(col => col.id === draggedColumn);
    const targetIndex = currentOrder.findIndex(col => col.id === targetColumnId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    // Remove the dragged item
    const [movedColumn] = currentOrder.splice(sourceIndex, 1);
    
    // Insert at the target position
    currentOrder.splice(targetIndex, 0, movedColumn);
    
    // Not directly possible with current store - would need a new action
    // For now, we can simulate by clearing and re-adding in the new order
    // In a real application, you'd add a proper reorder action to the store
    
    setDraggedColumn(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Select Columns
        </h3>
        <div className="flex space-x-2">
          <Button size="sm" onClick={handleAddColumn}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Column
          </Button>
          <Button 
            size="sm" 
            variant={selectedAllColumns ? "primary" : "secondary"} 
            onClick={handleSelectAllColumns}
          >
            {selectedAllColumns ? (
              <>
                <CheckIcon className="h-4 w-4 mr-1" />
                All Selected
              </>
            ) : (
              'Select All'
            )}
          </Button>
          <Button 
            size="sm" 
            variant="danger" 
            onClick={handleClearColumns}
            disabled={queryState.columns.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>
      
      {/* Available columns for quick selection */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Available Columns:
        </div>
        <div className="flex flex-wrap gap-2">
          {availableColumns.map(column => (
            <Badge
              key={column.name}
              variant={isColumnSelected(column.name) ? "primary" : "secondary"}
              onClick={() => {
                // If already selected, deselect it
                if (isColumnSelected(column.name)) {
                  const columnToRemove = queryState.columns.find(c => c.column === column.name);
                  if (columnToRemove) {
                    removeColumn(columnToRemove.id);
                  }
                } else {
                  // Otherwise, add it
                  addColumn({
                    table: queryState.selectedTable,
                    column: column.name,
                    alias: '',
                    aggregate: undefined,
                  });
                }
              }}
              className="cursor-pointer"
            >
              {column.name}
              {isColumnSelected(column.name) && (
                <CheckIcon className="h-3 w-3 ml-1" />
              )}
            </Badge>
          ))}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Click on a column to add/remove it from the query
        </div>
      </div>
      
      {/* Selected columns */}
      {queryState.columns.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 text-center text-gray-500 dark:text-gray-400">
          No columns selected. Add columns or click "Select All" to include all columns.
        </div>
      ) : (
        <div className="space-y-2">
          {queryState.columns.map((column, index) => (
            <ColumnRow
              key={column.id}
              column={column}
              availableColumns={availableColumns}
              onUpdate={(data) => updateColumn(column.id, data)}
              onRemove={() => removeColumn(column.id)}
              onDragStart={() => handleDragStart(column.id)}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              isDraggable={true}
            />
          ))}
        </div>
      )}
      
      {/* Column stats summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium">{queryState.columns.length}</span> of{' '}
        <span className="font-medium">{availableColumns.length}</span> columns selected
        {queryState.columns.some(c => c.aggregate) && (
          <span className="ml-2">
            (including <span className="font-medium">
              {queryState.columns.filter(c => c.aggregate).length}
            </span> aggregates)
          </span>
        )}
      </div>
    </div>
  );
};

interface ColumnRowProps {
  column: QueryColumn;
  availableColumns: DbColumn[];
  onUpdate: (data: Partial<Omit<QueryColumn, 'id'>>) => void;
  onRemove: () => void;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDraggable?: boolean;
}

const ColumnRow: React.FC<ColumnRowProps> = ({
  column,
  availableColumns,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  isDraggable = false,
}) => {
  // Find the DB column type
  const dbColumn = availableColumns.find(col => col.name === column.column);
  const columnType = dbColumn?.type || '';
  
  // Check if the column can have an aggregate function applied
  const canAggregate = () => {
    const numericTypes = ['int', 'integer', 'smallint', 'tinyint', 'mediumint', 'bigint', 'decimal', 'numeric', 'float', 'double'];
    
    // Check if the column type is numeric for SUM, AVG
    const isNumeric = numericTypes.some(type => columnType.toLowerCase().includes(type));
    
    return isNumeric;
  };
  
  // Get available aggregate functions based on column type
  const getAvailableAggregates = () => {
    // All columns can use COUNT, MIN, MAX
    const aggregates = ['COUNT', 'MIN', 'MAX'];
    
    // Only numeric columns can use SUM, AVG
    if (canAggregate()) {
      aggregates.push('SUM', 'AVG');
    }
    
    return aggregates;
  };
  
  return (
    <div 
      className={`flex gap-2 items-center bg-white dark:bg-gray-700 p-3 rounded-md border dark:border-gray-600 ${
        isDraggable ? 'cursor-move' : ''
      }`}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Drag handle */}
      {isDraggable && (
        <div className="text-gray-400 dark:text-gray-500">
          <ArrowsUpDownIcon className="h-5 w-5" />
        </div>
      )}
      
      {/* Column selection */}
      <div className="flex-1">
        <Select
          value={column.column}
          onChange={(e) => onUpdate({ column: e.target.value })}
          aria-label="Column"
        >
          {availableColumns.map((col) => (
            <option key={col.name} value={col.name}>
              {col.name} ({col.type})
            </option>
          ))}
        </Select>
        {column.column && dbColumn && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {dbColumn.nullable ? 'Nullable' : 'Not Nullable'}
            {dbColumn.defaultValue && `, Default: ${dbColumn.defaultValue}`}
          </div>
        )}
      </div>
      
      {/* Aggregate function */}
      <div className="w-32">
        <Select
          value={column.aggregate || ''}
          onChange={(e) => onUpdate({ aggregate: e.target.value || undefined })}
          aria-label="Aggregate Function"
        >
          <option value="">No Aggregate</option>
          {getAvailableAggregates().map(agg => (
            <option key={agg} value={agg}>
              {agg}
            </option>
          ))}
        </Select>
      </div>
      
      {/* Column alias */}
      <div className="w-40">
        <Input
          type="text"
          value={column.alias || ''}
          onChange={(e) => onUpdate({ alias: e.target.value || undefined })}
          placeholder="Alias (optional)"
          aria-label="Column Alias"
        />
      </div>
      
      {/* Remove button */}
      <Button
        size="icon"
        variant="danger"
        onClick={onRemove}
        aria-label="Remove Column"
      >
        <XMarkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ColumnSelector;