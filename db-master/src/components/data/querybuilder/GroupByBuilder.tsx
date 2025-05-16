import React, { useState, useEffect } from 'react';
import { Button, Select, Card } from '../../ui';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import useQueryStore from '../../../store/core/queryStore';
import { useSchemaStore } from '../../../store';
import { QueryGroup, QueryCondition } from '../../../types/store';

interface GroupByBuilderProps {
  connectionId: string;
}

const GroupByBuilder: React.FC<GroupByBuilderProps> = ({ connectionId }) => {
  const { getSchema } = useSchemaStore();
  const { 
    queryState, 
    addGroupBy, 
    removeGroupBy, 
    clearGroupBy,
    addHaving,
    updateHaving,
    removeHaving,
    clearHaving
  } = useQueryStore();
  
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedHavingId, setSelectedHavingId] = useState<string | null>(null);
  
  // New group by form state
  const [groupForm, setGroupForm] = useState({
    table: queryState.selectedTable,
    column: '',
  });

  // New having form state
  const [havingForm, setHavingForm] = useState({
    column: '',
    operator: '=' as '=' | '!=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'NOT LIKE' | 'IN' | 'NOT IN' | 'BETWEEN' | 'IS NULL' | 'IS NOT NULL',
    value: '',
    valueEnd: '',
    aggregate: 'COUNT' as 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX',
  });

  // Column maps for each table
  const [tableColumns, setTableColumns] = useState<Record<string, string[]>>({});
  
  // Load available tables from schema
  useEffect(() => {
    const schema = getSchema(connectionId);
    if (schema && Array.isArray(schema.tables)) {
      // Include main table and joined tables
      const tables = [
        queryState.selectedTable,
        ...queryState.joins.map(join => join.table),
      ];
      
      setAvailableTables(tables);
      
      // Build column map for each table
      const columnMap: Record<string, string[]> = {};
      schema.tables.forEach(table => {
        if (tables.includes(table.name)) {
          columnMap[table.name] = table.columns.map(col => col.name);
        }
      });
      setTableColumns(columnMap);
    }
  }, [connectionId, getSchema, queryState.selectedTable, queryState.joins]);
  
  // Reset form when selected table changes
  useEffect(() => {
    setGroupForm(prev => ({
      ...prev,
      table: queryState.selectedTable,
      column: '',
    }));
  }, [queryState.selectedTable]);
  
  // Handle group form changes
  const handleGroupFormChange = (field: string, value: string) => {
    setGroupForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Handle having form changes
  const handleHavingFormChange = (field: string, value: string) => {
    setHavingForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Add a new group by
  const handleAddGroupBy = () => {
    if (!groupForm.column) {
      alert('Please select a column');
      return;
    }
    
    addGroupBy({
      table: groupForm.table,
      column: groupForm.column,
    });
    
    // Reset form
    setGroupForm(prev => ({
      ...prev,
      column: '',
    }));
  };
  
  // Remove a group by
  const handleRemoveGroupBy = (id: string) => {
    if (selectedGroupId === id) {
      setSelectedGroupId(null);
    }
    removeGroupBy(id);
  };
  
  // Clear all group by clauses
  const handleClearGroupBy = () => {
    if (window.confirm('Are you sure you want to remove all GROUP BY clauses?')) {
      clearGroupBy();
      setSelectedGroupId(null);
    }
  };
  
  // Add a new having condition
  const handleAddHaving = () => {
    // Skip validation for IS NULL and IS NOT NULL operators
    if (
      havingForm.operator !== 'IS NULL' && 
      havingForm.operator !== 'IS NOT NULL' && 
      !havingForm.value
    ) {
      alert('Please enter a value');
      return;
    }
    
    if (!havingForm.column) {
      alert('Please select a column');
      return;
    }
    
    // For BETWEEN operator, validate both values
    if (havingForm.operator === 'BETWEEN' && !havingForm.valueEnd) {
      alert('Please enter an end value for BETWEEN operator');
      return;
    }
    
    addHaving({
      table: '',  // Not needed for HAVING as it uses aggregate
      column: havingForm.column,
      operator: havingForm.operator,
      value: havingForm.value,
      valueEnd: havingForm.valueEnd,
      aggregate: havingForm.aggregate,
    });
    
    // Reset form
    setHavingForm({
      column: '',
      operator: '=',
      value: '',
      valueEnd: '',
      aggregate: 'COUNT',
    });
  };
  
  // Select a having condition for editing
  const handleSelectHaving = (having: QueryCondition) => {
    setSelectedHavingId(having.id);
    
    setHavingForm({
      column: having.column,
      operator: having.operator,
      value: having.value || '',
      valueEnd: having.valueEnd || '',
      aggregate: having.aggregate || 'COUNT',
    });
  };
  
  // Update an existing having condition
  const handleUpdateHaving = () => {
    if (!selectedHavingId) return;
    
    // Skip validation for IS NULL and IS NOT NULL operators
    if (
      havingForm.operator !== 'IS NULL' && 
      havingForm.operator !== 'IS NOT NULL' && 
      !havingForm.value
    ) {
      alert('Please enter a value');
      return;
    }
    
    // For BETWEEN operator, validate both values
    if (havingForm.operator === 'BETWEEN' && !havingForm.valueEnd) {
      alert('Please enter an end value for BETWEEN operator');
      return;
    }
    
    updateHaving(selectedHavingId, {
      table: '',  // Not needed for HAVING as it uses aggregate
      column: havingForm.column,
      operator: havingForm.operator,
      value: havingForm.value,
      valueEnd: havingForm.valueEnd,
      aggregate: havingForm.aggregate,
    });
    
    // Reset form and selection
    setSelectedHavingId(null);
    setHavingForm({
      column: '',
      operator: '=',
      value: '',
      valueEnd: '',
      aggregate: 'COUNT',
    });
  };
  
  // Cancel having edit
  const handleCancelHavingEdit = () => {
    setSelectedHavingId(null);
    setHavingForm({
      column: '',
      operator: '=',
      value: '',
      valueEnd: '',
      aggregate: 'COUNT',
    });
  };
  
  // Remove a having condition
  const handleRemoveHaving = (id: string) => {
    if (selectedHavingId === id) {
      handleCancelHavingEdit();
    }
    removeHaving(id);
  };
  
  // Clear all having conditions
  const handleClearHaving = () => {
    if (window.confirm('Are you sure you want to remove all HAVING conditions?')) {
      clearHaving();
      handleCancelHavingEdit();
    }
  };
  
  // Show value input based on operator
  const renderValueInput = () => {
    // No value input for NULL operators
    if (havingForm.operator === 'IS NULL' || havingForm.operator === 'IS NOT NULL') {
      return null;
    }
    
    // For BETWEEN operator, show two inputs
    if (havingForm.operator === 'BETWEEN') {
      return (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Value
            </label>
            <input
              type="text"
              value={havingForm.value}
              onChange={(e) => handleHavingFormChange('value', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              placeholder="Enter start value..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Value
            </label>
            <input
              type="text"
              value={havingForm.valueEnd}
              onChange={(e) => handleHavingFormChange('valueEnd', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              placeholder="Enter end value..."
            />
          </div>
        </div>
      );
    }
    
    // For IN and NOT IN operators, show textarea
    if (havingForm.operator === 'IN' || havingForm.operator === 'NOT IN') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Values (comma separated)
          </label>
          <textarea
            value={havingForm.value}
            onChange={(e) => handleHavingFormChange('value', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            placeholder="value1, value2, value3..."
            rows={3}
          />
        </div>
      );
    }
    
    // For other operators, show single input
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Value
        </label>
        <input
          type="text"
          value={havingForm.value}
          onChange={(e) => handleHavingFormChange('value', e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
          placeholder="Enter value..."
        />
      </div>
    );
  };
  
  // Format having condition for display
  const formatHavingCondition = (having: QueryCondition) => {
    if (!having.aggregate) return '';
    
    let condition = `${having.aggregate}(${having.column})`;
    
    switch (having.operator) {
      case 'IS NULL':
        return `${condition} IS NULL`;
      case 'IS NOT NULL':
        return `${condition} IS NOT NULL`;
      case 'BETWEEN':
        return `${condition} BETWEEN ${having.value} AND ${having.valueEnd}`;
      case 'IN':
      case 'NOT IN':
        return `${condition} ${having.operator} (${having.value})`;
      default:
        return `${condition} ${having.operator} ${having.value}`;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* GROUP BY section */}
      <div>
        <h3 className="text-lg font-medium mb-4">
          GROUP BY Columns
        </h3>
        
        <Card className="p-4 max-w-3xl mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Table selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Table
              </label>
              <Select
                value={groupForm.table}
                onChange={(e) => handleGroupFormChange('table', e.target.value)}
                options={[
                  ...availableTables.map(table => ({
                    value: table,
                    label: table === queryState.selectedTable
                      ? `${table} (main)`
                      : table
                  })),
                  ...queryState.joins
                    .filter(join => join.alias)
                    .map(join => ({
                      value: join.alias!,
                      label: `${join.alias} (alias of ${join.table})`
                    }))
                ]}
              />
            </div>
            
            {/* Column selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Column
              </label>
              <Select
                value={groupForm.column}
                onChange={(e) => handleGroupFormChange('column', e.target.value)}
                options={[
                  { value: '', label: 'Select column...' },
                  ...(tableColumns[groupForm.table] || []).map(col => ({
                    value: col,
                    label: col
                  }))
                ]}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleAddGroupBy}
              disabled={!groupForm.column}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Group By
            </Button>
          </div>
        </Card>
        
        {/* Active GROUP BY clauses */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">
              Active GROUP BY Clauses
            </h4>
            {queryState.groupBy.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleClearGroupBy}
              >
                Clear All
              </Button>
            )}
          </div>
          
          {queryState.groupBy.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No GROUP BY clauses added yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {queryState.groupBy.map(group => (
                <Card
                  key={group.id}
                  className="p-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium">
                      {`${group.table}.${group.column}`}
                    </div>
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => handleRemoveGroupBy(group.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* HAVING section */}
      <div>
        <h3 className="text-lg font-medium mb-4">
          HAVING Conditions
        </h3>
        
        <Card className="p-4 max-w-3xl mb-4">
          <h4 className="font-medium mb-3">
            {selectedHavingId ? 'Edit Having Condition' : 'Add Having Condition'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Aggregate function */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Aggregate Function
              </label>
              <Select
                value={havingForm.aggregate}
                onChange={(e) => handleHavingFormChange('aggregate', e.target.value)}
                options={[
                  { value: 'COUNT', label: 'COUNT' },
                  { value: 'SUM', label: 'SUM' },
                  { value: 'AVG', label: 'AVG' },
                  { value: 'MIN', label: 'MIN' },
                  { value: 'MAX', label: 'MAX' },
                ]}
              />
            </div>
            
            {/* Column selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Column
              </label>
              <Select
                value={havingForm.column}
                onChange={(e) => handleHavingFormChange('column', e.target.value)}
                options={[
                  { value: '', label: 'Select column...' },
                  ...Object.entries(tableColumns).flatMap(([tableName, columns]) => 
                    columns.map(col => ({
                      value: col,
                      label: `${tableName}.${col}`
                    }))
                  )
                ]}
              />
            </div>
            
            {/* Operator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Operator
              </label>
              <Select
                value={havingForm.operator}
                onChange={(e) => {
                  handleHavingFormChange('operator', e.target.value);
                  // Clear value and valueEnd when changing to a NULL operator
                  if (e.target.value === 'IS NULL' || e.target.value === 'IS NOT NULL') {
                    handleHavingFormChange('value', '');
                    handleHavingFormChange('valueEnd', '');
                  }
                }}
                options={[
                  { value: '=', label: '= (Equal to)' },
                  { value: '!=', label: '!= (Not equal to)' },
                  { value: '>', label: '> (Greater than)' },
                  { value: '>=', label: '>= (Greater than or equal to)' },
                  { value: '<', label: '< (Less than)' },
                  { value: '<=', label: '<= (Less than or equal to)' },
                  { value: 'LIKE', label: 'LIKE (Contains text)' },
                  { value: 'NOT LIKE', label: 'NOT LIKE (Does not contain text)' },
                  { value: 'IN', label: 'IN (In a list of values)' },
                  { value: 'NOT IN', label: 'NOT IN (Not in a list of values)' },
                  { value: 'BETWEEN', label: 'BETWEEN (Within a range)' },
                  { value: 'IS NULL', label: 'IS NULL (Is null)' },
                  { value: 'IS NOT NULL', label: 'IS NOT NULL (Is not null)' },
                ]}
              />
            </div>
            
            {/* Value input(s) based on operator */}
            {renderValueInput()}
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            {selectedHavingId ? (
              <>
                <Button
                  variant="secondary"
                  onClick={handleCancelHavingEdit}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpdateHaving}
                  disabled={!havingForm.column}
                >
                  Update Condition
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                onClick={handleAddHaving}
                disabled={!havingForm.column}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Having Condition
              </Button>
            )}
          </div>
        </Card>
        
        {/* Active HAVING conditions */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">
              Active HAVING Conditions
            </h4>
            {queryState.having.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleClearHaving}
              >
                Clear All
              </Button>
            )}
          </div>
          
          {queryState.having.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No HAVING conditions added yet.
            </p>
          ) : (
            <div className="space-y-2">
              {queryState.having.map(having => (
                <Card
                  key={having.id}
                  className={`p-3 ${selectedHavingId === having.id ? 'ring-2 ring-indigo-500' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium">
                      {formatHavingCondition(having)}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleSelectHaving(having)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleRemoveHaving(having.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Information section */}
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-md p-4 text-sm text-blue-800 dark:text-blue-200">
        <h4 className="font-medium mb-2">About GROUP BY and HAVING</h4>
        <p className="mb-2">
          The GROUP BY clause is used to group rows that have the same values in specified columns into aggregated data.
        </p>
        <p className="mb-2">
          The HAVING clause is used with GROUP BY to filter groups based on aggregate function results, similar to how the WHERE clause filters individual rows.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use GROUP BY to organize your data into groups for aggregation</li>
          <li>Use HAVING to filter the results of GROUP BY based on aggregate values</li>
          <li>Common aggregate functions: COUNT, SUM, AVG, MIN, MAX</li>
          <li>HAVING conditions must use aggregate functions, unlike WHERE conditions</li>
        </ul>
      </div>
    </div>
  );
};

export default GroupByBuilder;
