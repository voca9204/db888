import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '../../ui';
import useQueryStore from '../../../store/core/queryStore';
import { useSchemaStore } from '../../../store';
import { Operator, QueryCondition } from '../../../types/store';
import { PlusIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { getFieldType, FieldType, validateFieldValue, formatValueForField } from '../../../utils/query';

interface ConditionBuilderProps {
  connectionId: string;
}

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ connectionId }) => {
  const { queryState, addCondition, updateCondition, removeCondition, clearConditions } = useQueryStore();
  const { getSchema } = useSchemaStore();
  
  // State for available columns
  const [availableColumns, setAvailableColumns] = useState<{ name: string; type: string; nullable: boolean }[]>([]);
  
  // Load available columns when table changes
  useEffect(() => {
    if (!connectionId || !queryState.selectedTable) return;
    
    const schemaData = getSchema(connectionId);
    if (schemaData?.schema?.tables?.[queryState.selectedTable]?.columns) {
      const columns = schemaData.schema.tables[queryState.selectedTable].columns;
      setAvailableColumns(columns);
    }
  }, [connectionId, queryState.selectedTable, getSchema]);
  
  // Add new condition with default values
  const handleAddCondition = () => {
    if (availableColumns.length === 0) return;
    
    addCondition({
      table: queryState.selectedTable,
      column: availableColumns[0].name,
      operator: '=',
      value: '',
    });
  };
  
  // Clear all conditions
  const handleClearConditions = () => {
    clearConditions();
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Define Conditions
        </h3>
        <div className="flex space-x-2">
          <Button size="sm" onClick={handleAddCondition}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Condition
          </Button>
          <Button 
            size="sm" 
            variant="danger" 
            onClick={handleClearConditions}
            disabled={queryState.conditions.length === 0}
          >
            Clear All
          </Button>
        </div>
      </div>
      
      {/* Conditions list */}
      {queryState.conditions.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 text-center text-gray-500 dark:text-gray-400">
          No conditions defined. Add conditions to filter your query results.
        </div>
      ) : (
        <div className="space-y-2">
          {queryState.conditions.map((condition, index) => (
            <ConditionRow
              key={condition.id}
              condition={condition}
              availableColumns={availableColumns}
              isFirst={index === 0}
              onUpdate={(data) => updateCondition(condition.id, data)}
              onRemove={() => removeCondition(condition.id)}
            />
          ))}
        </div>
      )}
      
      {/* Add condition button at the bottom */}
      {queryState.conditions.length > 0 && (
        <div className="mt-2 flex justify-center">
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleAddCondition}
            className="w-full sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Another Condition
          </Button>
        </div>
      )}
    </div>
  );
};

interface ConditionRowProps {
  condition: QueryCondition;
  availableColumns: { name: string; type: string; nullable: boolean }[];
  isFirst: boolean;
  onUpdate: (data: Partial<Omit<QueryCondition, 'id'>>) => void;
  onRemove: () => void;
}

