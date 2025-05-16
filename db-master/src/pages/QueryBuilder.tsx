import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button } from '../components/ui';
import { QueryBuilder as VisualQueryBuilder, QueryResults } from '../components/data';
import { useDbConnectionStore, useSchemaStore } from '../store';
import { CheckIcon, BeakerIcon } from '@heroicons/react/24/outline';

const QueryBuilder: React.FC = () => {
  const { getActiveConnection, connections } = useDbConnectionStore();
  const { getSchema } = useSchemaStore();
  const activeConnection = getActiveConnection();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('builder');
  
  // State for query results (mock for now)
  const [queryResults, setQueryResults] = useState<{
    columns: { name: string; type: string }[];
    rows: any[];
    total: number;
    executionTime?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for example queries
  const [showExamples, setShowExamples] = useState(false);
  
  // Fake query execution
  const executeQuery = (sql: string) => {
    setIsLoading(true);
    setError(null);
    
    // Simulate query execution
    setTimeout(() => {
      try {
        // For demo purposes, create some fake results
        setQueryResults({
          columns: [
            { name: 'id', type: 'int' },
            { name: 'name', type: 'varchar' },
            { name: 'created_at', type: 'datetime' },
            { name: 'status', type: 'enum' },
            { name: 'value', type: 'decimal' },
          ],
          rows: Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            name: `Item ${i + 1}`,
            created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            status: ['active', 'pending', 'completed', 'archived'][Math.floor(Math.random() * 4)],
            value: parseFloat((Math.random() * 1000).toFixed(2)),
          })),
          total: 25,
          executionTime: Math.random() * 500 + 50, // 50-550ms
        });
        setIsLoading(false);
        
        // Auto-switch to results tab when query is executed
        setActiveTab('results');
      } catch (err) {
        setError('An error occurred while executing the query');
        setIsLoading(false);
      }
    }, 1500); // Simulate a network delay
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Query Builder</h1>
        
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowExamples(!showExamples)}
          >
            {showExamples ? 'Hide Examples' : 'Show Examples'}
          </Button>
          
          <Button
            size="sm"
            variant="primary"
            onClick={() => executeQuery('SELECT * FROM example_table')}
            disabled={!activeConnection}
          >
            <BeakerIcon className="h-4 w-4 mr-1" />
            Execute Sample Query
          </Button>
        </div>
      </div>
      
      {/* Connection required message */}
      {!activeConnection && (
        <Card>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 p-4 rounded-md">
            <p className="font-medium">No active connection</p>
            <p className="text-sm mt-1">Please select a database connection to use the query builder.</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => window.location.pathname = '/connections'}
            >
              Go to Connections
            </Button>
          </div>
        </Card>
      )}
      
      {/* Example queries */}
      {showExamples && (
        <Card title="Example Queries">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                setShowExamples(false);
                executeQuery('SELECT * FROM users LIMIT 10');
              }}
            >
              <h3 className="text-md font-semibold mb-2">Basic Select</h3>
              <pre className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-2 rounded">
                SELECT * FROM users LIMIT 10
              </pre>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                setShowExamples(false);
                executeQuery('SELECT id, name, created_at FROM users WHERE status = "active" ORDER BY created_at DESC LIMIT 20');
              }}
            >
              <h3 className="text-md font-semibold mb-2">Filtered Select</h3>
              <pre className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-2 rounded">
                {`SELECT id, name, created_at
FROM users
WHERE status = "active"
ORDER BY created_at DESC
LIMIT 20`}
              </pre>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                setShowExamples(false);
                executeQuery('SELECT u.id, u.name, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.name HAVING COUNT(o.id) > 0');
              }}
            >
              <h3 className="text-md font-semibold mb-2">Join with Aggregation</h3>
              <pre className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-2 rounded">
                {`SELECT u.id, u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 0`}
              </pre>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                setShowExamples(false);
                executeQuery('SELECT product_category, SUM(amount) as total_sales FROM sales WHERE sale_date BETWEEN "2023-01-01" AND "2023-12-31" GROUP BY product_category ORDER BY total_sales DESC');
              }}
            >
              <h3 className="text-md font-semibold mb-2">Sales Report</h3>
              <pre className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-2 rounded">
                {`SELECT product_category, SUM(amount) as total_sales
FROM sales
WHERE sale_date BETWEEN "2023-01-01" AND "2023-12-31"
GROUP BY product_category
ORDER BY total_sales DESC`}
              </pre>
            </div>
          </div>
        </Card>
      )}
      
      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'builder', label: 'Query Builder' },
          { id: 'results', label: 'Results', disabled: !queryResults },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      
      {/* Tab content */}
      <div>
        {activeTab === 'builder' && (
          <>
            <VisualQueryBuilder connectionId={activeConnection?.id} />
            
            <Card title="Query Editor Tips" className="mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p>
                  <CheckIcon className="h-4 w-4 inline-block mr-1 text-green-500" />
                  Select tables and columns to query from the visual interface.
                </p>
                <p>
                  <CheckIcon className="h-4 w-4 inline-block mr-1 text-green-500" />
                  Add conditions to filter your data using the Conditions tab.
                </p>
                <p>
                  <CheckIcon className="h-4 w-4 inline-block mr-1 text-green-500" />
                  Review the generated SQL and click Execute to run your query.
                </p>
                <p>
                  <CheckIcon className="h-4 w-4 inline-block mr-1 text-green-500" />
                  You can edit the SQL directly in the SQL Preview section.
                </p>
              </div>
            </Card>
          </>
        )}
        
        {activeTab === 'results' && (
          <QueryResults
            data={queryResults || undefined}
            isLoading={isLoading}
            error={error || undefined}
          />
        )}
      </div>
    </div>
  );
};

export default QueryBuilder;
