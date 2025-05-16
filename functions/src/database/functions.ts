import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { encrypt } from "../utils/encryption";
import { 
  createConnection, 
  getConnection, 
  logQueryExecution, 
  saveConnection, 
  deleteConnection,
  getAllConnections,
  updateLastUsed,
  getConnectionPool
} from "./index";
import { ConnectionConfig } from "./types";

// Cloud Function to test a database connection
export const testConnection = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  
  try {
    // If connectionId is provided, test an existing connection
    if (data.connectionId) {
      const connectionData = await getConnection(userId, data.connectionId);
      
      const connection = await createConnection(
        connectionData.host,
        connectionData.port,
        connectionData.user,
        connectionData.password,
        connectionData.database,
        connectionData.ssl
      );
      
      await connection.ping();
      await connection.end();
      
      // Update last used timestamp
      await updateLastUsed(data.connectionId);
      
      return { success: true, message: "Connection successful" };
    } else {
      // Test a new connection with provided details
      const { host, port, user, password, database, ssl } = data;
      
      const connection = await createConnection(
        host,
        parseInt(port, 10),
        user,
        password,
        database,
        ssl
      );
      
      await connection.ping();
      await connection.end();
      
      return { success: true, message: "Connection successful" };
    }
  } catch (error) {
    console.error("Error testing connection:", error);
    return {
      success: false,
      message: `Connection failed: ${error.message}`
    };
  }
});

// Cloud Function to save database connection
export const saveDbConnection = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  
  try {
    const { name, host, port, database, user, password, ssl, id } = data;
    
    // Validate required fields
    if (!name || !host || !port || !database || !user) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required connection parameters"
      );
    }
    
    // If updating an existing connection without a new password, 
    // get the existing connection to preserve the password
    let existingPassword: string | undefined;
    if (id && !password) {
      try {
        const existingConnection = await getConnection(userId, id);
        existingPassword = existingConnection.password;
      } catch (error) {
        // If connection not found, ignore and create a new one
        console.log("Existing connection not found, creating new:", error);
      }
    }
    
    // Encrypt password if provided
    const encryptedPassword = password 
      ? encrypt(password) 
      : existingPassword;
    
    if (!password && !existingPassword) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Password is required for new connections"
      );
    }
    
    // Create connection config
    const connectionConfig: ConnectionConfig = {
      id: id || "",
      name,
      host,
      port: parseInt(port.toString(), 10),
      database,
      user,
      password: encryptedPassword!,
      ssl: !!ssl,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Save connection to Firestore
    const connectionId = await saveConnection(connectionConfig);
    
    return {
      success: true,
      connectionId,
      message: "Connection saved successfully"
    };
  } catch (error) {
    console.error("Error saving connection:", error);
    return {
      success: false,
      message: `Failed to save connection: ${error.message}`
    };
  }
});

// Cloud Function to get all user's database connections
export const getDbConnections = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  
  try {
    const connections = await getAllConnections(userId);
    
    return {
      success: true,
      connections
    };
  } catch (error) {
    console.error("Error retrieving connections:", error);
    return {
      success: false,
      message: `Failed to retrieve connections: ${error.message}`
    };
  }
});

// Cloud Function to delete a database connection
export const deleteDbConnection = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  const { connectionId } = data;
  
  if (!connectionId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Connection ID is required"
    );
  }
  
  try {
    await deleteConnection(userId, connectionId);
    
    return {
      success: true,
      message: "Connection deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting connection:", error);
    return {
      success: false,
      message: `Failed to delete connection: ${error.message}`
    };
  }
});

