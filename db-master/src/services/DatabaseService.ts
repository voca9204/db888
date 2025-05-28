import { 
  testDatabaseConnection, 
  saveDbConnection, 
  getDbConnections, 
  deleteDbConnection, 
  executeQuery, 
  getDatabaseSchema
} from '../firebase/functions.real';
import { useDbConnectionStore } from '../store';
import type { DbConnection, ConnectionTestResult } from '../types/store';

/**
 * Firebase Functions API Service
 * 
 * This service provides methods to interact with Firebase Cloud Functions
 * for database operations
 */
class DatabaseService {
  /**
   * Call a Firebase Cloud Function
   * 
   * @param functionName Function name to call
   * @param data Data to pass to the function
   * @returns Promise with function result
   */
  private async callFunction<TData = any, TResult = any>(
    functionName: string,
    data?: TData
  ): Promise<TResult> {
    try {
      // Select the appropriate function based on name
      let fn;
      switch (functionName) {
        case 'testConnection':
          fn = testDatabaseConnection;
          break;
        case 'saveDbConnection':
          fn = saveDbConnection;
          break;
        case 'getDbConnections':
          fn = getDbConnections;
          break;
        case 'deleteDbConnection':
          fn = deleteDbConnection;
          break;
        case 'executeQuery':
          fn = executeQuery;
          break;
        case 'getDatabaseSchema':
          fn = getDatabaseSchema;
          break;
        default:
          throw new Error(`Unknown function: ${functionName}`);
      }
      
      const result = await fn(data || {});
      return result.data as TResult;
    } catch (error) {
      console.error(`Error calling function ${functionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Test a database connection
   * 
   * @param connectionId Existing connection ID to test
   * @param connectionDetails New connection details to test
   * @returns Test result with success status and message
   */
  async testConnection(
    connectionId?: string,
    connectionDetails?: {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
      ssl?: boolean;
    }
  ): Promise<ConnectionTestResult> {
    try {
      const payload = connectionId ? { connectionId } : connectionDetails;
      const result = await this.callFunction<typeof payload, ConnectionTestResult>(
        'testConnection',
        payload
      );
      
      return result;
    } catch (error) {
      console.error('Error testing connection:', error);
      return {
        success: false,
        message: error instanceof Error 
          ? `Connection failed: ${error.message}` 
          : 'Unknown error occurred while testing connection',
        errorCode: error instanceof Error ? error.name : 'unknown',
      };
    }
  }
  
  /**
   * Save a database connection
   * 
   * @param connection Connection data to save
   * @returns Save result with success status and connection ID
   */
  async saveConnection(
    connection: Partial<DbConnection> & {
      name: string;
      host: string;
      port: number;
      database: string;
      user: string;
      userId: string;
    }
  ): Promise<{
    success: boolean;
    connectionId?: string;
    message: string;
    details?: Partial<DbConnection>;
  }> {
    try {
      const result = await this.callFunction<typeof connection, {
        success: boolean;
        connectionId?: string;
        message: string;
        details?: Partial<DbConnection>;
      }>('saveDbConnection', connection);
      
      if (result.success && result.connectionId) {
        // Update local store if successful
        const { addConnection, updateConnection } = useDbConnectionStore.getState();
        
        if (connection.id) {
          // Update existing connection
          updateConnection(connection.id, {
            ...connection,
            ...result.details,
            updatedAt: Date.now(),
          });
        } else {
          // Add new connection
          addConnection({
            ...connection,
            ...result.details,
            id: result.connectionId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error saving connection:', error);
      return {
        success: false,
        message: error instanceof Error 
          ? `Failed to save connection: ${error.message}` 
          : 'Unknown error occurred while saving connection',
      };
    }
  }
  
  /**
   * Load all connections for the current user
   * 
   * @param options Optional filtering and sorting options
   * @returns Load result with success status and connections array
   */
  async getConnections(options?: {
    tags?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    searchTerm?: string;
    limit?: number;
  }): Promise<{
    success: boolean;
    connections?: DbConnection[];
    total?: number;
    filtered?: boolean;
    message?: string;
  }> {
    try {
      const result = await this.callFunction<typeof options, {
        success: boolean;
        connections?: DbConnection[];
        total?: number;
        filtered?: boolean;
        message?: string;
      }>('getDbConnections', options);
      
      if (result.success && result.connections) {
        // Update local store
        const { setConnections, setActiveConnectionId } = useDbConnectionStore.getState();
        const { activeConnectionId } = useDbConnectionStore.getState();
        
        // Update connections in store
        setConnections(result.connections);
        
        // Set active connection if not set or no longer exists
        if (!activeConnectionId && result.connections.length > 0) {
          setActiveConnectionId(result.connections[0].id);
        } else if (activeConnectionId) {
          const activeExists = result.connections.some(c => c.id === activeConnectionId);
          if (!activeExists && result.connections.length > 0) {
            setActiveConnectionId(result.connections[0].id);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error loading connections:', error);
      return {
        success: false,
        message: error instanceof Error 
          ? `Failed to load connections: ${error.message}` 
          : 'Unknown error occurred while loading connections',
      };
    }
  }
  
  /**
   * Delete a database connection
   * 
   * @param connectionId Connection ID to delete
   * @returns Delete result with success status and message
   */
  async deleteConnection(connectionId: string): Promise<{
    success: boolean;
    message: string;
    connectionId?: string;
  }> {
    try {
      const result = await this.callFunction<{ connectionId: string }, {
        success: boolean;
        message: string;
        connectionId?: string;
      }>('deleteDbConnection', { connectionId });
      
      if (result.success) {
        // Update local store
        const { deleteConnection, setActiveConnectionId } = useDbConnectionStore.getState();
        const { activeConnectionId, connections } = useDbConnectionStore.getState();
        
        // Remove from store
        deleteConnection(connectionId);
        
        // Update active connection if needed
        if (activeConnectionId === connectionId) {
          const remainingConnections = connections.filter(c => c.id !== connectionId);
          if (remainingConnections.length > 0) {
            setActiveConnectionId(remainingConnections[0].id);
          } else {
            setActiveConnectionId(null);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting connection:', error);
      return {
        success: false,
        message: error instanceof Error 
          ? `Failed to delete connection: ${error.message}` 
          : 'Unknown error occurred while deleting connection',
      };
    }
  }
  
  /**
   * Execute a SQL query on a database connection
   * 
   * @param connectionId Connection ID to use
   * @param query SQL query to execute
   * @param parameters Optional query parameters
   * @returns Query result with rows and field information
   */
  async executeQuery(
    connectionId: string,
    query: string,
    parameters: any[] = []
  ): Promise<{
    success: boolean;
    results?: any[];
    fields?: any[];
    executionTime?: number;
    message?: string;
    errorCode?: string;
  }> {
    try {
      const result = await this.callFunction<{
        connectionId: string;
        query: string;
        parameters: any[];
      }, {
        success: boolean;
        results?: any[];
        fields?: any[];
        executionTime?: number;
        message?: string;
        errorCode?: string;
      }>('executeQuery', {
        connectionId,
        query,
        parameters,
      });
      
      return result;
    } catch (error) {
      console.error('Error executing query:', error);
      return {
        success: false,
        message: error instanceof Error 
          ? `Query execution failed: ${error.message}` 
          : 'Unknown error occurred while executing query',
        errorCode: error instanceof Error ? error.name : 'unknown',
      };
    }
  }
  
  /**
   * Get database schema information
   * 
   * @param connectionId Connection ID
   * @param options Schema retrieval options
   * @returns Schema data with tables, views, and procedures
   */
  async getSchema(
    connectionId: string,
    options?: {
      forceRefresh?: boolean;
      page?: number;
      pageSize?: number;
    }
  ): Promise<{
    success: boolean;
    schema?: Record<string, any>;
    fromCache?: boolean;
    updatedAt?: number;
    versionId?: string;
    pagination?: {
      page: number;
      pageSize: number;
      totalPages: number;
      totalTables: number;
    };
    message?: string;
  }> {
    try {
      const result = await this.callFunction<{
        connectionId: string;
        forceRefresh?: boolean;
        page?: number;
        pageSize?: number;
      }, {
        success: boolean;
        schema?: Record<string, any>;
        fromCache?: boolean;
        updatedAt?: number;
        versionId?: string;
        pagination?: {
          page: number;
          pageSize: number;
          totalPages: number;
          totalTables: number;
        };
        message?: string;
      }>('getDatabaseSchema', {
        connectionId,
        forceRefresh: options?.forceRefresh || false,
        page: options?.page || 1,
        pageSize: options?.pageSize || 50,
      });
      
      return result;
    } catch (error) {
      console.error('Error getting schema:', error);
      return {
        success: false,
        message: error instanceof Error 
          ? `Failed to retrieve schema: ${error.message}` 
          : 'Unknown error occurred while retrieving schema',
      };
    }
  }
}

// Export a singleton instance
const databaseService = new DatabaseService();
export default databaseService;
