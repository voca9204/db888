import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui';
import { DataTable } from '../components/data/browser';
import { useDbConnectionStore, useSchemaStore } from '../store';

// Mock data for development
const MOCK_TABLES = [
  { name: 'users', rowCount: 1500 },
  { name: 'products', rowCount: 3200 },
  { name: 'orders', rowCount: 8700 },
  { name: 'customers', rowCount: 2100 },
  { name: 'categories', rowCount: 45 },
  { name: 'suppliers', rowCount: 120 },
  { name: 'inventory', rowCount: 4300 },
];

const TableBrowser: React.FC = () => {
  const { connections, activeConnectionId, getConnection } = useDbConnectionStore();
  const { getSchema } = useSchemaStore();
  const [tables, setTables] = useState<{ name: string; rowCount: number }[]>([]);
  
  const activeConnection = activeConnectionId ? getConnection(activeConnectionId) : undefined;
  
  // Load tables for the active connection
  useEffect(() => {
    // For development, use mock data if no active connection
    if (process.env.NODE_ENV === 'development' && !activeConnectionId) {
      setTables(MOCK_TABLES);
      return;
    }
    
    if (activeConnectionId) {
      const schemaData = getSchema(activeConnectionId);
      if (schemaData?.schema?.tables) {
        const tablesData = Object.entries(schemaData.schema.tables).map(([name, table]: [string, any]) => ({
          name,
          rowCount: table.rowCount || 0
        }));
        setTables(tablesData);
      } else {
        // Fallback to mock data for development
        if (process.env.NODE_ENV === 'development') {
          setTables(MOCK_TABLES);
        } else {
          setTables([]);
        }
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        setTables(MOCK_TABLES);
      } else {
        setTables([]);
      }
    }
  }, [activeConnectionId, getSchema]);
  
  const mockConnectionId = 'mock-connection-1';
  
  // In development, always show a connection interface
  if (!activeConnectionId && process.env.NODE_ENV !== 'development') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Table Browser</h1>
        </div>
        
        <Card title="Connection Required">
          <p className="text-gray-600 dark:text-gray-300 py-4">
            Please select a database connection to view tables.
          </p>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Table Browser</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Connected to: <span className="font-semibold text-primary-600 dark:text-primary-400">
            {activeConnection?.name || "Development Database (Mock)"}
          </span>
        </div>
      </div>
      
      {tables.length === 0 ? (
        <Card title="No Tables Found">
          <p className="text-gray-600 dark:text-gray-300 py-4">
            No tables found in the selected database. Please ensure your connection has tables or select a different connection.
          </p>
        </Card>
      ) : (
        <DataTable 
          connectionId={activeConnectionId || mockConnectionId} 
          tables={tables} 
        />
      )}
    </div>
  );
};

export default TableBrowser;