const ConditionRow: React.FC<ConditionRowProps> = ({
  condition,
  availableColumns,
  isFirst,
  onUpdate,
  onRemove,
}) => {
  // Get the selected column details
  const selectedColumn = availableColumns.find(col => col.name === condition.column);
  const columnType = selectedColumn?.type || '';
  
  // State for validation
  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  
  // Validate when value changes
  useEffect(() => {
    if (!selectedColumn || !needsValueInput) {
      setValidationError(undefined);
      return;
    }
    
    if (condition.operator === 'BETWEEN') {
      // For BETWEEN operator, validate both values
      const startResult = validateFieldValue(condition.value, selectedColumn);
      const endResult = validateFieldValue(condition.valueEnd, selectedColumn);
      
      if (!startResult.isValid) {
        setValidationError(`Start value: ${startResult.error}`);
      } else if (!endResult.isValid) {
        setValidationError(`End value: ${endResult.error}`);
      } else {
        setValidationError(undefined);
      }
    } else {
      // For other operators, validate the single value
      const result = validateFieldValue(condition.value, selectedColumn);
      setValidationError(result.isValid ? undefined : result.error);
    }
  }, [condition.value, condition.valueEnd, condition.operator, selectedColumn]);
  
  // Determine available operators based on the column type
  const getAvailableOperators = (): Operator[] => {
    if (!columnType) return [];
    
    const fieldType = getFieldType(columnType);
    
    // Base operators for all types
    const baseOperators: Operator[] = ['=', '!=', 'IS NULL', 'IS NOT NULL'];
    
    // Add type-specific operators
    switch (fieldType) {
      case FieldType.NUMBER:
      case FieldType.DATE:
      case FieldType.DATETIME:
        return [...baseOperators, '>', '>=', '<', '<=', 'BETWEEN', 'IN', 'NOT IN'];
      case FieldType.STRING:
        return [...baseOperators, 'LIKE', 'NOT LIKE', 'IN', 'NOT IN'];
      case FieldType.BOOLEAN:
        return baseOperators;
      case FieldType.ENUM:
        return [...baseOperators, 'IN', 'NOT IN'];
      default:
        return [...baseOperators, 'LIKE', 'NOT LIKE', 'IN', 'NOT IN', '>', '>=', '<', '<=', 'BETWEEN'];
    }
  };
  
  // Check if the operator needs a value input
  const needsValueInput = !['IS NULL', 'IS NOT NULL'].includes(condition.operator);
  
  // Check if the operator needs a second value input (for BETWEEN)
  const needsSecondValueInput = condition.operator === 'BETWEEN';
  
  // Get the proper input type based on field type
  const getInputType = (): 'text' | 'number' | 'date' | 'datetime-local' => {
    if (!columnType) return 'text';
    
    const fieldType = getFieldType(columnType);
    
    switch (fieldType) {
      case FieldType.NUMBER:
        return 'number';
      case FieldType.DATE:
        return 'date';
      case FieldType.DATETIME:
        return 'datetime-local';
      default:
        return 'text';
    }
  };
  
  // Render value input field based on column type and operator
  const renderValueInput = () => {
    if (!needsValueInput) return null;
    
    // Use appropriate input type based on field type
    const inputType = getInputType();
    
    // For IN and NOT IN operators, always use text with comma-separated values
    if (['IN', 'NOT IN'].includes(condition.operator)) {
      return (
        <div className="flex-1 min-w-[150px]">
          <Input
            type="text"
            value={condition.value || ''}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder="Comma-separated values"
            aria-label="Value"
            className={validationError ? 'border-red-500' : ''}
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Enter comma-separated values (e.g., value1, value2, value3)
          </div>
          {renderValidationError()}
        </div>
      );
    }
    
    // For LIKE and NOT LIKE, provide hint for wildcards
    if (['LIKE', 'NOT LIKE'].includes(condition.operator)) {
      return (
        <div className="flex-1 min-w-[150px]">
          <Input
            type="text"
            value={condition.value || ''}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder="Pattern with wildcards"
            aria-label="Value"
            className={validationError ? 'border-red-500' : ''}
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Use % for zero or more characters, _ for a single character
          </div>
          {renderValidationError()}
        </div>
      );
    }
    
    // For ENUM fields, render a select dropdown
    if (selectedColumn && getFieldType(selectedColumn.type) === FieldType.ENUM) {
      // Extract enum values from type definition
      const enumMatch = selectedColumn.type.match(/enum\('(.*)'\)/i);
      let enumValues: string[] = [];
      
      if (enumMatch && enumMatch[1]) {
        enumValues = enumMatch[1].split(',').map(v => v.replace(/^'|'$/g, ''));
      }
      
      return (
        <div className="flex-1 min-w-[150px]">
          <Select
            value={condition.value || ''}
            onChange={(e) => onUpdate({ value: e.target.value })}
            aria-label="Value"
          >
            <option value="" disabled>Select a value</option>
            {enumValues.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </Select>
          {renderValidationError()}
        </div>
      );
    }
    
    // Default input field for other types
    return (
      <div className="flex-1 min-w-[150px]">
        <Input
          type={inputType}
          value={condition.value || ''}
          onChange={(e) => onUpdate({ value: e.target.value })}
          placeholder="Value"
          aria-label="Value"
          className={validationError ? 'border-red-500' : ''}
        />
        {renderValidationError()}
      </div>
    );
  };
  
  // Render second value input (for BETWEEN operator)
  const renderSecondValueInput = () => {
    if (!needsSecondValueInput) return null;
    
    const inputType = getInputType();
    
    return (
      <>
        <div className="text-gray-500 dark:text-gray-400">AND</div>
        <div className="flex-1 min-w-[150px]">
          <Input
            type={inputType}
            value={condition.valueEnd || ''}
            onChange={(e) => onUpdate({ valueEnd: e.target.value })}
            placeholder="End Value"
            aria-label="End Value"
            className={validationError && validationError.startsWith('End value:') ? 'border-red-500' : ''}
          />
        </div>
      </>
    );
  };
  
  // Render validation error message
  const renderValidationError = () => {
    if (!validationError) return null;
    
    return (
      <div className="text-xs text-red-500 mt-1 flex items-center">
        <ExclamationCircleIcon className="h-3 w-3 mr-1" />
        {validationError}
      </div>
    );
  };
  
  return (
    <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-gray-700 p-3 rounded-md border dark:border-gray-600">
      {/* Logical operator (AND/OR) - not shown for the first condition */}
      {!isFirst && (
        <div className="w-20">
          <Select
            value="AND" // Hardcoded for now, will be implemented in advanced version
            disabled={true}
            aria-label="Logical Operator"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </Select>
        </div>
      )}
      
      {/* Column selection */}
      <div className="flex-1 min-w-[150px]">
        <Select
          value={condition.column}
          onChange={(e) => onUpdate({ column: e.target.value })}
          aria-label="Column"
        >
          {availableColumns.map((col) => (
            <option key={col.name} value={col.name}>
              {col.name} ({col.type})
            </option>
          ))}
        </Select>
      </div>
      
      {/* Operator selection */}
      <div className="w-40">
        <Select
          value={condition.operator}
          onChange={(e) => onUpdate({ operator: e.target.value as Operator })}
          aria-label="Operator"
        >
          {getAvailableOperators().map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </Select>
      </div>
      
      {/* Value input */}
      {renderValueInput()}
      
      {/* Second value input (for BETWEEN) */}
      {renderSecondValueInput()}
      
      {/* Remove button */}
      <Button
        size="icon"
        variant="danger"
        onClick={onRemove}
        aria-label="Remove Condition"
      >
        <XMarkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ConditionBuilder;