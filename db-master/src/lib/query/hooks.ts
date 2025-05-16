import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  QueryKey,
  UseQueryOptions,
  UseMutationOptions 
} from '@tanstack/react-query';
import { queryClient } from './client';

/**
 * Re-export React Query hooks and client for convenience
 */
export { 
  useQuery, 
  useMutation, 
  useQueryClient,
  queryClient
};

/**
 * Type for invalidating multiple query keys at once
 */
export type InvalidateQueryFilters = Parameters<typeof queryClient.invalidateQueries>[0];

/**
 * Custom hook for prefetching data
 * 
 * @param queryKey - The query key to prefetch
 * @param queryFn - The query function to fetch data
 */
export function usePrefetch<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>
) {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
    });
  };
}

/**
 * Custom hook for optimistic updates
 * 
 * @param mutationFn - The mutation function
 * @param options - The mutation options including onMutate for optimistic updates
 * @returns 
 */
export function useOptimisticMutation<TData, TError, TVariables, TContext>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TError, TVariables, TContext>
) {
  return useMutation({
    mutationFn,
    ...options,
    // Add any default options for optimistic mutations
  });
}

/**
 * Simplified wrapper for useQuery with better TypeScript support
 * 
 * @param queryKey - The query key
 * @param queryFn - The query function
 * @param options - Additional query options
 */
export function useAppQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

/**
 * Helper function to invalidate multiple queries at once
 * 
 * @param queryKeysToInvalidate - Array of query keys to invalidate
 */
export function invalidateQueries(queryKeysToInvalidate: QueryKey[]) {
  queryKeysToInvalidate.forEach(queryKey => {
    queryClient.invalidateQueries({ queryKey });
  });
}
