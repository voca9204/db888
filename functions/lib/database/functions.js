"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchemaVersion = exports.getSchemaChanges = exports.getSchemaVersions = exports.getDatabaseSchema = exports.executeQuery = exports.deleteDbConnection = exports.getDbConnections = exports.saveDbConnection = exports.testConnection = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const encryption_1 = require("../utils/encryption");
const index_1 = require("./index");
const retry_1 = require("../utils/retry");
// Cloud Function to test a database connection
exports.testConnection = functions.https.onCall(async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const userId = context.auth.uid;
    try {
        // Validate the request
        if (!data) {
            throw new functions.https.HttpsError("invalid-argument", "Missing connection parameters");
        }
        // If connectionId is provided, test an existing connection
        if (data.connectionId) {
            // Get connection details from Firestore
            try {
                const connectionData = await (0, index_1.getConnection)(userId, data.connectionId);
                // Check if connection data has all required fields
                if (!connectionData.host || !connectionData.user || !connectionData.password) {
                    throw new functions.https.HttpsError("failed-precondition", "Connection is missing required fields");
                }
                // Test the connection
                const startTime = Date.now();
                const connection = await (0, index_1.createConnection)(connectionData.host, connectionData.port, connectionData.user, connectionData.password, connectionData.database, connectionData.ssl);
                // Execute a simple query to verify connection
                await connection.query('SELECT 1 AS connection_test');
                // Close the connection
                await closeConnection(connection);
                const executionTime = Date.now() - startTime;
                // Update last used timestamp
                await (0, index_1.updateLastUsed)(data.connectionId);
                return {
                    success: true,
                    message: "Connection successful",
                    executionTime,
                    details: {
                        host: connectionData.host,
                        port: connectionData.port,
                        database: connectionData.database,
                        user: connectionData.user,
                        ssl: connectionData.ssl
                    }
                };
            }
            catch (error) {
                console.error("Error testing existing connection:", error);
                return {
                    success: false,
                    message: `Connection failed: ${error.message}`,
                    errorCode: error.code || 'unknown'
                };
            }
        }
        else {
            // Test a new connection with provided details
            const { host, port, user, password, database, ssl } = data;
            // Validate required parameters
            if (!host || !user || !password || !database) {
                throw new functions.https.HttpsError("invalid-argument", "Missing required connection parameters: host, user, password, and database are required");
            }
            if (isNaN(parseInt(port, 10))) {
                throw new functions.https.HttpsError("invalid-argument", "Port must be a valid number");
            }
            try {
                // Test the connection with retry logic
                const startTime = Date.now();
                const connection = await (0, retry_1.retryWithBackoff)(async () => {
                    return await (0, index_1.createConnection)(host, parseInt(port, 10), user, password, database, ssl === true);
                }, 3); // Retry up to 3 times
                // Test server information
                const [serverInfo] = await connection.query('SELECT VERSION() AS version, DATABASE() AS database, USER() AS user');
                // Test database permissions
                const [permissionResults] = await connection.query(`
          SHOW GRANTS FOR CURRENT_USER();
        `);
                // Get basic schema info to verify read access
                const [schemaInfo] = await connection.query(`
          SELECT 
            COUNT(*) AS table_count
          FROM 
            information_schema.TABLES 
          WHERE 
            TABLE_SCHEMA = ?
        `, [database]);
                // Close the connection
                await closeConnection(connection);
                const executionTime = Date.now() - startTime;
                return {
                    success: true,
                    message: "Connection successful",
                    executionTime,
                    details: {
                        host,
                        port: parseInt(port, 10),
                        database,
                        user,
                        ssl: ssl === true,
                        serverInfo: serverInfo[0],
                        permissions: permissionResults,
                        schemaInfo: schemaInfo[0],
                    }
                };
            }
            catch (error) {
                console.error("Error testing new connection:", error);
                // Provide more user-friendly error messages for common cases
                let errorMessage = error.message;
                let errorCode = 'unknown';
                if (error.code === 'ECONNREFUSED') {
                    errorMessage = `Unable to connect to MariaDB server at ${host}:${port}. Ensure the server is running and accessible.`;
                    errorCode = 'connection_refused';
                }
                else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                    errorMessage = 'Access denied. Invalid username or password.';
                    errorCode = 'access_denied';
                }
                else if (error.code === 'ER_BAD_DB_ERROR') {
                    errorMessage = `Database '${database}' does not exist on the server.`;
                    errorCode = 'database_not_found';
                }
                else if (error.code === 'ETIMEDOUT') {
                    errorMessage = 'Connection timed out. Please check your network settings and firewall rules.';
                    errorCode = 'connection_timeout';
                }
                else if (error.code === 'ENOTFOUND') {
                    errorMessage = `Host '${host}' not found. Please check the hostname.`;
                    errorCode = 'host_not_found';
                }
                return {
                    success: false,
                    message: `Connection failed: ${errorMessage}`,
                    errorCode: errorCode,
                    originalError: error.message,
                    details: {
                        host: host,
                        port: port,
                        database: database,
                        user: user,
                        ssl: ssl === true,
                        errorStack: error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'No stack trace',
                        errorCode: error.code || 'unknown',
                        errno: error.errno || 'unknown'
                    }
                };
            }
        }
    }
    catch (error) {
        console.error("Error in testConnection function:", error);
        throw new functions.https.HttpsError("internal", `Internal error: ${error.message}`);
    }
});
// Cloud Function to save database connection
exports.saveDbConnection = functions.https.onCall(async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const userId = context.auth.uid;
    try {
        // Validate the request
        if (!data) {
            throw new functions.https.HttpsError("invalid-argument", "Missing connection parameters");
        }
        const { name, host, port, database, user, password, ssl, id, tags, description } = data;
        // Validate required fields
        if (!name || !host || !port || !database || !user) {
            throw new functions.https.HttpsError("invalid-argument", "Missing required connection parameters: name, host, port, database, and user are required");
        }
        // Validate port is a number
        if (isNaN(parseInt(port, 10))) {
            throw new functions.https.HttpsError("invalid-argument", "Port must be a valid number");
        }
        // If updating an existing connection without a new password, 
        // get the existing connection to preserve the password
        let existingPassword;
        if (id && !password) {
            try {
                const existingConnection = await (0, index_1.getConnection)(userId, id);
                existingPassword = existingConnection.password;
            }
            catch (error) {
                // If connection not found, require a password
                throw new functions.https.HttpsError("not-found", "Connection not found for updating. Please provide all required fields.");
            }
        }
        // Encrypt password if provided
        const encryptedPassword = password
            ? (0, encryption_1.encrypt)(password)
            : existingPassword;
        if (!password && !existingPassword) {
            throw new functions.https.HttpsError("invalid-argument", "Password is required for new connections");
        }
        // Create connection config
        const connectionConfig = Object.assign({ id: id || "", name,
            host, port: parseInt(port.toString(), 10), database,
            user, password: encryptedPassword, ssl: !!ssl, userId, createdAt: id ? undefined : Date.now(), updatedAt: Date.now(), 
            // Optional fields
            tags: tags || [], description: description || "" }, Object.keys(data)
            .filter(key => !['id', 'name', 'host', 'port', 'database', 'user', 'password', 'ssl', 'userId', 'createdAt', 'updatedAt'].includes(key))
            .reduce((obj, key) => (Object.assign(Object.assign({}, obj), { [key]: data[key] })), {}));
        // Test the connection before saving
        try {
            const connection = await (0, index_1.createConnection)(connectionConfig.host, connectionConfig.port, connectionConfig.user, password || existingPassword, connectionConfig.database, connectionConfig.ssl);
            // Execute a simple query to verify connection
            await connection.query('SELECT 1 AS connection_test');
            // Close the connection
            await closeConnection(connection);
        }
        catch (error) {
            throw new functions.https.HttpsError("aborted", `Connection test failed: ${error.message}. Connection not saved.`);
        }
        // Save connection to Firestore
        const connectionId = await (0, index_1.saveConnection)(connectionConfig);
        return {
            success: true,
            connectionId,
            message: id ? "Connection updated successfully" : "Connection saved successfully",
            details: {
                name: connectionConfig.name,
                host: connectionConfig.host,
                port: connectionConfig.port,
                database: connectionConfig.database,
                user: connectionConfig.user,
                ssl: connectionConfig.ssl,
                tags: connectionConfig.tags,
                description: connectionConfig.description,
            }
        };
    }
    catch (error) {
        console.error("Error saving connection:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error; // Re-throw HttpsError
        }
        return {
            success: false,
            message: `Failed to save connection: ${error.message}`,
            errorCode: error.code || 'unknown_error'
        };
    }
});
// Cloud Function to get all user's database connections
exports.getDbConnections = functions.https.onCall(async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const userId = context.auth.uid;
    try {
        // Get optional filtering and sorting parameters
        const { tags, sortBy, sortOrder, searchTerm, limit } = data || {};
        // Get connections from Firestore
        let query = admin.firestore()
            .collection("connections")
            .where("userId", "==", userId);
        // Apply tag filtering if provided
        if (tags && Array.isArray(tags) && tags.length > 0) {
            query = query.where("tags", "array-contains-any", tags);
        }
        // Apply search term filtering if provided
        if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== '') {
            // Unfortunately, Firestore doesn't support full-text search
            // So we'll get all connections and filter them in memory
            // This is inefficient but works for now
            // For production, consider using a dedicated search service like Algolia
            const snapshot = await query.get();
            // Filter connections based on search term
            const searchTermLower = searchTerm.toLowerCase();
            const connections = snapshot.docs
                .map(doc => {
                const data = doc.data();
                // Don't include the password in the response
                const { password } = data, rest = __rest(data, ["password"]);
                return rest;
            })
                .filter(connection => {
                return ((connection.name && connection.name.toLowerCase().includes(searchTermLower)) ||
                    (connection.host && connection.host.toLowerCase().includes(searchTermLower)) ||
                    (connection.database && connection.database.toLowerCase().includes(searchTermLower)) ||
                    (connection.description && connection.description.toLowerCase().includes(searchTermLower)));
            });
            // Apply sorting
            if (sortBy && ['name', 'host', 'database', 'updatedAt', 'createdAt', 'lastUsed'].includes(sortBy)) {
                connections.sort((a, b) => {
                    const aValue = a[sortBy] || 0;
                    const bValue = b[sortBy] || 0;
                    const order = sortOrder === 'desc' ? -1 : 1;
                    return order * (typeof aValue === 'string'
                        ? aValue.localeCompare(bValue)
                        : aValue - bValue);
                });
            }
            else {
                // Default to sorting by last updated
                connections.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            }
            // Apply limit
            const limitNum = parseInt(limit, 10) || 100;
            const limitedConnections = connections.slice(0, limitNum);
            return {
                success: true,
                connections: limitedConnections,
                total: connections.length,
                filtered: connections.length !== snapshot.docs.length
            };
        }
        else {
            // Apply sorting if provided
            if (sortBy && ['name', 'host', 'database', 'updatedAt', 'createdAt', 'lastUsed'].includes(sortBy)) {
                query = query.orderBy(sortBy, sortOrder === 'desc' ? 'desc' : 'asc');
            }
            else {
                // Default to sorting by last updated
                query = query.orderBy('updatedAt', 'desc');
            }
            // Apply limit if provided
            if (limit && !isNaN(parseInt(limit, 10))) {
                query = query.limit(parseInt(limit, 10));
            }
            else {
                // Default limit
                query = query.limit(100);
            }
            const connections = await (0, index_1.getAllConnections)(userId, query);
            return {
                success: true,
                connections,
                total: connections.length,
                filtered: false
            };
        }
    }
    catch (error) {
        console.error("Error retrieving connections:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", `Failed to retrieve connections: ${error.message}`);
    }
});
// Cloud Function to delete a database connection
exports.deleteDbConnection = functions.https.onCall(async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const userId = context.auth.uid;
    const { connectionId } = data || {};
    if (!connectionId) {
        throw new functions.https.HttpsError("invalid-argument", "Connection ID is required");
    }
    try {
        // Verify connection exists and belongs to the user
        try {
            await (0, index_1.getConnection)(userId, connectionId);
        }
        catch (error) {
            throw new functions.https.HttpsError("not-found", "Connection not found or you don't have permission to delete it");
        }
        // Delete the connection
        await (0, index_1.deleteConnection)(userId, connectionId);
        // Delete related data
        await deleteConnectionRelatedData(userId, connectionId);
        return {
            success: true,
            message: "Connection deleted successfully",
            connectionId
        };
    }
    catch (error) {
        console.error("Error deleting connection:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", `Failed to delete connection: ${error.message}`);
    }
});
/**
 * Delete data related to a connection (schemas, logs, etc.)
 * @param userId User ID
 * @param connectionId Connection ID
 */
