import React, { useState } from 'react';
import { Card, Tabs } from '../../ui';
import useQueryStore from '../../../store/core/queryStore';
import { useDbConnectionStore, useSchemaStore } from '../../../store';
import TableSelector from './TableSelector';
import ColumnSelector from './ColumnSelector';
import ConditionBuilder from './ConditionBuilder';
import JoinBuilder from './JoinBuilder';
import GroupByBuilder from './GroupByBuilder';
import OrderByBuilder from './OrderByBuilder';
import LimitOffsetBuilder from './LimitOffsetBuilder';
import SqlPreview from './SqlPreview';

interface QueryBuilderProps {
  connectionId?: string;
}

const QueryBuilder: React.FC<QueryBuilderProps> = ({ connectionId }) => {
  const { getActiveConnection } = useDbConnectionStore();
  const { getSchema } = useSchemaStore();
  const { queryState, resetQuery } = useQueryStore();
  
  // Get connection ID from props or active connection
  const activeConnection = getActiveConnection();
  const activeConnectionId = connectionId || activeConnection?.id;
  
  // Tab state
  const [activeTab, setActiveTab] = useState('columns');
  
  // If no connection is selected, show message
  if (!activeConnectionId) {
    return (
      <Card title="Query Builder">
        <div className="text-center p-4">
          <p className="text-gray-600 dark:text-gray-300 mb-2">No connection selected.</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Please select a connection to build a query.
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card title="Visual Query Builder">
      <div className="space-y-4">
        {/* Table Selection */}
        <div className="border-b dark:border-gray-700 pb-4">
          <TableSelector connectionId={activeConnectionId} />
        </div>
        
        {/* Query Builder Tabs */}
        {queryState.selectedTable && (
          <Tabs
            tabs={[
              { id: 'columns', label: 'Columns' },
              { id: 'joins', label: 'Joins' },
              { id: 'conditions', label: 'Conditions' },
              { id: 'grouping', label: 'Grouping' },
              { id: 'ordering', label: 'Ordering' },
              { id: 'limit', label: 'Limit/Distinct' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        )}
        
        {/* Tab Content */}
        <div className="py-4">
          {queryState.selectedTable && (
            <>
              {activeTab === 'columns' && (
                <ColumnSelector connectionId={activeConnectionId} />
              )}
              {activeTab === 'conditions' && (
                <ConditionBuilder connectionId={activeConnectionId} />
              )}
              {activeTab === 'joins' && (
                <JoinBuilder connectionId={activeConnectionId} />
              )}
              {activeTab === 'grouping' && (
                <GroupByBuilder connectionId={activeConnectionId} />
              )}
              {activeTab === 'ordering' && (
                <OrderByBuilder connectionId={activeConnectionId} />
              )}
              {activeTab === 'limit' && (
                <LimitOffsetBuilder connectionId={activeConnectionId} />
              )}
            </>
          )}
          
          {!queryState.selectedTable && (
            <div className="text-gray-600 dark:text-gray-300 py-4">
              Please select a table to start building your query.
            </div>
          )}
        </div>
        
        {/* SQL Preview */}
        {queryState.selectedTable && (
          <div className="border-t dark:border-gray-700 pt-4">
            <SqlPreview connectionId={activeConnectionId} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default QueryBuilder;
