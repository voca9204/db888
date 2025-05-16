import { QueryClient } from '@tanstack/react-query';

// Create a query client instance with default settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 10 minutes stale time for data that doesn't change frequently
      staleTime: 1000 * 60 * 10,
      // 1 hour cache time
      gcTime: 1000 * 60 * 60,
      // Retry failed queries 1 time before displaying error
      retry: 1,
      // Disable refetch on window focus in dev mode
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
    },
    mutations: {
      // Default options for mutations
      retry: 1,
    },
  },
});
