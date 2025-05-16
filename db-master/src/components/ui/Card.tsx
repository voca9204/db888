import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
  bordered?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  footer,
  headerAction,
  noPadding = false,
  bordered = false,
  className = '',
  ...rest
}) => {
  const hasHeader = title || subtitle || headerAction;
  const baseClasses = 'bg-white dark:bg-dark-600 rounded-lg shadow-card overflow-hidden';
  const borderClass = bordered ? 'border border-gray-200 dark:border-dark-400' : '';
  
  return (
    <div 
      className={`${baseClasses} ${borderClass} ${className}`}
      {...rest}
    >
      {hasHeader && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-400 flex justify-between items-start">
          <div>
            {title && <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-dark-700 border-t border-gray-200 dark:border-dark-400">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
