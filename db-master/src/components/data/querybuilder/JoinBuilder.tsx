import React, { useState, useEffect } from 'react';
import { Button, Select, Card, Badge } from '../../ui';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import useQueryStore from '../../../store/core/queryStore';
import { useSchemaStore } from '../../../store';
import { QueryJoin } from '../../../types/store';

interface JoinBuilderProps {
  connectionId: string;
}

const JoinBuilder: React.FC<JoinBuilderProps> = ({ connectionId }) => {
  const { getSchema } = useSchemaStore();
  const { queryState, addJoin, updateJoin, removeJoin, clearJoins } = useQueryStore();
  
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedJoinId, setSelectedJoinId] = useState<string | null>(null);
  
  // New join form state
  const [joinForm, setJoinForm] = useState({
    type: 'INNER' as 'INNER' | 'LEFT' | 'RIGHT' | 'FULL',
    table: '',
    alias: '',
    leftTable: queryState.selectedTable,
    leftColumn: '',
    rightTable: '',
    rightColumn: '',
  });

  // Column maps for each table
  const [tableColumns, setTableColumns] = useState<Record<string, string[]>>({});
  
  // Load available tables from schema
  useEffect(() => {
    const schema = getSchema(connectionId);
    if (schema && Array.isArray(schema.tables)) {
      const tables = schema.tables.map(table => table.name);
      setAvailableTables(tables);
      
      // Build column map for each table
      const columnMap: Record<string, string[]> = {};
      schema.tables.forEach(table => {
        columnMap[table.name] = table.columns.map(col => col.name);
      });
      setTableColumns(columnMap);
    }
  }, [connectionId, getSchema]);
  
  // Reset form when selected table changes
  useEffect(() => {
    setJoinForm(prev => ({
      ...prev,
      leftTable: queryState.selectedTable,
      leftColumn: '',
      rightTable: '',
      rightColumn: '',
    }));
  }, [queryState.selectedTable]);
  
  // Find foreign key relationships (for automatic join suggestions)
  useEffect(() => {
    if (!connectionId || !queryState.selectedTable) return;
    
    const schema = getSchema(connectionId);
    if (!schema || !Array.isArray(schema.tables)) return;
    
    // Find the selected table in the schema
    const selectedTableInfo = schema.tables.find(
      table => table.name === queryState.selectedTable
    );
    
    if (!selectedTableInfo || !selectedTableInfo.foreignKeys) return;
    
    // Create suggestions based on foreign keys (not used yet, but available for future implementation)
    const suggestions = selectedTableInfo.foreignKeys.map(fk => ({
      leftTable: selectedTableInfo.name,
      leftColumn: fk.column,
      rightTable: fk.referenceTable,
      rightColumn: fk.referenceColumn,
    }));
    
    // We could use these suggestions to auto-fill the form or display suggestions to the user
  }, [connectionId, queryState.selectedTable, getSchema]);
  
  // Handle form changes
  const handleFormChange = (field: string, value: string) => {
    setJoinForm(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // If right table is changed, reset the right column
    if (field === 'rightTable') {
      setJoinForm(prev => ({
        ...prev,
        rightColumn: '',
      }));
    }
  };
  
  // Add a new join
  const handleAddJoin = () => {
    if (!joinForm.table || !joinForm.leftColumn || !joinForm.rightColumn) {
      alert('Please fill in all required fields');
      return;
    }
    
    addJoin({
      type: joinForm.type,
      table: joinForm.table,
      alias: joinForm.alias || undefined,
      on: {
        leftTable: joinForm.leftTable,
        leftColumn: joinForm.leftColumn,
        rightTable: joinForm.table,
        rightColumn: joinForm.rightColumn,
      },
    });
    
    // Reset form except for left table which stays as the main table
    setJoinForm({
      type: 'INNER',
      table: '',
      alias: '',
      leftTable: queryState.selectedTable,
      leftColumn: '',
      rightTable: '',
      rightColumn: '',
    });
  };
  
  // Select a join for editing
  const handleSelectJoin = (join: QueryJoin) => {
    setSelectedJoinId(join.id);
    
    setJoinForm({
      type: join.type,
      table: join.table,
      alias: join.alias || '',
      leftTable: join.on.leftTable,
      leftColumn: join.on.leftColumn,
      rightTable: join.on.rightTable,
      rightColumn: join.on.rightColumn,
    });
  };
  
  // Update an existing join
  const handleUpdateJoin = () => {
    if (!selectedJoinId) return;
    
    if (!joinForm.table || !joinForm.leftColumn || !joinForm.rightColumn) {
      alert('Please fill in all required fields');
      return;
    }
    
    updateJoin(selectedJoinId, {
      type: joinForm.type,
      table: joinForm.table,
      alias: joinForm.alias || undefined,
      on: {
        leftTable: joinForm.leftTable,
        leftColumn: joinForm.leftColumn,
        rightTable: joinForm.table,
        rightColumn: joinForm.rightColumn,
      },
    });
    
    // Reset form and selection
    setSelectedJoinId(null);
    setJoinForm({
      type: 'INNER',
      table: '',
      alias: '',
      leftTable: queryState.selectedTable,
      leftColumn: '',
      rightTable: '',
      rightColumn: '',
    });
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setSelectedJoinId(null);
    setJoinForm({
      type: 'INNER',
      table: '',
      alias: '',
      leftTable: queryState.selectedTable,
      leftColumn: '',
      rightTable: '',
      rightColumn: '',
    });
  };
  
  // Remove a join
  const handleRemoveJoin = (id: string) => {
    if (selectedJoinId === id) {
      handleCancelEdit();
    }
    removeJoin(id);
  };
  
  // Clear all joins
  const handleClearJoins = () => {
    if (window.confirm('Are you sure you want to remove all joins?')) {
      clearJoins();
      handleCancelEdit();
    }
  };
  
  // Get join type display
  const getJoinTypeDisplay = (type: string) => {
    switch (type) {
      case 'INNER': return 'Inner Join';
      case 'LEFT': return 'Left Join';
      case 'RIGHT': return 'Right Join';
      case 'FULL': return 'Full Join';
      default: return type;
    }
  };
  
  // Get join type badge color
  const getJoinTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'INNER': return 'blue';
      case 'LEFT': return 'green';
      case 'RIGHT': return 'yellow';
      case 'FULL': return 'purple';
      default: return 'gray';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Join builder form */}
      <Card className="p-4 max-w-3xl">
        <h3 className="text-lg font-medium mb-4">
          {selectedJoinId ? 'Edit Join' : 'Add Join'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Join type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Join Type
            </label>
            <Select
              value={joinForm.type}
              onChange={(e) => handleFormChange('type', e.target.value)}
              options={[
                { value: 'INNER', label: 'Inner Join' },
                { value: 'LEFT', label: 'Left Join' },
                { value: 'RIGHT', label: 'Right Join' },
                { value: 'FULL', label: 'Full Join' },
              ]}
            />
          </div>
          
          {/* Join table */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Join Table
            </label>
            <Select
              value={joinForm.table}
              onChange={(e) => handleFormChange('table', e.target.value)}
              options={[
                { value: '', label: 'Select table...' },
                ...availableTables
                  .filter(table => table !== queryState.selectedTable) // Don't join to the same table
                  .filter(table => 
                    // Filter out tables already joined (unless editing this join)
                    !queryState.joins.some(j => 
                      j.table === table && (!selectedJoinId || j.id !== selectedJoinId)
                    )
                  )
                  .map(table => ({ value: table, label: table }))
              ]}
            />
          </div>
          
          {/* Table alias */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Table Alias (Optional)
            </label>
            <input
              type="text"
              value={joinForm.alias}
              onChange={(e) => handleFormChange('alias', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              placeholder="Enter alias..."
            />
          </div>
        </div>
        
        <h4 className="font-medium mb-2 mt-4">Join Condition</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Left table (already selected) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Left Table
            </label>
            <Select
              value={joinForm.leftTable}
              onChange={(e) => handleFormChange('leftTable', e.target.value)}
              options={[
                { value: queryState.selectedTable, label: queryState.selectedTable },
                ...queryState.joins.map(join => ({
                  value: join.table,
                  label: join.alias ? `${join.table} (${join.alias})` : join.table
                }))
              ]}
            />
          </div>
          
          {/* Left column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Left Column
            </label>
            <Select
              value={joinForm.leftColumn}
              onChange={(e) => handleFormChange('leftColumn', e.target.value)}
              options={[
                { value: '', label: 'Select column...' },
                ...(tableColumns[joinForm.leftTable] || []).map(col => ({
                  value: col,
                  label: col
                }))
              ]}
            />
          </div>
          
          {/* Right table (selected in the form) */}
          <div className="hidden">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Right Table
            </label>
            <input
              type="text"
              value={joinForm.table}
              readOnly
              className="block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300 text-sm"
            />
          </div>
          
          {/* Right column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Right Column
            </label>
            <Select
              value={joinForm.rightColumn}
              onChange={(e) => handleFormChange('rightColumn', e.target.value)}
              options={[
                { value: '', label: 'Select column...' },
                ...(tableColumns[joinForm.table] || []).map(col => ({
                  value: col,
                  label: col
                }))
              ]}
              disabled={!joinForm.table}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          {selectedJoinId ? (
            <>
              <Button
                variant="secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateJoin}
                disabled={!joinForm.table || !joinForm.leftColumn || !joinForm.rightColumn}
              >
                Update Join
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={handleAddJoin}
              disabled={!joinForm.table || !joinForm.leftColumn || !joinForm.rightColumn}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Join
            </Button>
          )}
        </div>
      </Card>
      
      {/* Active joins */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">
            Active Joins
          </h3>
          {queryState.joins.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearJoins}
            >
              Clear All
            </Button>
          )}
        </div>
        
        {queryState.joins.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No joins added yet.
          </p>
        ) : (
          <div className="space-y-2">
            {queryState.joins.map(join => (
              <Card
                key={join.id}
                className={`p-3 ${selectedJoinId === join.id ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge color={getJoinTypeBadgeColor(join.type)} size="sm">
                        {getJoinTypeDisplay(join.type)}
                      </Badge>
                      <span className="font-medium">
                        {join.alias ? `${join.table} AS ${join.alias}` : join.table}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {`${join.on.leftTable}.${join.on.leftColumn} = ${join.on.rightTable}.${join.on.rightColumn}`}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => handleSelectJoin(join)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => handleRemoveJoin(join.id)}
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
      
      {/* Join visualization */}
      {queryState.joins.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">
            Join Relationships
          </h3>
          
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 max-w-3xl overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Simple visualization of join relationships */}
              <div className="flex flex-col items-center">
                <div className="py-2 px-4 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4">
                  <strong>{queryState.selectedTable}</strong>
                </div>
                
                {queryState.joins.map((join, index) => (
                  <div key={join.id} className="w-full">
                    {/* Arrow */}
                    <div className="flex justify-center my-2">
                      <div className="h-6 border-l-2 border-gray-400 dark:border-gray-500"></div>
                    </div>
                    
                    {/* Join type indicator */}
                    <div className="flex justify-center mb-2">
                      <Badge color={getJoinTypeBadgeColor(join.type)}>
                        {getJoinTypeDisplay(join.type)}
                      </Badge>
                    </div>
                    
                    {/* Join condition */}
                    <div className="flex justify-center mb-2 text-sm text-gray-600 dark:text-gray-400">
                      {`ON ${join.on.leftTable}.${join.on.leftColumn} = ${join.on.rightTable}.${join.on.rightColumn}`}
                    </div>
                    
                    {/* Joined table */}
                    <div className="flex justify-center">
                      <div className="py-2 px-4 bg-green-100 dark:bg-green-900 rounded-lg">
                        <strong>{join.alias ? `${join.table} AS ${join.alias}` : join.table}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinBuilder;
