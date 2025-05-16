import React, { useState, useEffect } from 'react';
import { Select, Button } from '../../ui';
import useQueryStore from '../../../store/core/queryStore';
import { useSchemaStore } from '../../../store';

interface TableSelectorProps {
  connectionId: string;
}

const TableSelector: React.FC<TableSelectorProps> = ({ connectionId }) => {
  const { queryState, setSelectedTable, resetQuery } = useQueryStore();
  const { getSchema } = useSchemaStore();
  
  // State for available tables
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  
  // Load available tables when connection changes
  useEffect(() => {
    if (!connectionId) return;
    
    const schemaData = getSchema(connectionId);
    if (schemaData?.schema?.tables) {
      const tableNames = Object.keys(schemaData.schema.tables);
      setAvailableTables(tableNames);
    }
  }, [connectionId, getSchema]);
  
  // Handle table change
  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTable = e.target.value;
    
    // If table is different, reset the query and select the new table
    if (newTable !== queryState.selectedTable) {
      resetQuery();
      setSelectedTable(newTable);
    }
  };
  
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <Select
          id="tableSelect"
          label="Select Table"
          value={queryState.selectedTable || ''}
          onChange={handleTableChange}
          disabled={availableTables.length === 0}
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
      </div>
      
      {queryState.selectedTable && (
        <Button
          variant="secondary"
          onClick={() => resetQuery()}
        >
          Reset Query
        </Button>
      )}
    </div>
  );
};

export default TableSelector;
