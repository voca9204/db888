import React, { forwardRef } from 'react';
import { cx } from '../../utils/classNames';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: 'sm' | 'md' | 'lg';
  error?: string | boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
  const { 
    className,
    size = 'md',
    error,
    ...rest
  } = props;
  
  return (
    <div className="w-full">
      <textarea
        ref={ref}
        className={cx(
          'w-full rounded-md border',
          'bg-white dark:bg-gray-900',
          'text-gray-900 dark:text-gray-100',
          'placeholder-gray-400 dark:placeholder-gray-500',
          'shadow-sm',
          'focus:border-primary-500 focus:ring-primary-500',
          'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
          size === 'sm' ? 'px-2 py-1 text-xs' : '',
          size === 'md' ? 'px-3 py-2 text-sm' : '',
          size === 'lg' ? 'px-4 py-3 text-base' : '',
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-700',
          className
        )}
        {...rest}
      />
      {typeof error === 'string' && error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;