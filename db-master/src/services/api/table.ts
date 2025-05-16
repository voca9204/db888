import BaseApi from './base';

/**
 * Types for TableApi
 */
export interface QueryFilter {
  column: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in';
  value: string | number | boolean | (string | number)[];
}

export interface TableDataResult {
  rows: Record<string, any>[];
  columns: { name: string; type: string }[];
  total: number;
  page: number;
  pageSize: number;
  success: boolean;
  message?: string;
}

/**
 * API for table data operations
 */
class TableApi extends BaseApi {
  /**
   * Get data from a table
   * 
   * @param connectionId - ID of the connection
   * @param tableName - Name of the table
   * @param page - Page number for pagination
   * @param pageSize - Number of records per page
   * @param sortColumn - Column to sort by
   * @param sortDirection - Direction to sort (asc or desc)
   * @param filters - Filters to apply
   * @returns Promise with table data
   */
  async getTableData(
    connectionId: string,
    tableName: string,
    page: number = 1,
    pageSize: number = 25,
    sortColumn?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: QueryFilter[]
  ): Promise<TableDataResult> {
    return this.callFunction<
      {
        connectionId: string;
        tableName: string;
        page: number;
        pageSize: number;
        sortColumn?: string;
        sortDirection?: 'asc' | 'desc';
        filters?: QueryFilter[];
      },
      TableDataResult
    >('getTableData', {
      connectionId,
      tableName,
      page,
      pageSize,
      sortColumn,
      sortDirection,
      filters,
    });
  }
  
  /**
   * Export table data
   * 
   * @param connectionId - ID of the connection
   * @param tableName - Name of the table
   * @param format - Export format (csv, json, excel)
   * @param filters - Filters to apply
   * @returns Promise with export URL
   */
  async exportTableData(
    connectionId: string,
    tableName: string,
    format: 'csv' | 'json' | 'excel',
    filters?: QueryFilter[]
  ): Promise<{ url: string; success: boolean; message?: string }> {
    return this.callFunction<
      {
        connectionId: string;
        tableName: string;
        format: 'csv' | 'json' | 'excel';
        filters?: QueryFilter[];
      },
      { url: string; success: boolean; message?: string }
    >('exportTableData', {
      connectionId,
      tableName,
      format,
      filters,
    });
  }
  
  /**
   * Execute a custom SQL query
   * 
   * @param connectionId - ID of the connection
   * @param query - SQL query to execute
   * @param params - Query parameters
   * @returns Promise with query results
   */
  async executeQuery(
    connectionId: string,
    query: string,
    params?: any[]
  ): Promise<TableDataResult> {
    return this.callFunction<
      {
        connectionId: string;
        query: string;
        params?: any[];
      },
      TableDataResult
    >('executeQuery', {
      connectionId,
      query,
      params,
    });
  }
}

export default new TableApi();
