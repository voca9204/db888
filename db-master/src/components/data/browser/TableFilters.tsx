import React from 'react';

// Table filter components
export const TableFilterInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Filter...', className = '' }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-dark-400 dark:border-dark-600 dark:text-white ${className}`}
    />
  );
};

// Date range filter
export const DateRangeFilter: React.FC<{
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
}> = ({ startDate, endDate, onStartDateChange, onEndDateChange, className = '' }) => {
  return (
    <div className={`flex space-x-2 ${className}`}>
      <div className="flex-1">
        <label className="block text-xs mb-1 text-gray-500 dark:text-gray-400">Start</label>
        <input
          type="date"
          value={startDate}
          onChange={e => onStartDateChange(e.target.value)}
          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-dark-400 dark:border-dark-600 dark:text-white"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs mb-1 text-gray-500 dark:text-gray-400">End</label>
        <input
          type="date"
          value={endDate}
          onChange={e => onEndDateChange(e.target.value)}
          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-dark-400 dark:border-dark-600 dark:text-white"
        />
      </div>
    </div>
  );
};

// Number range filter
export const NumberRangeFilter: React.FC<{
  min: number | '';
  max: number | '';
  onMinChange: (value: number | '') => void;
  onMaxChange: (value: number | '') => void;
  className?: string;
}> = ({ min, max, onMinChange, onMaxChange, className = '' }) => {
  return (
    <div className={`flex space-x-2 ${className}`}>
      <div className="flex-1">
        <label className="block text-xs mb-1 text-gray-500 dark:text-gray-400">Min</label>
        <input
          type="number"
          value={min}
          onChange={e => onMinChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-dark-400 dark:border-dark-600 dark:text-white"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs mb-1 text-gray-500 dark:text-gray-400">Max</label>
        <input
          type="number"
          value={max}
          onChange={e => onMaxChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-dark-400 dark:border-dark-600 dark:text-white"
        />
      </div>
    </div>
  );
};

// Select filter for predefined values
export const SelectFilter: React.FC<{
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ options, value, onChange, placeholder = 'Select...', className = '' }) => {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-dark-400 dark:border-dark-600 dark:text-white ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

// Boolean filter (checkbox)
export const BooleanFilter: React.FC<{
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  label?: string;
  className?: string;
}> = ({ value, onChange, label = 'Filter', className = '' }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <select
        value={value === null ? '' : value ? 'true' : 'false'}
        onChange={e => {
          if (e.target.value === '') {
            onChange(null);
          } else {
            onChange(e.target.value === 'true');
          }
        }}
        className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-dark-400 dark:border-dark-600 dark:text-white"
      >
        <option value="">All</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </div>
  );
};

// Export for use in the DataBrowser component
export const TableFilters = {
  Text: TableFilterInput,
  DateRange: DateRangeFilter,
  NumberRange: NumberRangeFilter,
  Select: SelectFilter,
  Boolean: BooleanFilter
};
