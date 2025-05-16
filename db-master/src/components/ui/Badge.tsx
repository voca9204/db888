import React from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  icon?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = false,
  icon,
  className = '',
  ...rest
}) => {
  const baseClasses = 'inline-flex items-center font-medium';
  
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
    secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-300',
    success: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300',
    danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-300',
    warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };
  
  const roundedClass = rounded ? 'rounded-full' : 'rounded';
  
  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${roundedClass} ${className}`}
      {...rest}
    >
      {icon && <span className="mr-1.5 -ml-0.5">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