async function deleteConnectionRelatedData(userId, connectionId) {
    try {
        const batch = admin.firestore().batch();
        // Delete schema cache
        const schemaRef = admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('connections')
            .doc(connectionId)
            .collection('schema')
            .doc('current');
        batch.delete(schemaRef);
        // Delete schema versions (first 100)
        const versionsSnapshot = await admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('connections')
            .doc(connectionId)
            .collection('schemaVersions')
            .limit(100)
            .get();
        versionsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        // Delete schema changes (first 100)
        const changesSnapshot = await admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('connections')
            .doc(connectionId)
            .collection('schemaChanges')
            .limit(100)
            .get();
        changesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        // Commit the batch
        await batch.commit();
        // Delete query logs (needs to be paginated for large data)
        // Get query logs for this connection
        const logsSnapshot = await admin.firestore()
            .collection("queryLogs")
            .where("connectionId", "==", connectionId)
            .limit(100)
            .get();
        if (!logsSnapshot.empty) {
            const logBatch = admin.firestore().batch();
            logsSnapshot.docs.forEach(doc => {
                logBatch.delete(doc.ref);
            });
            await logBatch.commit();
        }
    }
    catch (error) {
        console.error("Error deleting connection related data:", error);
        // Non-critical error, so we don't rethrow
    }
}
// Cloud Function to execute a database query
exports.executeQuery = functions.https.onCall(async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const userId = context.auth.uid;
    const { connectionId, query, parameters = [] } = data;
    if (!connectionId || !query) {
        throw new functions.https.HttpsError("invalid-argument", "Connection ID and query are required");
    }
    try {
        const startTime = Date.now();
        const connectionData = await (0, index_1.getConnection)(userId, connectionId);
        const connection = await (0, index_1.createConnection)(connectionData.host, connectionData.port, connectionData.user, connectionData.password, connectionData.database, connectionData.ssl);
        // Execute the query
        const [rows, fields] = await connection.execute(query, parameters);
        await connection.end();
        const executionTime = Date.now() - startTime;
        // Update last used timestamp
        await (0, index_1.updateLastUsed)(connectionId);
        // Log successful query execution
        await (0, index_1.logQueryExecution)(userId, connectionId, query, "success", undefined, executionTime);
        return {
            success: true,
            results: rows,
            fields: fields ? fields.map((field) => ({
                name: field.name,
                type: field.type,
            })) : [],
            executionTime,
        };
    }
    catch (error) {
        console.error("Error executing query:", error);
        // Log failed query execution
        await (0, index_1.logQueryExecution)(userId, connectionId, query, "error", `${error}`);
        return {
            success: false,
            message: `Query execution failed: ${error.message}`,
        };
    }
});
// Cloud Function to get database schema
exports.getDatabaseSchema = functions.https.onCall(async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const userId = context.auth.uid;
    const { connectionId, forceRefresh = false, page = 1, pageSize = 50 } = data;
    if (!connectionId) {
        throw new functions.https.HttpsError("invalid-argument", "Connection ID is required");
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
        const connectionData = await (0, index_1.getConnection)(userId, connectionId);
        const connection = await (0, index_1.createConnection)(connectionData.host, connectionData.port, connectionData.user, connectionData.password, connectionData.database, connectionData.ssl);
        // Update last used timestamp
        await (0, index_1.updateLastUsed)(connectionId);
        // Get tables with pagination for better performance
        const [tablesCount] = await connection.query("SELECT COUNT(*) as count FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?", [connectionData.database]);
        const totalTables = tablesCount[0].count;
        const totalPages = Math.ceil(totalTables / pageSize);
        const [tables] = await connection.query("SELECT TABLE_NAME, TABLE_TYPE, TABLE_COMMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? LIMIT ? OFFSET ?", [connectionData.database, pageSize, (page - 1) * pageSize]);
        const schema = {};
        // For each table, get columns and indexes
        for (const table of tables) {
            const tableName = table.TABLE_NAME;
            // Get columns
            const [columns] = await connection.query(`SELECT 
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
          ORDINAL_POSITION`, [connectionData.database, tableName]);
            // Get primary key
            const [primaryKeys] = await connection.query(`SELECT 
          COLUMN_NAME
        FROM 
          information_schema.KEY_COLUMN_USAGE
        WHERE 
          TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY'
        ORDER BY 
          ORDINAL_POSITION`, [connectionData.database, tableName]);
            // Get foreign keys
            const [foreignKeys] = await connection.query(`SELECT 
          CONSTRAINT_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM 
          information_schema.KEY_COLUMN_USAGE
        WHERE 
          TABLE_SCHEMA = ? 
          AND TABLE_NAME = ? 
          AND REFERENCED_TABLE_NAME IS NOT NULL`, [connectionData.database, tableName]);
            // Get indexes
            const [indexes] = await connection.query(`SELECT 
          INDEX_NAME,
          COLUMN_NAME,
          NON_UNIQUE,
          INDEX_TYPE
        FROM 
          information_schema.STATISTICS
        WHERE 
          TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY 
          INDEX_NAME, SEQ_IN_INDEX`, [connectionData.database, tableName]);
            // Process indexes to group by name
            const processedIndexes = {};
            for (const index of indexes) {
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
                columns: columns.map((column) => ({
                    name: column.COLUMN_NAME,
                    type: column.DATA_TYPE,
                    nullable: column.IS_NULLABLE === 'YES',
                    defaultValue: column.COLUMN_DEFAULT,
                    comment: column.COLUMN_COMMENT,
                    extra: column.EXTRA,
                    key: column.COLUMN_KEY,
                })),
                primaryKey: primaryKeys.map((pk) => pk.COLUMN_NAME),
                foreignKeys: foreignKeys.map((fk) => ({
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
            const allSchema = Object.assign({}, schema);
            if (totalPages > 1) {
                const connection2 = await (0, index_1.createConnection)(connectionData.host, connectionData.port, connectionData.user, connectionData.password, connectionData.database, connectionData.ssl);
                // Get rest of the tables for caching
                for (let p = 2; p <= totalPages; p++) {
                    const [moreTables] = await connection2.query("SELECT TABLE_NAME, TABLE_TYPE, TABLE_COMMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? LIMIT ? OFFSET ?", [connectionData.database, pageSize, (p - 1) * pageSize]);
                    // Process each table
                    for (const table of moreTables) {
                        const tableName = table.TABLE_NAME;
                        // Get columns
                        const [columns] = await connection2.query(`SELECT 
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
                ORDINAL_POSITION`, [connectionData.database, tableName]);
                        // Get primary key
                        const [primaryKeys] = await connection2.query(`SELECT 
                COLUMN_NAME
              FROM 
                information_schema.KEY_COLUMN_USAGE
              WHERE 
                TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY'
              ORDER BY 
                ORDINAL_POSITION`, [connectionData.database, tableName]);
                        // Get foreign keys
                        const [foreignKeys] = await connection2.query(`SELECT 
                CONSTRAINT_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
              FROM 
                information_schema.KEY_COLUMN_USAGE
              WHERE 
                TABLE_SCHEMA = ? 
                AND TABLE_NAME = ? 
                AND REFERENCED_TABLE_NAME IS NOT NULL`, [connectionData.database, tableName]);
                        // Get indexes
                        const [indexes] = await connection2.query(`SELECT 
                INDEX_NAME,
                COLUMN_NAME,
                NON_UNIQUE,
                INDEX_TYPE
              FROM 
                information_schema.STATISTICS
              WHERE 
                TABLE_SCHEMA = ? AND TABLE_NAME = ?
              ORDER BY 
                INDEX_NAME, SEQ_IN_INDEX`, [connectionData.database, tableName]);
                        // Process indexes to group by name
                        const processedIndexes = {};
                        for (const index of indexes) {
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
                            columns: columns.map((column) => ({
                                name: column.COLUMN_NAME,
                                type: column.DATA_TYPE,
                                nullable: column.IS_NULLABLE === 'YES',
                                defaultValue: column.COLUMN_DEFAULT,
                                comment: column.COLUMN_COMMENT,
                                extra: column.EXTRA,
                                key: column.COLUMN_KEY,
                            })),
                            primaryKey: primaryKeys.map((pk) => pk.COLUMN_NAME),
                            foreignKeys: foreignKeys.map((fk) => ({
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
                    await storeSchemaChanges(userId, connectionId, previousVersion.versionId, versionId, changes);
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
    }
    catch (error) {
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
async function getCachedSchema(userId, connectionId) {
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
            schema: (data === null || data === void 0 ? void 0 : data.schema) || {},
            updatedAt: (data === null || data === void 0 ? void 0 : data.updatedAt) || 0,
            versionId: (data === null || data === void 0 ? void 0 : data.versionId) || '',
        };
    }
    catch (error) {
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
async function cacheSchema(userId, connectionId, schema, timestamp, versionId) {
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
    }
    catch (error) {
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
function paginateSchema(schema, page, pageSize) {
    const tableNames = Object.keys(schema);
    const totalTables = tableNames.length;
    const totalPages = Math.ceil(totalTables / pageSize);
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, totalTables);
    const paginatedSchema = {};
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
function detectSchemaChanges(oldSchema, newSchema) {
    const changes = {
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
        const tableChanges = {
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
        const oldColumnNames = oldTable.columns.map((col) => col.name);
        const newColumnNames = newTable.columns.map((col) => col.name);
        tableChanges.addedColumns = newColumnNames.filter(name => !oldColumnNames.includes(name));
        tableChanges.removedColumns = oldColumnNames.filter(name => !newColumnNames.includes(name));
        // Check modified columns
        const commonColumns = oldColumnNames.filter(name => newColumnNames.includes(name));
        for (const colName of commonColumns) {
            const oldCol = oldTable.columns.find((col) => col.name === colName);
            const newCol = newTable.columns.find((col) => col.name === colName);
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
        const oldIndexNames = oldTable.indexes ? oldTable.indexes.map((idx) => idx.name) : [];
        const newIndexNames = newTable.indexes ? newTable.indexes.map((idx) => idx.name) : [];
        tableChanges.addedIndexes = newIndexNames.filter(name => !oldIndexNames.includes(name));
        tableChanges.removedIndexes = oldIndexNames.filter(name => !newIndexNames.includes(name));
        // Check modified indexes
        const commonIndexes = oldIndexNames.filter(name => newIndexNames.includes(name));
        for (const idxName of commonIndexes) {
            const oldIdx = oldTable.indexes.find((idx) => idx.name === idxName);
            const newIdx = newTable.indexes.find((idx) => idx.name === idxName);
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
        const oldFkNames = oldTable.foreignKeys ? oldTable.foreignKeys.map((fk) => fk.name) : [];
        const newFkNames = newTable.foreignKeys ? newTable.foreignKeys.map((fk) => fk.name) : [];
        tableChanges.addedForeignKeys = newFkNames.filter(name => !oldFkNames.includes(name));
        tableChanges.removedForeignKeys = oldFkNames.filter(name => !newFkNames.includes(name));
        // Check modified foreign keys
        const commonForeignKeys = oldFkNames.filter(name => newFkNames.includes(name));
        for (const fkName of commonForeignKeys) {
            const oldFk = oldTable.foreignKeys.find((fk) => fk.name === fkName);
            const newFk = newTable.foreignKeys.find((fk) => fk.name === fkName);
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
async function storeSchemaChanges(userId, connectionId, oldVersionId, newVersionId, changes) {
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
    }
    catch (error) {
        console.error('Error storing schema changes:', error);
        throw error;
    }
}
/**
 * Get schema versions for a connection
 */
exports.getSchemaVersions = functions.https.onCall(async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const userId = context.auth.uid;
    const { connectionId, limit = 10 } = data;
    if (!connectionId) {
        throw new functions.https.HttpsError("invalid-argument", "Connection ID is required");
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
    }
    catch (error) {
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
exports.getSchemaChanges = functions.https.onCall(async (data, context) => {
    var _a, _b, _c, _d;
    // Ensure the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const userId = context.auth.uid;
    const { connectionId, oldVersionId, newVersionId } = data;
    if (!connectionId || !oldVersionId || !newVersionId) {
        throw new functions.https.HttpsError("invalid-argument", "Connection ID, old version ID, and new version ID are required");
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
                changes: ((_a = changesDoc.data()) === null || _a === void 0 ? void 0 : _a.changes) || {},
                createdAt: (_b = changesDoc.data()) === null || _b === void 0 ? void 0 : _b.createdAt,
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
            throw new functions.https.HttpsError("not-found", "One or both schema versions not found");
        }
        const oldSchema = ((_c = oldVersionDoc.data()) === null || _c === void 0 ? void 0 : _c.schema) || {};
        const newSchema = ((_d = newVersionDoc.data()) === null || _d === void 0 ? void 0 : _d.schema) || {};
        const changes = detectSchemaChanges(oldSchema, newSchema);
        // Store changes for future use
        await storeSchemaChanges(userId, connectionId, oldVersionId, newVersionId, changes);
        return {
            success: true,
            changes,
            createdAt: Date.now(),
        };
    }
    catch (error) {
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
exports.getSchemaVersion = functions.https.onCall(async (data, context) => {
    var _a, _b;
    // Ensure the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const userId = context.auth.uid;
    const { connectionId, versionId, page = 1, pageSize = 50 } = data;
    if (!connectionId || !versionId) {
        throw new functions.https.HttpsError("invalid-argument", "Connection ID and version ID are required");
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
            throw new functions.https.HttpsError("not-found", "Schema version not found");
        }
        const schema = ((_a = versionDoc.data()) === null || _a === void 0 ? void 0 : _a.schema) || {};
        const createdAt = (_b = versionDoc.data()) === null || _b === void 0 ? void 0 : _b.createdAt;
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
    }
    catch (error) {
        console.error("Error retrieving schema version:", error);
        return {
            success: false,
            message: `Failed to retrieve schema version: ${error.message}`,
        };
    }
});
//# sourceMappingURL=functions.js.map