import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { decrypt } from "../utils/encryption";
import { ConnectionConfig } from "./types";
import { 
  createConnection, 
  createConnectionPool, 
  closeConnection,
  closeAllPools,
  executeQuery,
  executeQueryInTransaction
} from "./mariadb";

/**
 * Get a connection by ID from Firestore
 * 
 * @param userId User ID
 * @param connectionId Connection ID
 * @returns Connection configuration
 */
export const getConnection = async (
  userId: string,
  connectionId: string
): Promise<ConnectionConfig> => {
  const connectionRef = admin.firestore()
    .collection("connections")
    .doc(connectionId);
  
  const connectionDoc = await connectionRef.get();
  
  if (!connectionDoc.exists) {
    throw new Error("Connection not found");
  }
  
  const connectionData = connectionDoc.data() as ConnectionConfig;
  
  // Ensure the connection belongs to the user
  if (connectionData?.userId !== userId) {
    throw new Error("Unauthorized access to connection");
  }
  
  // Decrypt password if it exists
  if (connectionData.password) {
    try {
      connectionData.password = decrypt(connectionData.password);
    } catch (error) {
      console.error("Error decrypting password:", error);
      throw new Error("Failed to decrypt connection credentials");
    }
  }
  
  return connectionData;
};

/**
 * Save a connection to Firestore
 * 
 * @param connectionData Connection configuration
 * @returns Connection ID
 */
export const saveConnection = async (
  connectionData: ConnectionConfig
): Promise<string> => {
  try {
    const connectionRef = connectionData.id
      ? admin.firestore().collection("connections").doc(connectionData.id)
      : admin.firestore().collection("connections").doc();
    
    const id = connectionRef.id;
    const now = Date.now();
    
    await connectionRef.set({
      ...connectionData,
      id,
      updatedAt: now,
      createdAt: connectionData.createdAt || now,
    });
    
    return id;
  } catch (error) {
    console.error("Error saving connection:", error);
    throw new Error(`Failed to save connection: ${error.message}`);
  }
};

/**
 * Delete a connection from Firestore
 * 
 * @param userId User ID
 * @param connectionId Connection ID
 */
export const deleteConnection = async (
  userId: string,
  connectionId: string
): Promise<void> => {
  const connectionRef = admin.firestore()
    .collection("connections")
    .doc(connectionId);
  
  const connectionDoc = await connectionRef.get();
  
  if (!connectionDoc.exists) {
    throw new Error("Connection not found");
  }
  
  const connectionData = connectionDoc.data();
  
  // Ensure the connection belongs to the user
  if (connectionData?.userId !== userId) {
    throw new Error("Unauthorized access to connection");
  }
  
  await connectionRef.delete();
};

/**
 * Update last used timestamp for a connection
 * 
 * @param connectionId Connection ID
 */
export const updateLastUsed = async (connectionId: string): Promise<void> => {
  try {
    await admin.firestore()
      .collection("connections")
      .doc(connectionId)
      .update({
        lastUsed: Date.now(),
      });
  } catch (error) {
    console.error("Error updating last used timestamp:", error);
    // Non-critical error, no need to throw
  }
};

/**
 * Get all connections for a user
 * 
 * @param userId User ID
 * @param query Optional Firestore query for filtering/sorting
 * @returns List of connection configurations
 */
export const getAllConnections = async (
  userId: string,
  query?: any
): Promise<ConnectionConfig[]> => {
  try {
    let connectionsQuery = query;
    
    // If no query provided, create a default one
    if (!connectionsQuery) {
      connectionsQuery = admin.firestore()
        .collection("connections")
        .where("userId", "==", userId)
        .orderBy("updatedAt", "desc");
    }
    
    const connectionsSnapshot = await connectionsQuery.get();
    
    return connectionsSnapshot.docs.map(doc => {
      const data = doc.data() as ConnectionConfig;
      // Don't include the password in the response
      const { password, ...rest } = data;
      return rest as ConnectionConfig;
    });
  } catch (error) {
    console.error("Error getting connections:", error);
    throw new Error(`Failed to retrieve connections: ${error.message}`);
  }
};

/**
 * Log query execution to Firestore for auditing
 * 
 * @param userId User ID
 * @param connectionId Connection ID
 * @param query Query string
 * @param status Query execution status
 * @param error Error message if any
 * @param executionTimeMs Execution time in milliseconds
 */
export const logQueryExecution = async (
  userId: string,
  connectionId: string,
  query: string,
  status: "success" | "error",
  error?: string,
  executionTimeMs?: number
): Promise<void> => {
  await admin.firestore().collection("queryLogs").add({
    userId,
    connectionId,
    query,
    status,
    error,
    executionTimeMs,
    timestamp: Timestamp.now(),
  });
};

// Export functions from mariadb.ts
export {
  createConnection,
  createConnectionPool,
  closeConnection,
  closeAllPools,
  executeQuery,
  executeQueryInTransaction
};
