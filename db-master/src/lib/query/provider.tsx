import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './client';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider component
 * 
 * Wraps the application with React Query's QueryClientProvider
 * to enable React Query throughout the application.
 */
const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;
