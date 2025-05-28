import * as mysql from 'mysql2/promise';

// Connection pool manager
interface PoolManager {
  [key: string]: mysql.Pool;
}

// Timeout values (in milliseconds)
const DEFAULT_CONNECT_TIMEOUT = 30000; // 30 seconds (increased from 10)
const DEFAULT_ACQUIRE_TIMEOUT = 30000; // 30 seconds (increased from 10)
const DEFAULT_QUERY_TIMEOUT = 60000;   // 60 seconds (increased from 30)
const DEFAULT_CONN_LIMIT = 5;          // 5 connections
const MAX_CONN_LIMIT = 20;             // Maximum allowed connections per pool

// Global connection pool storage
const connectionPools: PoolManager = {};

/**
 * Creates a unique connection ID based on the connection config
 * 
 * @param config Connection configuration
 * @returns Unique connection ID
 */
const getConnectionId = (config: { host: string, port: number, database: string, user: string }): string => {
  return `${config.host}:${config.port}:${config.database}:${config.user}`;
};

/**
 * Create or get an existing connection pool
 * 
 * @param config Connection configuration
 * @param options Pool options
 * @returns MySQL connection pool
 */
export const createConnectionPool = async (
  config: {
    host: string,
    port: number,
    user: string,
    password: string,
    database: string,
    ssl?: boolean
  },
  options?: {
    connectionLimit?: number,
    connectTimeout?: number,
    acquireTimeout?: number,
    queueLimit?: number
  }
): Promise<mysql.Pool> => {
  const id = getConnectionId(config);
  
  // Check if pool already exists and is not closed
  if (connectionPools[id]) {
    try {
      // Test the pool with a simple query
      await connectionPools[id].query('SELECT 1');
      return connectionPools[id];
    } catch (error) {
      console.warn(`Existing pool ${id} failed health check, creating new pool`, error);
      // Pool is not working, delete it and create a new one
      try {
        await connectionPools[id].end();
      } catch (endError) {
        console.error(`Error ending faulty pool ${id}`, endError);
      }
      delete connectionPools[id];
    }
  }
  
  try {
    // Set connection limit with safety bounds
    const connectionLimit = Math.min(
      Math.max(options?.connectionLimit || DEFAULT_CONN_LIMIT, 1),
      MAX_CONN_LIMIT
    );
    
    // Create connection pool with enhanced options
    const pool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? {
        rejectUnauthorized: false // Changed to false to allow self-signed certificates
      } : undefined,
      // Pool configuration
      connectionLimit,
      connectTimeout: options?.connectTimeout || DEFAULT_CONNECT_TIMEOUT,
      acquireTimeout: options?.acquireTimeout || DEFAULT_ACQUIRE_TIMEOUT,
      queueLimit: options?.queueLimit || 0, // 0 means unlimited
      // Additional safety options
      waitForConnections: true, // Wait if no connections are available
      enableKeepAlive: true,    // Keep connections alive
      keepAliveInitialDelay: 10000, // 10 seconds
    });
    
    // Register pool cleanup handler
    pool.on('connection', (connection) => {
      connection.on('error', (err) => {
        console.error(`Connection error in pool ${id}:`, err);
        // Individual connection errors are handled automatically by the pool
      });
    });
    
    // Cache connection pool
    connectionPools[id] = pool;
    console.log(`Created new connection pool for ${id} with limit of ${connectionLimit} connections`);
    
    return pool;
  } catch (error) {
    console.error(`Failed to create connection pool for ${id}:`, error);
    throw new Error(`Failed to create database connection: ${error.message}`);
  }
};

/**
 * Creates a new database connection
 * 
 * @param host Database host
 * @param port Database port
 * @param user Database user
 * @param password Database password
 * @param database Database name
 * @param ssl Use SSL/TLS for connection
 * @param options Additional connection options
 * @returns MySQL connection
 */
