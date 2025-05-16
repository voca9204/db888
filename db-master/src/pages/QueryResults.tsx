import React, { useState } from 'react';
import { Card, Tabs } from '../components/ui';
import { ResultsGrid, ResultsExport, RowDetailView } from '../components/data';

// Mock data for demonstration
const mockData = {
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
  executionTime: 156.78
};

// Highlight conditions for the result grid
const highlightConditions = [
  { column: 'status', operator: 'eq', value: 'completed', color: 'bg-green-100 dark:bg-green-900/20' },
  { column: 'status', operator: 'eq', value: 'archived', color: 'bg-gray-100 dark:bg-gray-700/50' },
  { column: 'value', operator: 'gt', value: 800, color: 'bg-blue-100 dark:bg-blue-900/20' },
];

const QueryResults: React.FC = () => {
  const [activeTab, setActiveTab] = useState('grid');
  const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Query Results</h1>
      </div>
      
      <Tabs
        tabs={[
          { id: 'grid', label: 'Results Grid' },
          { id: 'export', label: 'Export' },
          { id: 'visualization', label: 'Visualization' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      
      {activeTab === 'grid' && (
        <ResultsGrid 
          data={mockData}
          onRowClick={(row) => setSelectedRow(row)}
          highlightConditions={highlightConditions}
          enabledFeatures={{
            columnResizing: true,
            columnFiltering: true,
            rowSelection: true,
            columnPinning: true,
            export: true,
            globalFilter: true,
            pagination: true,
            rowHighlighting: true,
          }}
        />
      )}
      
      {activeTab === 'export' && (
        <ResultsExport 
          data={mockData.rows}
          columns={mockData.columns}
          filename="query_results"
          formats={['csv', 'json', 'sql', 'xlsx']}
        />
      )}
      
      {activeTab === 'visualization' && (
        <Card title="Visualization">
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <p>Visualization features will be implemented in a future update.</p>
            <p className="text-sm mt-2">This will include charts, graphs, and other visual representations of your query results.</p>
          </div>
        </Card>
      )}
      
      {/* Row detail modal */}
      {selectedRow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <RowDetailView 
              rowData={selectedRow}
              title="Row Details"
              onClose={() => setSelectedRow(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryResults;
