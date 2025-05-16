import { 
  testDatabaseConnection, 
  saveDbConnection, 
  getDbConnections, 
  deleteDbConnection 
} from '../firebase/functions';
import { useDbConnectionStore } from '../store';
import type { DbConnection } from '../types/store';

/**
 * Test a database connection
 * @param connectionId Existing connection ID
 * @param connectionDetails New connection details
 * @returns Success status and message
 */
export const testConnection = async (
  connectionId?: string,
  connectionDetails?: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl?: boolean;
  }
) => {
  try {
    const result = await testDatabaseConnection(connectionId, connectionDetails);
    return result.data as { success: boolean; message: string };
  } catch (error) {
    console.error('Error testing connection:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Save a database connection
 * @param connection Connection data
 * @returns Success status and connection ID
 */
export const saveConnection = async (
  connection: Partial<DbConnection> & {
    name: string;
    host: string;
    port: number;
    database: string;
    user: string;
    userId: string;
  }
) => {
  try {
    const result = await saveDbConnection(connection);
    const data = result.data as { 
      success: boolean; 
      connectionId: string; 
      message: string;
    };
    
    if (data.success) {
      // If the connection was saved successfully, add it to the local store
      const { addConnection, updateConnection } = useDbConnectionStore.getState();
      
      if (connection.id) {
        // Update existing connection
        updateConnection(connection.id, {
          ...connection,
          updatedAt: Date.now(),
        });
      } else {
        // Add new connection
        addConnection({
          ...connection,
          id: data.connectionId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error saving connection:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Load all connections for the current user
 * @returns Success status and connections array
 */
export const loadConnections = async () => {
  try {
    const result = await getDbConnections();
    const data = result.data as { 
      success: boolean; 
      connections: DbConnection[];
    };
    
    if (data.success) {
      // Replace connections in the store
      const { connections, activeConnectionId } = useDbConnectionStore.getState();
      const store = useDbConnectionStore.getState();
      
      // Clear existing connections and add new ones
      store.connections = data.connections;
      
      // If there's an active connection, check if it still exists
      if (activeConnectionId) {
        const activeExists = data.connections.some(c => c.id === activeConnectionId);
        if (!activeExists && data.connections.length > 0) {
          // Set first connection as active if current active doesn't exist
          store.activeConnectionId = data.connections[0].id;
        }
      } else if (data.connections.length > 0) {
        // Set first connection as active if none is active
        store.activeConnectionId = data.connections[0].id;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error loading connections:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Delete a database connection
 * @param connectionId Connection ID to delete
 * @returns Success status and message
 */
export const removeConnection = async (connectionId: string) => {
  try {
    const result = await deleteDbConnection(connectionId);
    const data = result.data as { success: boolean; message: string };
    
    if (data.success) {
      // If the connection was deleted successfully, remove it from the local store
      const { deleteConnection } = useDbConnectionStore.getState();
      deleteConnection(connectionId);
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting connection:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