export const createConnection = async (
  host: string,
  port: number,
  user: string,
  password: string,
  database: string,
  ssl?: boolean,
  options?: {
    connectTimeout?: number,
    timezone?: string,
    charset?: string
  }
): Promise<mysql.Connection> => {
  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      ssl: ssl ? {
        rejectUnauthorized: false // Changed to false to allow self-signed certificates
      } : undefined,
      connectTimeout: options?.connectTimeout || DEFAULT_CONNECT_TIMEOUT,
      timezone: options?.timezone || 'local',
      charset: options?.charset || 'UTF8_GENERAL_CI',
      multipleStatements: false, // Security: disallow multiple statements
      dateStrings: true, // Return dates as strings rather than Date objects
    });
    
    // Set session variables for safety
    await connection.query('SET SESSION sql_mode = ?', [
      'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'
    ]);
    
    // Set timeout for queries on this connection
    await connection.query('SET SESSION max_execution_time = ?', [DEFAULT_QUERY_TIMEOUT]);
    
    return connection;
  } catch (error) {
    console.error("Error creating database connection:", error);
    throw new Error(`Failed to connect to database: ${error.message}`);
  }
};

/**
 * Closes a database connection
 * 
 * @param connection MySQL connection
 */
export const closeConnection = async (connection: mysql.Connection): Promise<void> => {
  try {
    await connection.end();
  } catch (error) {
    console.error("Error closing database connection:", error);
    // Still consider it closed even if there was an error
  }
};

/**
 * Closes all connection pools
 * 
 * @returns Promise that resolves when all pools are closed
 */
export const closeAllPools = async (): Promise<void> => {
  try {
    const closingPromises = Object.entries(connectionPools).map(async ([id, pool]) => {
      try {
        await pool.end();
        console.log(`Closed connection pool ${id}`);
      } catch (error) {
        console.error(`Error closing connection pool ${id}:`, error);
      }
    });
    
    await Promise.all(closingPromises);
    
    // Clear the pools object
    Object.keys(connectionPools).forEach(key => {
      delete connectionPools[key];
    });
    
    console.log('All connection pools closed');
  } catch (error) {
    console.error("Error closing all connection pools:", error);
    throw error;
  }
};

/**
 * Execute a SQL query using a connection from a pool
 * 
 * @param pool MySQL connection pool
 * @param query SQL query string
 * @param params Query parameters
 * @param timeout Query timeout in milliseconds
 * @returns Query result and fields
 */
export const executeQuery = async (
  pool: mysql.Pool,
  query: string,
  params: any[] = [],
  timeout: number = DEFAULT_QUERY_TIMEOUT
): Promise<[any[], mysql.FieldPacket[]]> => {
  let connection: mysql.PoolConnection | null = null;
  
  try {
    // Acquire a connection from the pool
    connection = await pool.getConnection();
    
    // Set query timeout
    await connection.query('SET SESSION max_execution_time = ?', [timeout]);
    
    // Execute the query
    const result = await connection.query({
      sql: query,
      timeout, // Specify timeout again as a safety measure
      values: params
    });
    
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw new Error(`Failed to execute query: ${error.message}`);
  } finally {
    // Always release the connection back to the pool
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Execute a series of SQL queries in a transaction
 * 
 * @param pool MySQL connection pool
 * @param queries Array of SQL queries and their parameters
 * @param timeout Transaction timeout in milliseconds
 * @returns Array of query results
 */
export const executeQueryInTransaction = async (
  pool: mysql.Pool,
  queries: Array<{sql: string, params?: any[]}>,
  timeout: number = DEFAULT_QUERY_TIMEOUT
): Promise<any[][]> => {
  let connection: mysql.PoolConnection | null = null;
  
  try {
    // Acquire a connection from the pool
    connection = await pool.getConnection();
    
    // Set query timeout
    await connection.query('SET SESSION max_execution_time = ?', [timeout]);
    
    // Start transaction
    await connection.beginTransaction();
    
    // Execute all queries
    const results: any[][] = [];
    
    for (const query of queries) {
      const result = await connection.query({
        sql: query.sql,
        timeout,
        values: query.params || []
      });
      
      results.push(result[0]);
    }
    
    // Commit the transaction
    await connection.commit();
    
    return results;
  } catch (error) {
    // Rollback the transaction on error
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    console.error('Error executing transaction:', error);
    throw new Error(`Transaction failed: ${error.message}`);
  } finally {
    // Always release the connection back to the pool
    if (connection) {
      connection.release();
    }
  }
};
