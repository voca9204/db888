import React, { useState } from 'react';
import { Button, Card } from '../../ui';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  DocumentDuplicateIcon,
  EyeIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

export interface RowDetailViewProps {
  rowData: Record<string, any>;
  title?: string;
  onClose?: () => void;
  onCopy?: () => void;
  onEdit?: () => void;
}

type ViewMode = 'grid' | 'json' | 'table';

const RowDetailView: React.FC<RowDetailViewProps> = ({
  rowData,
  title = 'Row Details',
  onClose,
  onCopy,
  onEdit
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  
  // Group the fields by category (if any) or use default grouping
  const getFieldGroups = () => {
    const groups: Record<string, Array<[string, any]>> = {
      'Primary Information': [],
      'Details': [],
      'System Fields': []
    };
    
    // Sort fields into groups based on naming conventions
    Object.entries(rowData).forEach(([key, value]) => {
      if (key.includes('id') || key.includes('key') || key.includes('name')) {
        groups['Primary Information'].push([key, value]);
      } else if (key.includes('created') || key.includes('updated') || key.includes('timestamp')) {
        groups['System Fields'].push([key, value]);
      } else {
        groups['Details'].push([key, value]);
      }
    });
    
    // Return only groups that have fields
    return Object.entries(groups).filter(([_, fields]) => fields.length > 0);
  };
  
  // Toggle group expansion
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };
  
  // Format value for display
  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">NULL</span>;
    }
    
    if (typeof value === 'object') {
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return String(value);
  };
  
  // Copy row data to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(rowData, null, 2))
      .then(() => {
        alert('Row data copied to clipboard!');
        if (onCopy) onCopy();
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy data to clipboard');
      });
  };
  
  // Render grid view
  const renderGridView = () => {
    const groups = getFieldGroups();
    
    return (
      <div className="space-y-4">
        {groups.map(([groupName, fields]) => (
          <div key={groupName} className="border dark:border-gray-700 rounded-md overflow-hidden">
            <div 
              className="bg-gray-50 dark:bg-gray-800 p-3 flex justify-between cursor-pointer"
              onClick={() => toggleGroup(groupName)}
            >
              <h3 className="font-medium text-gray-700 dark:text-gray-300">{groupName}</h3>
              {expandedGroups.includes(groupName) ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </div>
            
            {expandedGroups.includes(groupName) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {fields.map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <div className="font-medium text-gray-700 dark:text-gray-300">{key}</div>
                    <div className="text-gray-900 dark:text-gray-100 break-all">
                      {formatValue(value)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // Render JSON view
  const renderJsonView = () => {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {JSON.stringify(rowData, null, 2)}
        </pre>
      </div>
    );
  };
  
  // Render table view
  const renderTableView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Field
              </th>
              <th 
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {Object.entries(rowData).map(([key, value]) => (
              <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">
                  {key}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                  {formatValue(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <Card title={title}>
      <div className="p-4 space-y-4">
        {/* View toggle buttons */}
        <div className="flex justify-between items-center border-b dark:border-gray-700 pb-4">
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('grid')}
            >
              <ArrowsRightLeftIcon className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'json' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('json')}
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              JSON
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('table')}
            >
              <ArrowsRightLeftIcon className="h-4 w-4 mr-1" />
              Table
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={copyToClipboard}
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
              Copy
            </Button>
            
            {onEdit && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onEdit}
              >
                Edit
              </Button>
            )}
            
            {onClose && (
              <Button
                size="sm"
                variant="danger"
                onClick={onClose}
              >
                Close
              </Button>
            )}
          </div>
        </div>
        
        {/* Content based on view mode */}
        <div>
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'json' && renderJsonView()}
          {viewMode === 'table' && renderTableView()}
        </div>
      </div>
    </Card>
  );
};

export default RowDetailView;