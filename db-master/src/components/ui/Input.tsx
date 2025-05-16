import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    leftIcon, 
    rightIcon, 
    fullWidth = false,
    className = '',
    id,
    ...rest 
  }, ref) => {
    // Generate a unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    
    const baseInputClasses = 'block bg-white dark:bg-dark-700 border rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm';
    const errorInputClasses = error ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : 'border-gray-300 dark:border-gray-600';
    const iconPaddingLeft = leftIcon ? 'pl-10' : 'pl-3';
    const iconPaddingRight = rightIcon ? 'pr-10' : 'pr-3';
    const widthClass = fullWidth ? 'w-full' : '';
    
    return (
      <div className={`${widthClass} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={`${baseInputClasses} ${errorInputClasses} ${iconPaddingLeft} ${iconPaddingRight} ${widthClass} py-2`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...rest}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="mt-1 text-xs text-danger-600" id={`${inputId}-error`}>
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" id={`${inputId}-helper`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
