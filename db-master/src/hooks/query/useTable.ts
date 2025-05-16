import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tableApi, QueryFilter } from '../../services/api';

// Query keys for table data
export const tableKeys = {
  all: ['tables'] as const,
  connection: (connectionId: string) => 
    [...tableKeys.all, { connectionId }] as const,
  table: (connectionId: string, tableName: string) => 
    [...tableKeys.connection(connectionId), { tableName }] as const,
  data: (
    connectionId: string, 
    tableName: string, 
    page: number, 
    pageSize: number,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: QueryFilter[]
  ) => 
    [...tableKeys.table(connectionId, tableName), 'data', { page, pageSize, sortColumn, sortDirection, filters }] as const,
  query: (connectionId: string, query: string, params?: any[]) => 
    [...tableKeys.connection(connectionId), 'query', { query, params }] as const,
};

/**
 * Hook for fetching table data
 * 
 * @param connectionId - ID of the connection
 * @param tableName - Name of the table
 * @param page - Page number for pagination
 * @param pageSize - Page size for pagination
 * @param sortColumn - Column to sort by
 * @param sortDirection - Sort direction
 * @param filters - Filters to apply
 */
export function useTableData(
  connectionId: string,
  tableName: string,
  page: number = 1,
  pageSize: number = 25,
  sortColumn?: string,
  sortDirection?: 'asc' | 'desc',
  filters?: QueryFilter[]
) {
  return useQuery({
    queryKey: tableKeys.data(connectionId, tableName, page, pageSize, sortColumn, sortDirection, filters),
    queryFn: () => tableApi.getTableData(connectionId, tableName, page, pageSize, sortColumn, sortDirection, filters),
    enabled: !!connectionId && !!tableName, // Only run query if connectionId and tableName are provided
    refetchOnWindowFocus: false, // Don't refetch table data on window focus
  });
}

/**
 * Hook for executing a custom SQL query
 */
export function useExecuteQuery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      connectionId, 
      query, 
      params 
    }: { 
      connectionId: string; 
      query: string; 
      params?: any[] 
    }) => 
      tableApi.executeQuery(connectionId, query, params),
  });
}

/**
 * Hook for exporting table data
 */
export function useExportTableData() {
  return useMutation({
    mutationFn: ({ 
      connectionId, 
      tableName, 
      format, 
      filters 
    }: { 
      connectionId: string; 
      tableName: string; 
      format: 'csv' | 'json' | 'excel'; 
      filters?: QueryFilter[] 
    }) => 
      tableApi.exportTableData(connectionId, tableName, format, filters),
  });
}

/**
 * Hook for refreshing table data
 */
export function useRefreshTableData() {
  const queryClient = useQueryClient();
  
  return (
    connectionId: string,
    tableName: string,
    page: number = 1,
    pageSize: number = 25,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: QueryFilter[]
  ) => {
    // Invalidate table data query
    queryClient.invalidateQueries({ 
      queryKey: tableKeys.data(connectionId, tableName, page, pageSize, sortColumn, sortDirection, filters) 
    });
  };
}
