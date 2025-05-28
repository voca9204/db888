import { 
  testDatabaseConnection, 
  saveDbConnection, 
  getDbConnections, 
  deleteDbConnection 
} from '../firebase/functions.real';
import { useDbConnectionStore } from '../store';
import type { DbConnection } from '../types/store';
import { callSafely } from '../utils/firebaseFunctions';

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
    // Validate connection details if provided
    if (connectionDetails) {
      // Ensure host is not empty
      if (!connectionDetails.host) {
        return {
          success: false,
          message: '호스트를 입력해주세요.',
        };
      }
      
      // Ensure port is valid
      if (!connectionDetails.port || isNaN(Number(connectionDetails.port)) || Number(connectionDetails.port) <= 0 || Number(connectionDetails.port) > 65535) {
        return {
          success: false,
          message: '포트는 1에서 65535 사이의 유효한 숫자여야 합니다.',
        };
      }
      
      // Ensure database is not empty
      if (!connectionDetails.database) {
        return {
          success: false,
          message: '데이터베이스 이름을 입력해주세요.',
        };
      }
      
      // Ensure user is not empty
      if (!connectionDetails.user) {
        return {
          success: false,
          message: '사용자 이름을 입력해주세요.',
        };
      }
      
      // Ensure password is provided for new connections
      if (!connectionId && !connectionDetails.password) {
        return {
          success: false,
          message: '비밀번호를 입력해주세요.',
        };
      }
    } else if (!connectionId) {
      return {
        success: false,
        message: '연결 정보가 필요합니다.',
      };
    }

    console.log(`연결 테스트 시작: ${connectionId || connectionDetails?.host}`);
    
    // 안전한 함수 호출 사용
    const callParams = connectionId ? connectionId : connectionDetails;
    const result = await callSafely(testDatabaseConnection, callParams);
    
    console.log(`연결 테스트 결과:`, result);
    
    // 호출 실패 시 기본 오류 메시지 반환
    if (!result.success) {
      return {
        success: false,
        message: result.error?.message || 'Firebase 함수 호출에 실패했습니다. 관리자에게 문의하세요.',
        errorCode: 'function_call_failed',
        timestamp: new Date().toISOString()
      };
    }
    
    // 상세 결과 정보를 포함해서 반환합니다
    return {
      ...result.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error testing connection:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
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
