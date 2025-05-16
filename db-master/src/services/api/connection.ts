import BaseApi from './base';

/**
 * Types for ConnectionApi
 */
export interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  type: 'mysql' | 'mariadb';
  createdAt: number;
  updatedAt: number;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
}

export interface CreateConnectionData {
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  type: 'mysql' | 'mariadb';
}

export interface UpdateConnectionData {
  id: string;
  name?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  type?: 'mysql' | 'mariadb';
}

/**
 * API for database connection operations
 */
class ConnectionApi extends BaseApi {
  /**
   * Get all connections for the current user
   * 
   * @returns Promise with array of connections
   */
  async getConnections(): Promise<Connection[]> {
    return this.callFunction<void, Connection[]>('getConnections');
  }
  
  /**
   * Get a single connection by ID
   * 
   * @param connectionId - ID of the connection to retrieve
   * @returns Promise with connection data
   */
  async getConnection(connectionId: string): Promise<Connection> {
    return this.callFunction<{ connectionId: string }, Connection>(
      'getConnection',
      { connectionId }
    );
  }
  
  /**
   * Create a new database connection
   * 
   * @param connectionData - Connection data to create
   * @returns Promise with created connection
   */
  async createConnection(connectionData: CreateConnectionData): Promise<Connection> {
    return this.callFunction<CreateConnectionData, Connection>(
      'createConnection',
      connectionData
    );
  }
  
  /**
   * Update an existing connection
   * 
   * @param connectionData - Connection data to update
   * @returns Promise with updated connection
   */
  async updateConnection(connectionData: UpdateConnectionData): Promise<Connection> {
    return this.callFunction<UpdateConnectionData, Connection>(
      'updateConnection',
      connectionData
    );
  }
  
  /**
   * Delete a connection
   * 
   * @param connectionId - ID of the connection to delete
   * @returns Promise with success status
   */
  async deleteConnection(connectionId: string): Promise<{ success: boolean }> {
    return this.callFunction<{ connectionId: string }, { success: boolean }>(
      'deleteConnection',
      { connectionId }
    );
  }
  
  /**
   * Test a database connection
   * 
   * @param connectionData - Connection data to test
   * @returns Promise with test result
   */
  async testConnection(
    connectionData: CreateConnectionData | { id: string }
  ): Promise<ConnectionTestResult> {
    return this.callFunction<typeof connectionData, ConnectionTestResult>(
      'testConnection',
      connectionData
    );
  }
}

export default new ConnectionApi();
