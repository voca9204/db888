import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionApi, Connection, CreateConnectionData, UpdateConnectionData } from '../../services/api';

// Query keys for connection data
export const connectionKeys = {
  all: ['connections'] as const,
  lists: () => [...connectionKeys.all, 'list'] as const,
  list: (filters: string) => [...connectionKeys.lists(), { filters }] as const,
  details: () => [...connectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...connectionKeys.details(), id] as const,
};

/**
 * Hook for fetching all connections
 */
export function useConnections() {
  return useQuery({
    queryKey: connectionKeys.lists(),
    queryFn: () => connectionApi.getConnections(),
  });
}

/**
 * Hook for fetching a single connection by ID
 * 
 * @param connectionId - ID of the connection to fetch
 */
export function useConnection(connectionId: string) {
  return useQuery({
    queryKey: connectionKeys.detail(connectionId),
    queryFn: () => connectionApi.getConnection(connectionId),
    enabled: !!connectionId, // Only run query if connectionId is provided
  });
}

/**
 * Hook for creating a new connection
 */
export function useCreateConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateConnectionData) => connectionApi.createConnection(data),
    onSuccess: (newConnection) => {
      // Invalidate connections list query to refetch
      queryClient.invalidateQueries({ queryKey: connectionKeys.lists() });
      
      // Add the new connection to the query cache
      queryClient.setQueryData(
        connectionKeys.detail(newConnection.id),
        newConnection
      );
    },
  });
}

/**
 * Hook for updating an existing connection
 */
export function useUpdateConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateConnectionData) => connectionApi.updateConnection(data),
    onSuccess: (updatedConnection) => {
      // Invalidate connections list query to refetch
      queryClient.invalidateQueries({ queryKey: connectionKeys.lists() });
      
      // Update the connection in query cache
      queryClient.setQueryData(
        connectionKeys.detail(updatedConnection.id),
        updatedConnection
      );
    },
  });
}

/**
 * Hook for deleting a connection
 */
export function useDeleteConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (connectionId: string) => connectionApi.deleteConnection(connectionId),
    onSuccess: (_, connectionId) => {
      // Invalidate connections list query to refetch
      queryClient.invalidateQueries({ queryKey: connectionKeys.lists() });
      
      // Remove the connection from query cache
      queryClient.removeQueries({ queryKey: connectionKeys.detail(connectionId) });
    },
  });
}

/**
 * Hook for testing a connection
 */
export function useTestConnection() {
  return useMutation({
    mutationFn: (data: CreateConnectionData | { id: string }) => 
      connectionApi.testConnection(data),
  });
}