// Cloud Function to execute a database query
export const executeQuery = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  const { connectionId, query, parameters = [] } = data;
  
  if (!connectionId || !query) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Connection ID and query are required"
    );
  }
  
  try {
    const startTime = Date.now();
    const connectionData = await getConnection(userId, connectionId);
    
    const connection = await createConnection(
      connectionData.host,
      connectionData.port,
      connectionData.user,
      connectionData.password,
      connectionData.database,
      connectionData.ssl
    );
    
    // Execute the query
    const [rows, fields] = await connection.execute(query, parameters);
    await connection.end();
    
    const executionTime = Date.now() - startTime;
    
    // Update last used timestamp
    await updateLastUsed(connectionId);
    
    // Log successful query execution
    await logQueryExecution(
      userId,
      connectionId,
      query,
      "success",
      undefined,
      executionTime
    );
    
    return {
      success: true,
      results: rows,
      fields: fields ? fields.map((field: any) => ({
        name: field.name,
        type: field.type,
      })) : [],
      executionTime,
    };
  } catch (error) {
    console.error("Error executing query:", error);
    
    // Log failed query execution
    await logQueryExecution(
      userId,
      connectionId,
      query,
      "error",
      `${error}`
    );
    
    return {
      success: false,
      message: `Query execution failed: ${error.message}`,
    };
  }
});

