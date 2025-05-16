import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schemaApi, SchemaData } from '../../services/api';

// Query keys for schema data
export const schemaKeys = {
  all: ['schemas'] as const,
  connection: (connectionId: string) => 
    [...schemaKeys.all, { connectionId }] as const,
  detail: (connectionId: string, page?: number, pageSize?: number) => 
    [...schemaKeys.connection(connectionId), { page, pageSize }] as const,
  versions: (connectionId: string) => 
    [...schemaKeys.connection(connectionId), 'versions'] as const,
  version: (connectionId: string, versionId: string, page?: number, pageSize?: number) => 
    [...schemaKeys.connection(connectionId), 'version', versionId, { page, pageSize }] as const,
  changes: (connectionId: string, fromVersionId: string, toVersionId: string) => 
    [...schemaKeys.connection(connectionId), 'changes', fromVersionId, toVersionId] as const,
};

/**
 * Hook for fetching database schema
 * 
 * @param connectionId - ID of the connection
 * @param refresh - Whether to force refresh or use cache
 * @param page - Page number for pagination
 * @param pageSize - Page size for pagination
 */
export function useSchema(
  connectionId: string,
  refresh: boolean = false,
  page: number = 1,
  pageSize: number = 50
) {
  return useQuery({
    queryKey: schemaKeys.detail(connectionId, page, pageSize),
    queryFn: () => schemaApi.getSchema(connectionId, refresh, page, pageSize),
    enabled: !!connectionId, // Only run query if connectionId is provided
    // Don't refetch on window focus for schema data
    refetchOnWindowFocus: false,
    // Keep schema data fresh for 1 hour
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Hook for fetching schema versions
 * 
 * @param connectionId - ID of the connection
 * @param limit - Maximum number of versions to fetch
 */
export function useSchemaVersions(
  connectionId: string,
  limit: number = 10
) {
  return useQuery({
    queryKey: schemaKeys.versions(connectionId),
    queryFn: () => schemaApi.getSchemaVersions(connectionId, limit),
    enabled: !!connectionId, // Only run query if connectionId is provided
    // Don't refetch on window focus for version data
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for fetching a specific schema version
 * 
 * @param connectionId - ID of the connection
 * @param versionId - Version ID to fetch
 * @param page - Page number for pagination
 * @param pageSize - Page size for pagination
 */
export function useSchemaVersion(
  connectionId: string,
  versionId: string,
  page: number = 1,
  pageSize: number = 50
) {
  return useQuery({
    queryKey: schemaKeys.version(connectionId, versionId, page, pageSize),
    queryFn: () => schemaApi.getSchemaVersion(connectionId, versionId, page, pageSize),
    enabled: !!connectionId && !!versionId, // Only run query if both IDs are provided
    // Don't refetch on window focus for version data
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for fetching schema changes between versions
 * 
 * @param connectionId - ID of the connection
 * @param fromVersionId - Starting version ID
 * @param toVersionId - Ending version ID
 */
export function useSchemaChanges(
  connectionId: string,
  fromVersionId: string,
  toVersionId: string
) {
  return useQuery({
    queryKey: schemaKeys.changes(connectionId, fromVersionId, toVersionId),
    queryFn: () => schemaApi.getSchemaChanges(connectionId, fromVersionId, toVersionId),
    enabled: !!connectionId && !!fromVersionId && !!toVersionId, // Only run query if all IDs are provided
    // Don't refetch on window focus for changes data
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for refreshing schema
 */
export function useRefreshSchema() {
  const queryClient = useQueryClient();
  
  return (connectionId: string) => {
    // Invalidate all schema queries for this connection
    queryClient.invalidateQueries({ queryKey: schemaKeys.connection(connectionId) });
    
    // Refetch the schema (force refresh)
    return queryClient.fetchQuery({
      queryKey: schemaKeys.detail(connectionId),
      queryFn: () => schemaApi.getSchema(connectionId, true),
    });
  };
}
