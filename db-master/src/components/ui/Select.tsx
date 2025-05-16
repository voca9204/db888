import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    label, 
    options, 
    error, 
    helperText, 
    fullWidth = false,
    size = 'md',
    className = '',
    id,
    ...rest 
  }, ref) => {
    // Generate a unique ID if not provided
    const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
    
    const baseSelectClasses = 'block bg-white dark:bg-dark-700 border rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm';
    const errorSelectClasses = error ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : 'border-gray-300 dark:border-gray-600';
    const widthClass = fullWidth ? 'w-full' : '';
    
    const sizeClasses = {
      sm: 'py-1.5 text-xs',
      md: 'py-2 text-sm',
      lg: 'py-2.5 text-base',
    };
    
    return (
      <div className={`${widthClass} ${className}`}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        
        <select
          ref={ref}
          id={selectId}
          className={`${baseSelectClasses} ${errorSelectClasses} ${sizeClasses[size]} ${widthClass} pl-3 pr-10`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...rest}
        >
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {error && (
          <p className="mt-1 text-xs text-danger-600" id={`${selectId}-error`}>
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id={`${selectId}-helper`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