// Cloud Function to get database schema
export const getDatabaseSchema = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  const { connectionId, forceRefresh = false, page = 1, pageSize = 50 } = data;
  
  if (!connectionId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Connection ID is required"
    );
  }
  
  try {
    // If not force refresh, check for cached schema
    if (!forceRefresh) {
      const cachedSchema = await getCachedSchema(userId, connectionId);
      if (cachedSchema) {
        // If cache is less than an hour old, return it
        const cacheAge = Date.now() - cachedSchema.updatedAt;
        const maxCacheAge = 60 * 60 * 1000; // 1 hour in milliseconds
        
        if (cacheAge < maxCacheAge) {
          // Apply pagination to the schema
          const paginatedSchema = paginateSchema(cachedSchema.schema, page, pageSize);
          
          return {
            success: true,
            schema: paginatedSchema.schema,
            fromCache: true,
            updatedAt: cachedSchema.updatedAt,
            versionId: cachedSchema.versionId,
            pagination: {
              page,
              pageSize,
              totalPages: paginatedSchema.totalPages,
              totalTables: paginatedSchema.totalTables,
            }
          };
        }
      }
    }
    
    // Get connection details
    const connectionData = await getConnection(userId, connectionId);
    
    const connection = await createConnection(
      connectionData.host,
      connectionData.port,
      connectionData.user,
      connectionData.password,
      connectionData.database,
      connectionData.ssl
    );
    
    // Update last used timestamp
    await updateLastUsed(connectionId);
    
    // Get tables with pagination for better performance
    const [tablesCount] = await connection.query(
      "SELECT COUNT(*) as count FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
      [connectionData.database]
    );
    
    const totalTables = (tablesCount as any[])[0].count;
    const totalPages = Math.ceil(totalTables / pageSize);
    
    const [tables] = await connection.query(
      "SELECT TABLE_NAME, TABLE_TYPE, TABLE_COMMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? LIMIT ? OFFSET ?",
      [connectionData.database, pageSize, (page - 1) * pageSize]
    );
    
    const schema: Record<string, any> = {};
    
    // For each table, get columns and indexes
    for (const table of tables as any[]) {
      const tableName = table.TABLE_NAME;
      
      // Get columns
      const [columns] = await connection.query(
        `SELECT 
          COLUMN_NAME, 
          DATA_TYPE, 
          IS_NULLABLE, 
          COLUMN_KEY,
          EXTRA,
          COLUMN_DEFAULT,
          COLUMN_COMMENT
        FROM 
          information_schema.COLUMNS 
        WHERE 
          TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY 
          ORDINAL_POSITION`,
        [connectionData.database, tableName]
      );
      
      // Get primary key
      const [primaryKeys] = await connection.query(
        `SELECT 
          COLUMN_NAME
        FROM 
          information_schema.KEY_COLUMN_USAGE
        WHERE 
          TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY'
        ORDER BY 
          ORDINAL_POSITION`,
        [connectionData.database, tableName]
      );
      
      // Get foreign keys
      const [foreignKeys] = await connection.query(
        `SELECT 
          CONSTRAINT_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM 
          information_schema.KEY_COLUMN_USAGE
        WHERE 
          TABLE_SCHEMA = ? 
          AND TABLE_NAME = ? 
          AND REFERENCED_TABLE_NAME IS NOT NULL`,
        [connectionData.database, tableName]
      );
      
      // Get indexes
      const [indexes] = await connection.query(
        `SELECT 
          INDEX_NAME,
          COLUMN_NAME,
          NON_UNIQUE,
          INDEX_TYPE
        FROM 
          information_schema.STATISTICS
        WHERE 
          TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY 
          INDEX_NAME, SEQ_IN_INDEX`,
        [connectionData.database, tableName]
      );
      
      // Process indexes to group by name
      const processedIndexes: Record<string, any> = {};
      for (const index of indexes as any[]) {
        if (!processedIndexes[index.INDEX_NAME]) {
          processedIndexes[index.INDEX_NAME] = {
            name: index.INDEX_NAME,
            columns: [],
            unique: index.NON_UNIQUE === 0,
            type: index.INDEX_TYPE,
          };
        }
        processedIndexes[index.INDEX_NAME].columns.push(index.COLUMN_NAME);
      }
      
      schema[tableName] = {
        name: tableName,
        type: table.TABLE_TYPE,
        comment: table.TABLE_COMMENT,
        columns: columns.map((column: any) => ({
          name: column.COLUMN_NAME,
          type: column.DATA_TYPE,
          nullable: column.IS_NULLABLE === 'YES',
          defaultValue: column.COLUMN_DEFAULT,
          comment: column.COLUMN_COMMENT,
          extra: column.EXTRA,
          key: column.COLUMN_KEY,
        })),
        primaryKey: primaryKeys.map((pk: any) => pk.COLUMN_NAME),
        foreignKeys: foreignKeys.map((fk: any) => ({
          name: fk.CONSTRAINT_NAME,
          column: fk.COLUMN_NAME,
          referenceTable: fk.REFERENCED_TABLE_NAME,
          referenceColumn: fk.REFERENCED_COLUMN_NAME,
        })),
        indexes: Object.values(processedIndexes),
      };
    }
    
    await connection.end();
    
    // If this is the first page, cache the complete schema
    if (page === 1) {
      // Get all tables for caching
      const allSchema = { ...schema };
      
      if (totalPages > 1) {
        const connection2 = await createConnection(
          connectionData.host,
          connectionData.port,
          connectionData.user,
          connectionData.password,
          connectionData.database,
          connectionData.ssl
        );
        
        // Get rest of the tables for caching
        for (let p = 2; p <= totalPages; p++) {
          const [moreTables] = await connection2.query(
            "SELECT TABLE_NAME, TABLE_TYPE, TABLE_COMMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? LIMIT ? OFFSET ?",
            [connectionData.database, pageSize, (p - 1) * pageSize]
          );
          
          // Process each table
          for (const table of moreTables as any[]) {
            const tableName = table.TABLE_NAME;
            
            // Get columns
            const [columns] = await connection2.query(
              `SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                IS_NULLABLE, 
                COLUMN_KEY,
                EXTRA,
                COLUMN_DEFAULT,
                COLUMN_COMMENT
              FROM 
                information_schema.COLUMNS 
              WHERE 
                TABLE_SCHEMA = ? AND TABLE_NAME = ?
              ORDER BY 
                ORDINAL_POSITION`,
              [connectionData.database, tableName]
            );
            
            // Get primary key
            const [primaryKeys] = await connection2.query(
              `SELECT 
                COLUMN_NAME
              FROM 
                information_schema.KEY_COLUMN_USAGE
              WHERE 
                TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY'
              ORDER BY 
                ORDINAL_POSITION`,
              [connectionData.database, tableName]
            );
            
            // Get foreign keys
            const [foreignKeys] = await connection2.query(
              `SELECT 
                CONSTRAINT_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
              FROM 
                information_schema.KEY_COLUMN_USAGE
              WHERE 
                TABLE_SCHEMA = ? 
                AND TABLE_NAME = ? 
                AND REFERENCED_TABLE_NAME IS NOT NULL`,
              [connectionData.database, tableName]
            );
            
            // Get indexes
            const [indexes] = await connection2.query(
              `SELECT 
                INDEX_NAME,
                COLUMN_NAME,
                NON_UNIQUE,
                INDEX_TYPE
              FROM 
                information_schema.STATISTICS
              WHERE 
                TABLE_SCHEMA = ? AND TABLE_NAME = ?
              ORDER BY 
                INDEX_NAME, SEQ_IN_INDEX`,
              [connectionData.database, tableName]
            );
            
            // Process indexes to group by name
            const processedIndexes: Record<string, any> = {};
            for (const index of indexes as any[]) {
              if (!processedIndexes[index.INDEX_NAME]) {
                processedIndexes[index.INDEX_NAME] = {
                  name: index.INDEX_NAME,
                  columns: [],
                  unique: index.NON_UNIQUE === 0,
                  type: index.INDEX_TYPE,
                };
              }
              processedIndexes[index.INDEX_NAME].columns.push(index.COLUMN_NAME);
            }
            
            allSchema[tableName] = {
              name: tableName,
              type: table.TABLE_TYPE,
              comment: table.TABLE_COMMENT,
              columns: columns.map((column: any) => ({
                name: column.COLUMN_NAME,
                type: column.DATA_TYPE,
                nullable: column.IS_NULLABLE === 'YES',
                defaultValue: column.COLUMN_DEFAULT,
                comment: column.COLUMN_COMMENT,
                extra: column.EXTRA,
                key: column.COLUMN_KEY,
              })),
              primaryKey: primaryKeys.map((pk: any) => pk.COLUMN_NAME),
              foreignKeys: foreignKeys.map((fk: any) => ({
                name: fk.CONSTRAINT_NAME,
                column: fk.COLUMN_NAME,
                referenceTable: fk.REFERENCED_TABLE_NAME,
                referenceColumn: fk.REFERENCED_COLUMN_NAME,
              })),
              indexes: Object.values(processedIndexes),
            };
          }
        }
        
        await connection2.end();
      }
      
      // Cache the schema in Firestore
      const now = Date.now();
      const previousVersion = await getCachedSchema(userId, connectionId);
      const versionId = now.toString();
      
      // Store the schema in Firestore
      await cacheSchema(userId, connectionId, allSchema, now, versionId);
      
      // If there was a previous version, store the differences
      if (previousVersion) {
        const changes = detectSchemaChanges(previousVersion.schema, allSchema);
        if (Object.keys(changes.addedTables).length > 0 || 
            Object.keys(changes.removedTables).length > 0 || 
            Object.keys(changes.modifiedTables).length > 0) {
          await storeSchemaChanges(
            userId, 
            connectionId, 
            previousVersion.versionId, 
            versionId, 
            changes
          );
        }
      }
    }
    
    return {
      success: true,
      schema,
      fromCache: false,
      updatedAt: Date.now(),
      versionId: Date.now().toString(),
      pagination: {
        page,
        pageSize,
        totalPages,
        totalTables,
      }
    };
  } catch (error) {
    console.error("Error retrieving database schema:", error);
    return {
      success: false,
      message: `Failed to retrieve database schema: ${error.message}`,
    };
  }
});

