import React, { forwardRef } from 'react';
import { cx } from '../../utils/classNames';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
  const { className, label, error, id, ...rest } = props;
  
  return (
    <div className="flex items-center">
      <input
        ref={ref}
        type="checkbox"
        id={id}
        className={cx(
          'h-4 w-4 rounded',
          'border-gray-300 dark:border-gray-700',
          'text-primary-600 dark:text-primary-500',
          'focus:ring-primary-500 dark:focus:ring-primary-400',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red-500 focus:ring-red-500'
            : '',
          className
        )}
        {...rest}
      />
      {label && (
        <label
          htmlFor={id}
          className={cx(
            'ml-2 text-sm text-gray-700 dark:text-gray-300',
            'disabled:opacity-50'
          )}
        >
          {label}
        </label>
      )}
      {typeof error === 'string' && error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;