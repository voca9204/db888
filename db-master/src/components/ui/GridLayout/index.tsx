import React from 'react';

interface GridLayoutProps {
  children: React.ReactNode;
  className?: string;
}

interface GridSectionProps {
  children: React.ReactNode;
  className?: string;
}

interface GridItemProps {
  children: React.ReactNode;
  colSpan?: number;
  className?: string;
}

export const GridLayout: React.FC<GridLayoutProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`grid gap-6 ${className}`}>
      {children}
    </div>
  );
};

export const GridSection: React.FC<GridSectionProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`grid grid-cols-12 gap-6 ${className}`}>
      {children}
    </div>
  );
};

export const GridItem: React.FC<GridItemProps> = ({ 
  children, 
  colSpan = 12, 
  className = '' 
}) => {
  return (
    <div className={`col-span-12 md:col-span-${colSpan} ${className}`}>
      {children}
    </div>
  );
};
