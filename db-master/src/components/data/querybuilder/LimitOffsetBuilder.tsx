import React, { useState, useEffect } from 'react';
import { Button, Card } from '../../ui';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import useQueryStore from '../../../store/core/queryStore';

interface LimitOffsetBuilderProps {
  connectionId: string;
}

const LimitOffsetBuilder: React.FC<LimitOffsetBuilderProps> = ({ connectionId }) => {
  const { queryState, setLimit, setOffset, setDistinct } = useQueryStore();
  
  // Form state
  const [limitValue, setLimitValue] = useState<string>(queryState.limit?.toString() || '');
  const [offsetValue, setOffsetValue] = useState<string>(queryState.offset?.toString() || '');
  const [isDistinct, setIsDistinct] = useState<boolean>(queryState.distinct);
  
  // Sync form state with query state
  useEffect(() => {
    setLimitValue(queryState.limit?.toString() || '');
    setOffsetValue(queryState.offset?.toString() || '');
    setIsDistinct(queryState.distinct);
  }, [queryState.limit, queryState.offset, queryState.distinct]);
  
  // Handle limit change
  const handleLimitChange = (value: string) => {
    setLimitValue(value);
    
    // Convert to number or undefined
    const numValue = value === '' ? undefined : parseInt(value, 10);
    
    // Only update if valid number or undefined
    if (numValue === undefined || (!isNaN(numValue) && numValue >= 0)) {
      setLimit(numValue);
    }
  };
  
  // Handle offset change
  const handleOffsetChange = (value: string) => {
    setOffsetValue(value);
    
    // Convert to number or undefined
    const numValue = value === '' ? undefined : parseInt(value, 10);
    
    // Only update if valid number or undefined
    if (numValue === undefined || (!isNaN(numValue) && numValue >= 0)) {
      setOffset(numValue);
    }
  };
  
  // Handle distinct toggle
  const handleDistinctToggle = () => {
    const newValue = !isDistinct;
    setIsDistinct(newValue);
    setDistinct(newValue);
  };
  
  // Clear limit and offset
  const handleClear = () => {
    setLimitValue('');
    setOffsetValue('');
    setLimit(undefined);
    setOffset(undefined);
  };
  
  return (
    <div className="space-y-6">
      <Card className="p-4 max-w-3xl">
        <h3 className="text-lg font-medium mb-4">
          Query Modifiers
        </h3>
        
        <div className="space-y-4">
          {/* DISTINCT toggle */}
          <div>
            <div className="flex items-center mb-4">
              <input
                id="distinct-checkbox"
                type="checkbox"
                checked={isDistinct}
                onChange={handleDistinctToggle}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
              />
              <label
                htmlFor="distinct-checkbox"
                className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Use DISTINCT (remove duplicate rows)
              </label>
            </div>
          </div>
          
          {/* LIMIT input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              LIMIT (Maximum number of rows)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="0"
                value={limitValue}
                onChange={(e) => handleLimitChange(e.target.value)}
                placeholder="No limit"
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              />
              <select
                value={limitValue}
                onChange={(e) => handleLimitChange(e.target.value)}
                className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              >
                <option value="">Custom</option>
                <option value="10">10 rows</option>
                <option value="50">50 rows</option>
                <option value="100">100 rows</option>
                <option value="500">500 rows</option>
                <option value="1000">1,000 rows</option>
              </select>
            </div>
          </div>
          
          {/* OFFSET input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              OFFSET (Number of rows to skip)
            </label>
            <input
              type="number"
              min="0"
              value={offsetValue}
              onChange={(e) => handleOffsetChange(e.target.value)}
              placeholder="No offset"
              className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            />
          </div>
          
          {/* Clear button */}
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={handleClear}
              disabled={!limitValue && !offsetValue}
              size="sm"
            >
              Clear Limit/Offset
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Information section */}
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-md p-4 text-sm text-blue-800 dark:text-blue-200">
        <h4 className="font-medium mb-2 flex items-center">
          <InformationCircleIcon className="h-5 w-5 mr-1" />
          About DISTINCT, LIMIT and OFFSET
        </h4>
        
        <div className="space-y-3">
          <div>
            <h5 className="font-medium">DISTINCT</h5>
            <p>
              The DISTINCT keyword removes duplicate rows from your result set. Only unique rows are returned.
            </p>
          </div>
          
          <div>
            <h5 className="font-medium">LIMIT</h5>
            <p>
              The LIMIT clause restricts the number of rows returned by a query. This is useful for:
            </p>
            <ul className="list-disc pl-5 mt-1">
              <li>Pagination</li>
              <li>Improving query performance</li>
              <li>Getting only the top N results</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium">OFFSET</h5>
            <p>
              The OFFSET clause specifies the number of rows to skip before starting to return rows. This is commonly used with LIMIT for pagination:
            </p>
            <ul className="list-disc pl-5 mt-1">
              <li>Page 1: LIMIT 10 OFFSET 0</li>
              <li>Page 2: LIMIT 10 OFFSET 10</li>
              <li>Page 3: LIMIT 10 OFFSET 20</li>
            </ul>
          </div>
          
          <p className="text-xs italic">
            Note: For large offsets, performance may degrade as the database still needs to scan through all the skipped rows.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LimitOffsetBuilder;