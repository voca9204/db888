import React, { useState, useEffect } from 'react';
import { Button, Select, Card } from '../../ui';
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import useQueryStore from '../../../store/core/queryStore';
import { useSchemaStore } from '../../../store';
import { QueryOrder } from '../../../types/store';

interface OrderByBuilderProps {
  connectionId: string;
}

const OrderByBuilder: React.FC<OrderByBuilderProps> = ({ connectionId }) => {
  const { getSchema } = useSchemaStore();
  const { queryState, addOrderBy, updateOrderBy, removeOrderBy, clearOrderBy } = useQueryStore();
  
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // New order form state
  const [orderForm, setOrderForm] = useState({
    table: queryState.selectedTable,
    column: '',
    direction: 'ASC' as 'ASC' | 'DESC',
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
    setOrderForm(prev => ({
      ...prev,
      table: queryState.selectedTable,
      column: '',
    }));
  }, [queryState.selectedTable]);
  
  // Handle form changes
  const handleFormChange = (field: string, value: string) => {
    setOrderForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Add a new order by
  const handleAddOrderBy = () => {
    if (!orderForm.column) {
      alert('Please select a column');
      return;
    }
    
    addOrderBy({
      table: orderForm.table,
      column: orderForm.column,
      direction: orderForm.direction,
    });
    
    // Reset form
    setOrderForm({
      table: queryState.selectedTable,
      column: '',
      direction: 'ASC',
    });
  };
  
  // Select an order for editing
  const handleSelectOrder = (order: QueryOrder) => {
    setSelectedOrderId(order.id);
    
    setOrderForm({
      table: order.table,
      column: order.column,
      direction: order.direction,
    });
  };
  
  // Update an existing order
  const handleUpdateOrderBy = () => {
    if (!selectedOrderId) return;
    
    if (!orderForm.column) {
      alert('Please select a column');
      return;
    }
    
    updateOrderBy(selectedOrderId, {
      table: orderForm.table,
      column: orderForm.column,
      direction: orderForm.direction,
    });
    
    // Reset form and selection
    setSelectedOrderId(null);
    setOrderForm({
      table: queryState.selectedTable,
      column: '',
      direction: 'ASC',
    });
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setSelectedOrderId(null);
    setOrderForm({
      table: queryState.selectedTable,
      column: '',
      direction: 'ASC',
    });
  };
  
  // Remove an order
  const handleRemoveOrderBy = (id: string) => {
    if (selectedOrderId === id) {
      handleCancelEdit();
    }
    removeOrderBy(id);
  };
  
  // Clear all order by clauses
  const handleClearOrderBy = () => {
    if (window.confirm('Are you sure you want to remove all order by clauses?')) {
      clearOrderBy();
      handleCancelEdit();
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Order by builder form */}
      <Card className="p-4 max-w-3xl">
        <h3 className="text-lg font-medium mb-4">
          {selectedOrderId ? 'Edit Order By' : 'Add Order By'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Table selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Table
            </label>
            <Select
              value={orderForm.table}
              onChange={(e) => handleFormChange('table', e.target.value)}
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
              value={orderForm.column}
              onChange={(e) => handleFormChange('column', e.target.value)}
              options={[
                { value: '', label: 'Select column...' },
                ...(tableColumns[orderForm.table] || []).map(col => ({
                  value: col,
                  label: col
                }))
              ]}
            />
          </div>
          
          {/* Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Direction
            </label>
            <Select
              value={orderForm.direction}
              onChange={(e) => handleFormChange('direction', e.target.value as 'ASC' | 'DESC')}
              options={[
                { value: 'ASC', label: 'Ascending' },
                { value: 'DESC', label: 'Descending' },
              ]}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          {selectedOrderId ? (
            <>
              <Button
                variant="secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateOrderBy}
                disabled={!orderForm.column}
              >
                Update Order
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={handleAddOrderBy}
              disabled={!orderForm.column}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Order
            </Button>
          )}
        </div>
      </Card>
      
      {/* Active order by clauses */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">
            Active ORDER BY Clauses
          </h3>
          {queryState.orderBy.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearOrderBy}
            >
              Clear All
            </Button>
          )}
        </div>
        
        {queryState.orderBy.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No ORDER BY clauses added yet.
          </p>
        ) : (
          <div className="space-y-2">
            {queryState.orderBy.map(order => (
              <Card
                key={order.id}
                className={`p-3 ${selectedOrderId === order.id ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="mr-2">
                      {order.direction === 'ASC' ? (
                        <ArrowUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowDownIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {`${order.table}.${order.column}`}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {order.direction === 'ASC' ? 'Ascending' : 'Descending'}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => handleSelectOrder(order)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => handleRemoveOrderBy(order.id)}
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
      
      {/* Order explanation */}
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-md p-4 text-sm text-blue-800 dark:text-blue-200">
        <h4 className="font-medium mb-2">About ORDER BY</h4>
        <p className="mb-2">
          The ORDER BY clause specifies the order in which the query results are returned.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Add multiple ORDER BY clauses to sort by multiple columns</li>
          <li>The order of clauses in the list determines the sort priority</li>
          <li>ASC (ascending) sorts from lowest to highest values</li>
          <li>DESC (descending) sorts from highest to lowest values</li>
        </ul>
      </div>
    </div>
  );
};

export default OrderByBuilder;
