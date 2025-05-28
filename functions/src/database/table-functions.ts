import * as functions from "firebase-functions";
import { getConnection, updateLastUsed, createConnection } from "./index";

// Cloud Function to get table data with pagination and sorting
export const getTableData = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  const { 
    connectionId, 
    tableName, 
    page = 1, 
    pageSize = 50,
    sortColumn,
    sortDirection,
    filters = []
  } = data;
  
  if (!connectionId || !tableName) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Connection ID and table name are required"
    );
  }
  
  try {
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
    
    // Build the query
    let query = `SELECT * FROM ${tableName}`;
    const queryParams: any[] = [];
    
    // Add WHERE clause if filters are provided
    if (filters && filters.length > 0) {
      const filterClauses: string[] = [];
      
      filters.forEach(filter => {
        const { column, operator, value } = filter;
        
        if (column && operator) {
          switch (operator.toLowerCase()) {
            case 'equals':
              filterClauses.push(`${column} = ?`);
              queryParams.push(value);
              break;
            case 'contains':
              filterClauses.push(`${column} LIKE ?`);
              queryParams.push(`%${value}%`);
              break;
            case 'startswith':
              filterClauses.push(`${column} LIKE ?`);
              queryParams.push(`${value}%`);
              break;
            case 'endswith':
              filterClauses.push(`${column} LIKE ?`);
              queryParams.push(`%${value}`);
              break;
            case 'gt':
              filterClauses.push(`${column} > ?`);
              queryParams.push(value);
              break;
            case 'gte':
              filterClauses.push(`${column} >= ?`);
              queryParams.push(value);
              break;
            case 'lt':
              filterClauses.push(`${column} < ?`);
              queryParams.push(value);
              break;
            case 'lte':
              filterClauses.push(`${column} <= ?`);
              queryParams.push(value);
              break;
          }
        }
      });
      
      if (filterClauses.length > 0) {
        query += ` WHERE ${filterClauses.join(' AND ')}`;
      }
    }
    
    // Add ORDER BY clause if sorting is specified
    if (sortColumn) {
      query += ` ORDER BY ${sortColumn} ${sortDirection === 'desc' ? 'DESC' : 'ASC'}`;
    }
    
    // Get total count
    let totalQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
    if (query.includes('WHERE')) {
      totalQuery += query.substring(query.indexOf('WHERE'));
    }
    
    const [countResult] = await connection.query(totalQuery, queryParams);
    const total = (countResult as any[])[0].count;
    
    // Add LIMIT and OFFSET for pagination
    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(pageSize);
    queryParams.push((page - 1) * pageSize);
    
    // Execute the query
    const [rows] = await connection.query(query, queryParams);
    
    await connection.end();
    
    return {
      success: true,
      data: {
        rows,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      }
    };
  } catch (error) {
    console.error("Error retrieving table data:", error);
    return {
      success: false,
      message: `Failed to retrieve table data: ${error.message}`,
    };
  }
});

// Cloud Function to update a table row
export const updateTableRow = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  const { connectionId, tableName, primaryKeyColumn, primaryKeyValue, updatedData } = data;
  
  if (!connectionId || !tableName || !primaryKeyColumn || primaryKeyValue === undefined || !updatedData) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required parameters"
    );
  }
  
  try {
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
    
    // Build the query
    const columns: string[] = [];
    const values: any[] = [];
    
    Object.entries(updatedData).forEach(([column, value]) => {
      // Skip primary key column
      if (column !== primaryKeyColumn) {
        columns.push(`${column} = ?`);
        values.push(value);
      }
    });
    
    if (columns.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "No columns to update"
      );
    }
    
    // Add primary key value to values
    values.push(primaryKeyValue);
    
    const query = `UPDATE ${tableName} SET ${columns.join(', ')} WHERE ${primaryKeyColumn} = ?`;
    
    // Execute the query
    const [result] = await connection.query(query, values);
    await connection.end();
    
    const affectedRows = (result as any).affectedRows || 0;
    
    if (affectedRows === 0) {
      return {
        success: false,
        message: "No rows were updated. The record may not exist or no changes were made.",
      };
    }
    
    return {
      success: true,
      message: `Updated ${affectedRows} row(s) successfully`,
      affectedRows,
    };
  } catch (error) {
    console.error("Error updating table row:", error);
    return {
      success: false,
      message: `Failed to update table row: ${error.message}`,
    };
  }
});

// Cloud Function to insert a new table row
export const insertTableRow = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  const { connectionId, tableName, rowData } = data;
  
  if (!connectionId || !tableName || !rowData) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required parameters"
    );
  }
  
  try {
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
    
    // Build the query
    const columns: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];
    
    Object.entries(rowData).forEach(([column, value]) => {
      columns.push(column);
      placeholders.push('?');
      values.push(value);
    });
    
    if (columns.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "No columns to insert"
      );
    }
    
    const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
    
    // Execute the query
    const [result] = await connection.query(query, values);
    await connection.end();
    
    const insertId = (result as any).insertId;
    const affectedRows = (result as any).affectedRows || 0;
    
    return {
      success: true,
      message: `Inserted ${affectedRows} row(s) successfully`,
      affectedRows,
      insertId,
    };
  } catch (error) {
    console.error("Error inserting table row:", error);
    return {
      success: false,
      message: `Failed to insert table row: ${error.message}`,
    };
  }
});

// Cloud Function to delete a table row
export const deleteTableRow = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  const userId = context.auth.uid;
  const { connectionId, tableName, primaryKeyColumn, primaryKeyValue } = data;
  
  if (!connectionId || !tableName || !primaryKeyColumn || primaryKeyValue === undefined) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required parameters"
    );
  }
  
  try {
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
    
    // Build the query
    const query = `DELETE FROM ${tableName} WHERE ${primaryKeyColumn} = ?`;
    
    // Execute the query
    const [result] = await connection.query(query, [primaryKeyValue]);
    await connection.end();
    
    const affectedRows = (result as any).affectedRows || 0;
    
    if (affectedRows === 0) {
      return {
        success: false,
        message: "No rows were deleted. The record may not exist.",
      };
    }
    
    return {
      success: true,
      message: `Deleted ${affectedRows} row(s) successfully`,
      affectedRows,
    };
  } catch (error) {
    console.error("Error deleting table row:", error);
    return {
      success: false,
      message: `Failed to delete table row: ${error.message}`,
    };
  }
});