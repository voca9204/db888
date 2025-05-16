import React from 'react';
import { Badge } from '../../ui';

/**
 * Custom cell renderers for different data types
 */

// Text cell with truncation
export const TextCell: React.FC<{ value: string }> = ({ value }) => {
  if (!value) return null;
  
  // Long text truncation
  if (value.length > 100) {
    return (
      <div className="relative group">
        <span className="truncate block max-w-md">{value.substring(0, 100)}...</span>
        <div className="hidden group-hover:block absolute z-10 bg-white dark:bg-gray-800 p-2 border dark:border-gray-600 rounded shadow-lg max-w-lg">
          {value}
        </div>
      </div>
    );
  }
  
  return <span>{value}</span>;
};

// Numeric cell with formatting
export const NumberCell: React.FC<{ value: number }> = ({ value }) => {
  return <span className="font-mono">{value.toLocaleString()}</span>;
};

// Date cell
export const DateCell: React.FC<{ value: Date | string }> = ({ value }) => {
  try {
    const date = value instanceof Date ? value : new Date(value);
    return <span>{date.toLocaleDateString()}</span>;
  } catch (e) {
    return <span>{String(value)}</span>;
  }
};

// DateTime cell
export const DateTimeCell: React.FC<{ value: Date | string }> = ({ value }) => {
  try {
    const date = value instanceof Date ? value : new Date(value);
    return <span>{date.toLocaleString()}</span>;
  } catch (e) {
    return <span>{String(value)}</span>;
  }
};

// Boolean cell
export const BooleanCell: React.FC<{ value: boolean }> = ({ value }) => {
  return (
    <span 
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        value 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      }`}
    >
      {value ? 'Yes' : 'No'}
    </span>
  );
};

// Status cell with color coding
export const StatusCell: React.FC<{ value: string }> = ({ value }) => {
  let color = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  
  if (!value) return null;
  
  const status = value.toLowerCase();
  
  switch (status) {
    case 'active':
    case 'online':
    case 'completed':
    case 'approved':
    case 'success':
      color = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      break;
    case 'pending':
    case 'in-progress':
    case 'waiting':
      color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      break;
    case 'inactive':
    case 'offline':
    case 'disabled':
    case 'archived':
      color = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      break;
    case 'error':
    case 'failed':
    case 'rejected':
      color = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      break;
    case 'warning':
      color = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      break;
    case 'info':
    case 'new':
      color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      break;
  }
  
  return (
    <Badge variant="custom" className={color}>
      {value}
    </Badge>
  );
};

// JSON cell
export const JsonCell: React.FC<{ value: any }> = ({ value }) => {
  const jsonString = JSON.stringify(value);
  
  return (
    <div className="relative group">
      <span className="truncate block max-w-md">{jsonString.substring(0, 50)}...</span>
      <div className="hidden group-hover:block absolute z-10 bg-white dark:bg-gray-800 p-2 border dark:border-gray-600 rounded shadow-lg max-w-lg">
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
      </div>
    </div>
  );
};

// NULL value cell
export const NullCell: React.FC = () => {
  return <span className="text-gray-400 italic">NULL</span>;
};

// Helper function to determine the appropriate cell renderer based on value and type
export const getCellRenderer = (value: any, type: string) => {
  // Null check first
  if (value === null || value === undefined) {
    return <NullCell />;
  }
  
  // Try to use column type info
  const lowerType = type.toLowerCase();
  
  // JSON or object value
  if (typeof value === 'object' && !(value instanceof Date)) {
    return <JsonCell value={value} />;
  }
  
  // Determine by column type
  if (lowerType === 'date') {
    return <DateCell value={value} />;
  } else if (lowerType.includes('datetime') || lowerType.includes('timestamp')) {
    return <DateTimeCell value={value} />;
  } else if (
    lowerType.includes('int') || 
    lowerType.includes('decimal') || 
    lowerType.includes('float') || 
    lowerType.includes('double') || 
    lowerType.includes('numeric')
  ) {
    return <NumberCell value={Number(value)} />;
  } else if (lowerType === 'boolean' || lowerType === 'bit(1)' || lowerType === 'tinyint(1)') {
    return <BooleanCell value={Boolean(value)} />;
  } else if (
    lowerType === 'enum' && 
    (
      String(value).toLowerCase() === 'active' ||
      String(value).toLowerCase() === 'pending' ||
      String(value).toLowerCase() === 'completed' ||
      String(value).toLowerCase() === 'archived' ||
      String(value).toLowerCase() === 'error' ||
      String(value).toLowerCase() === 'warning' ||
      String(value).toLowerCase() === 'info'
    )
  ) {
    return <StatusCell value={String(value)} />;
  } else if (
    (lowerType.includes('char') || lowerType.includes('text')) && 
    String(value).length > 50
  ) {
    return <TextCell value={String(value)} />;
  }
  
  // Default toString
  return <span>{String(value)}</span>;
};