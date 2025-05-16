import * as mysql from "mysql2/promise";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { decrypt } from "../utils/encryption";
import { ConnectionConfig } from "./types";

// Connection pool manager
const connectionPools: Record<string, mysql.Pool> = {};

/**
 * Creates a unique connection ID based on the connection config
 * @param config 
 * @returns 
 */
const getConnectionId = (config: { host: string, port: number, database: string, user: string }): string => {
  return `${config.host}:${config.port}:${config.database}:${config.user}`;
};

/**
 * Get or create a connection pool for a database
 * @param config 
 * @returns 
 */
export const getConnectionPool = async (config: {
  host: string,
  port: number,
  user: string,
  password: string,
  database: string,
  ssl?: boolean
}): Promise<mysql.Pool> => {
  const id = getConnectionId(config);
  
  if (connectionPools[id]) {
    return connectionPools[id];
  }
  
  try {
    // Create connection pool
    const pool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: true } : undefined,
      connectionLimit: 5,
      connectTimeout: 10000,
      acquireTimeout: 10000,
    });
    
    // Cache connection pool
    connectionPools[id] = pool;
    return pool;
  } catch (error) {
    console.error('Failed to create connection pool', error);
    throw new Error(`Failed to create database connection: ${error.message}`);
  }
};

/**
 * Create a single database connection
 * @param host 
 * @param port 
 * @param user 
 * @param password 
 * @param database 
 * @param ssl 
 * @returns 
 */
export const createConnection = async (
  host: string,
  port: number,
  user: string,
  password: string,
  database: string,
  ssl?: boolean
): Promise<mysql.Connection> => {
  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      ssl: ssl ? { rejectUnauthorized: true } : undefined,
    });
    return connection;
  } catch (error) {
    console.error("Error creating database connection:", error);
    throw new Error(`Failed to connect to database: ${error.message}`);
  }
};

/**
 * Get a connection by ID from Firestore
 * @param userId 
 * @param connectionId 
 * @returns 
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
 * @param connectionData 
 * @returns 
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
 * @param userId 
 * @param connectionId 
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
 * @param connectionId 
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
 * @param userId 
 * @returns 
 */
export const getAllConnections = async (userId: string): Promise<ConnectionConfig[]> => {
  try {
    const connectionsSnapshot = await admin.firestore()
      .collection("connections")
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .get();
    
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
 * @param userId 
 * @param connectionId 
 * @param query 
 * @param status 
 * @param error 
 * @param executionTimeMs 
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