/**
 * Get cached schema from Firestore
 * @param userId 
 * @param connectionId 
 * @returns 
 */
async function getCachedSchema(userId: string, connectionId: string): Promise<{
  schema: Record<string, any>;
  updatedAt: number;
  versionId: string;
} | null> {
  try {
    const schemaRef = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('connections')
      .doc(connectionId)
      .collection('schema')
      .doc('current');
    
    const doc = await schemaRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    return {
      schema: data?.schema || {},
      updatedAt: data?.updatedAt || 0,
      versionId: data?.versionId || '',
    };
  } catch (error) {
    console.error('Error getting cached schema:', error);
    return null;
  }
}

/**
 * Cache schema in Firestore
 * @param userId 
 * @param connectionId 
 * @param schema 
 * @param timestamp 
 * @param versionId 
 */
async function cacheSchema(
  userId: string, 
  connectionId: string, 
  schema: Record<string, any>,
  timestamp: number,
  versionId: string
): Promise<void> {
  try {
    const batch = admin.firestore().batch();
    
    // Update current schema
    const currentRef = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('connections')
      .doc(connectionId)
      .collection('schema')
      .doc('current');
    
    batch.set(currentRef, {
      schema,
      updatedAt: timestamp,
      versionId,
    });
    
    // Store schema version
    const versionRef = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('connections')
      .doc(connectionId)
      .collection('schemaVersions')
      .doc(versionId);
    
    batch.set(versionRef, {
      schema,
      createdAt: timestamp,
      versionId,
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error caching schema:', error);
    throw error;
  }
}

/**
 * Apply pagination to schema
 * @param schema 
 * @param page 
 * @param pageSize 
 * @returns 
 */
function paginateSchema(
  schema: Record<string, any>,
  page: number,
  pageSize: number
): {
  schema: Record<string, any>;
  totalPages: number;
  totalTables: number;
} {
  const tableNames = Object.keys(schema);
  const totalTables = tableNames.length;
  const totalPages = Math.ceil(totalTables / pageSize);
  
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, totalTables);
  
  const paginatedSchema: Record<string, any> = {};
  
  for (let i = start; i < end; i++) {
    const tableName = tableNames[i];
    paginatedSchema[tableName] = schema[tableName];
  }
  
  return {
    schema: paginatedSchema,
    totalPages,
    totalTables,
  };
}

/**
 * Detect changes between two schema versions
 * @param oldSchema 
 * @param newSchema 
 * @returns 
 */
function detectSchemaChanges(
  oldSchema: Record<string, any>,
  newSchema: Record<string, any>
): Record<string, any> {
  const changes: Record<string, any> = {
    addedTables: [],
    removedTables: [],
    modifiedTables: {},
  };
  
  // Detect added and removed tables
  const oldTableNames = Object.keys(oldSchema);
  const newTableNames = Object.keys(newSchema);
  
  changes.addedTables = newTableNames.filter(name => !oldTableNames.includes(name));
  changes.removedTables = oldTableNames.filter(name => !newTableNames.includes(name));
  
  // Detect modified tables
  const commonTables = oldTableNames.filter(name => newTableNames.includes(name));
  
  for (const tableName of commonTables) {
    const oldTable = oldSchema[tableName];
    const newTable = newSchema[tableName];
    const tableChanges: Record<string, any> = {
      addedColumns: [],
      removedColumns: [],
      modifiedColumns: {},
      addedIndexes: [],
      removedIndexes: [],
      modifiedIndexes: {},
      addedForeignKeys: [],
      removedForeignKeys: [],
      modifiedForeignKeys: {},
      commentChanged: false,
    };
    
    // Check if table comment changed
    if (oldTable.comment !== newTable.comment) {
      tableChanges.commentChanged = true;
      tableChanges.oldComment = oldTable.comment;
      tableChanges.newComment = newTable.comment;
    }
    
    // Check column changes
    const oldColumnNames = oldTable.columns.map((col: any) => col.name);
    const newColumnNames = newTable.columns.map((col: any) => col.name);
    
    tableChanges.addedColumns = newColumnNames.filter(name => !oldColumnNames.includes(name));
    tableChanges.removedColumns = oldColumnNames.filter(name => !newColumnNames.includes(name));
    
    // Check modified columns
    const commonColumns = oldColumnNames.filter(name => newColumnNames.includes(name));
    
    for (const colName of commonColumns) {
      const oldCol = oldTable.columns.find((col: any) => col.name === colName);
      const newCol = newTable.columns.find((col: any) => col.name === colName);
      
      // Compare column properties
      if (oldCol.type !== newCol.type || 
          oldCol.nullable !== newCol.nullable || 
          oldCol.defaultValue !== newCol.defaultValue || 
          oldCol.comment !== newCol.comment || 
          oldCol.extra !== newCol.extra) {
        
        tableChanges.modifiedColumns[colName] = {
          old: oldCol,
          new: newCol,
          changes: {
            type: oldCol.type !== newCol.type,
            nullable: oldCol.nullable !== newCol.nullable,
            defaultValue: oldCol.defaultValue !== newCol.defaultValue,
            comment: oldCol.comment !== newCol.comment,
            extra: oldCol.extra !== newCol.extra,
          }
        };
      }
    }
    
    // Check index changes
    const oldIndexNames = oldTable.indexes ? oldTable.indexes.map((idx: any) => idx.name) : [];
    const newIndexNames = newTable.indexes ? newTable.indexes.map((idx: any) => idx.name) : [];
    
    tableChanges.addedIndexes = newIndexNames.filter(name => !oldIndexNames.includes(name));
    tableChanges.removedIndexes = oldIndexNames.filter(name => !newIndexNames.includes(name));
    
    // Check modified indexes
    const commonIndexes = oldIndexNames.filter(name => newIndexNames.includes(name));
    
    for (const idxName of commonIndexes) {
      const oldIdx = oldTable.indexes.find((idx: any) => idx.name === idxName);
      const newIdx = newTable.indexes.find((idx: any) => idx.name === idxName);
      
      // Compare index properties
      if (oldIdx.unique !== newIdx.unique || 
          oldIdx.type !== newIdx.type || 
          JSON.stringify(oldIdx.columns.sort()) !== JSON.stringify(newIdx.columns.sort())) {
        
        tableChanges.modifiedIndexes[idxName] = {
          old: oldIdx,
          new: newIdx,
          changes: {
            unique: oldIdx.unique !== newIdx.unique,
            type: oldIdx.type !== newIdx.type,
            columns: JSON.stringify(oldIdx.columns.sort()) !== JSON.stringify(newIdx.columns.sort()),
          }
        };
      }
    }
    
    // Check foreign key changes
    const oldFkNames = oldTable.foreignKeys ? oldTable.foreignKeys.map((fk: any) => fk.name) : [];
    const newFkNames = newTable.foreignKeys ? newTable.foreignKeys.map((fk: any) => fk.name) : [];
    
    tableChanges.addedForeignKeys = newFkNames.filter(name => !oldFkNames.includes(name));
    tableChanges.removedForeignKeys = oldFkNames.filter(name => !newFkNames.includes(name));
    
    // Check modified foreign keys
    const commonForeignKeys = oldFkNames.filter(name => newFkNames.includes(name));
    
    for (const fkName of commonForeignKeys) {
      const oldFk = oldTable.foreignKeys.find((fk: any) => fk.name === fkName);
      const newFk = newTable.foreignKeys.find((fk: any) => fk.name === fkName);
      
      // Compare foreign key properties
      if (oldFk.column !== newFk.column || 
          oldFk.referenceTable !== newFk.referenceTable || 
          oldFk.referenceColumn !== newFk.referenceColumn) {
        
        tableChanges.modifiedForeignKeys[fkName] = {
          old: oldFk,
          new: newFk,
          changes: {
            column: oldFk.column !== newFk.column,
            referenceTable: oldFk.referenceTable !== newFk.referenceTable,
            referenceColumn: oldFk.referenceColumn !== newFk.referenceColumn,
          }
        };
      }
    }
    
    // Add table changes only if there are any
    if (tableChanges.addedColumns.length > 0 || 
        tableChanges.removedColumns.length > 0 || 
        Object.keys(tableChanges.modifiedColumns).length > 0 ||
        tableChanges.addedIndexes.length > 0 || 
        tableChanges.removedIndexes.length > 0 || 
        Object.keys(tableChanges.modifiedIndexes).length > 0 ||
        tableChanges.addedForeignKeys.length > 0 || 
        tableChanges.removedForeignKeys.length > 0 || 
        Object.keys(tableChanges.modifiedForeignKeys).length > 0 ||
        tableChanges.commentChanged) {
      
      changes.modifiedTables[tableName] = tableChanges;
    }
  }
  
  return changes;
}

/**
 * Store schema changes in Firestore
 * @param userId 
 * @param connectionId 
 * @param oldVersionId 
 * @param newVersionId 
 * @param changes 
 */
async function storeSchemaChanges(
  userId: string, 
  connectionId: string, 
  oldVersionId: string, 
  newVersionId: string, 
  changes: Record<string, any>
): Promise<void> {
  try {
    // Store changes in Firestore
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('connections')
      .doc(connectionId)
      .collection('schemaChanges')
      .doc(`${oldVersionId}_to_${newVersionId}`)
      .set({
        oldVersionId,
        newVersionId,
        createdAt: Date.now(),
        changes,
      });
  } catch (error) {
    console.error('Error storing schema changes:', error);
    throw error;
  }
}

/**
 * Get schema versions for a connection
 */
export const getSchemaVersions = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  const { connectionId, limit = 10 } = data;
  
  if (!connectionId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Connection ID is required"
    );
  }
  
  try {
    // Get schema versions from Firestore
    const versionsSnapshot = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('connections')
      .doc(connectionId)
      .collection('schemaVersions')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    const versions = versionsSnapshot.docs.map(doc => ({
      versionId: doc.id,
      createdAt: doc.data().createdAt,
    }));
    
    return {
      success: true,
      versions,
    };
  } catch (error) {
    console.error("Error retrieving schema versions:", error);
    return {
      success: false,
      message: `Failed to retrieve schema versions: ${error.message}`,
    };
  }
});

/**
 * Get schema changes between two versions
 */
export const getSchemaChanges = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  const { connectionId, oldVersionId, newVersionId } = data;
  
  if (!connectionId || !oldVersionId || !newVersionId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Connection ID, old version ID, and new version ID are required"
    );
  }
  
  try {
    // Try to get stored changes first
    const changesDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('connections')
      .doc(connectionId)
      .collection('schemaChanges')
      .doc(`${oldVersionId}_to_${newVersionId}`)
      .get();
    
    if (changesDoc.exists) {
      return {
        success: true,
        changes: changesDoc.data()?.changes || {},
        createdAt: changesDoc.data()?.createdAt,
      };
    }
    
    // If stored changes not found, compute them
    const oldVersionDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('connections')
      .doc(connectionId)
      .collection('schemaVersions')
      .doc(oldVersionId)
      .get();
    
    const newVersionDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('connections')
      .doc(connectionId)
      .collection('schemaVersions')
      .doc(newVersionId)
      .get();
    
    if (!oldVersionDoc.exists || !newVersionDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "One or both schema versions not found"
      );
    }
    
    const oldSchema = oldVersionDoc.data()?.schema || {};
    const newSchema = newVersionDoc.data()?.schema || {};
    
    const changes = detectSchemaChanges(oldSchema, newSchema);
    
    // Store changes for future use
    await storeSchemaChanges(
      userId, 
      connectionId, 
      oldVersionId, 
      newVersionId, 
      changes
    );
    
    return {
      success: true,
      changes,
      createdAt: Date.now(),
    };
  } catch (error) {
    console.error("Error retrieving schema changes:", error);
    return {
      success: false,
      message: `Failed to retrieve schema changes: ${error.message}`,
    };
  }
});

/**
 * Get specific schema version
 */
export const getSchemaVersion = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  const { connectionId, versionId, page = 1, pageSize = 50 } = data;
  
  if (!connectionId || !versionId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Connection ID and version ID are required"
    );
  }
  
  try {
    // Get schema version from Firestore
    const versionDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('connections')
      .doc(connectionId)
      .collection('schemaVersions')
      .doc(versionId)
      .get();
    
    if (!versionDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Schema version not found"
      );
    }
    
    const schema = versionDoc.data()?.schema || {};
    const createdAt = versionDoc.data()?.createdAt;
    
    // Apply pagination to the schema
    const paginatedSchema = paginateSchema(schema, page, pageSize);
    
    return {
      success: true,
      schema: paginatedSchema.schema,
      createdAt,
      versionId,
      pagination: {
        page,
        pageSize,
        totalPages: paginatedSchema.totalPages,
        totalTables: paginatedSchema.totalTables,
      }
    };
  } catch (error) {
    console.error("Error retrieving schema version:", error);
    return {
      success: false,
      message: `Failed to retrieve schema version: ${error.message}`,
    };
  }
});
