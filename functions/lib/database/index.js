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
exports.executeQueryInTransaction = exports.executeQuery = exports.closeAllPools = exports.closeConnection = exports.createConnectionPool = exports.createConnection = exports.logQueryExecution = exports.getAllConnections = exports.updateLastUsed = exports.deleteConnection = exports.saveConnection = exports.getConnection = void 0;
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const encryption_1 = require("../utils/encryption");
const mariadb_1 = require("./mariadb");
Object.defineProperty(exports, "createConnection", { enumerable: true, get: function () { return mariadb_1.createConnection; } });
Object.defineProperty(exports, "createConnectionPool", { enumerable: true, get: function () { return mariadb_1.createConnectionPool; } });
Object.defineProperty(exports, "closeConnection", { enumerable: true, get: function () { return mariadb_1.closeConnection; } });
Object.defineProperty(exports, "closeAllPools", { enumerable: true, get: function () { return mariadb_1.closeAllPools; } });
Object.defineProperty(exports, "executeQuery", { enumerable: true, get: function () { return mariadb_1.executeQuery; } });
Object.defineProperty(exports, "executeQueryInTransaction", { enumerable: true, get: function () { return mariadb_1.executeQueryInTransaction; } });
/**
 * Get a connection by ID from Firestore
 *
 * @param userId User ID
 * @param connectionId Connection ID
 * @returns Connection configuration
 */
const getConnection = async (userId, connectionId) => {
    const connectionRef = admin.firestore()
        .collection("connections")
        .doc(connectionId);
    const connectionDoc = await connectionRef.get();
    if (!connectionDoc.exists) {
        throw new Error("Connection not found");
    }
    const connectionData = connectionDoc.data();
    // Ensure the connection belongs to the user
    if ((connectionData === null || connectionData === void 0 ? void 0 : connectionData.userId) !== userId) {
        throw new Error("Unauthorized access to connection");
    }
    // Decrypt password if it exists
    if (connectionData.password) {
        try {
            connectionData.password = (0, encryption_1.decrypt)(connectionData.password);
        }
        catch (error) {
            console.error("Error decrypting password:", error);
            throw new Error("Failed to decrypt connection credentials");
        }
    }
    return connectionData;
};
exports.getConnection = getConnection;
/**
 * Save a connection to Firestore
 *
 * @param connectionData Connection configuration
 * @returns Connection ID
 */
const saveConnection = async (connectionData) => {
    try {
        const connectionRef = connectionData.id
            ? admin.firestore().collection("connections").doc(connectionData.id)
            : admin.firestore().collection("connections").doc();
        const id = connectionRef.id;
        const now = Date.now();
        await connectionRef.set(Object.assign(Object.assign({}, connectionData), { id, updatedAt: now, createdAt: connectionData.createdAt || now }));
        return id;
    }
    catch (error) {
        console.error("Error saving connection:", error);
        throw new Error(`Failed to save connection: ${error.message}`);
    }
};
exports.saveConnection = saveConnection;
/**
 * Delete a connection from Firestore
 *
 * @param userId User ID
 * @param connectionId Connection ID
 */
const deleteConnection = async (userId, connectionId) => {
    const connectionRef = admin.firestore()
        .collection("connections")
        .doc(connectionId);
    const connectionDoc = await connectionRef.get();
    if (!connectionDoc.exists) {
        throw new Error("Connection not found");
    }
    const connectionData = connectionDoc.data();
    // Ensure the connection belongs to the user
    if ((connectionData === null || connectionData === void 0 ? void 0 : connectionData.userId) !== userId) {
        throw new Error("Unauthorized access to connection");
    }
    await connectionRef.delete();
};
exports.deleteConnection = deleteConnection;
/**
 * Update last used timestamp for a connection
 *
 * @param connectionId Connection ID
 */
const updateLastUsed = async (connectionId) => {
    try {
        await admin.firestore()
            .collection("connections")
            .doc(connectionId)
            .update({
            lastUsed: Date.now(),
        });
    }
    catch (error) {
        console.error("Error updating last used timestamp:", error);
        // Non-critical error, no need to throw
    }
};
exports.updateLastUsed = updateLastUsed;
/**
 * Get all connections for a user
 *
 * @param userId User ID
 * @param query Optional Firestore query for filtering/sorting
 * @returns List of connection configurations
 */
const getAllConnections = async (userId, query) => {
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
            const data = doc.data();
            // Don't include the password in the response
            const { password } = data, rest = __rest(data, ["password"]);
            return rest;
        });
    }
    catch (error) {
        console.error("Error getting connections:", error);
        throw new Error(`Failed to retrieve connections: ${error.message}`);
    }
};
exports.getAllConnections = getAllConnections;
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
const logQueryExecution = async (userId, connectionId, query, status, error, executionTimeMs) => {
    await admin.firestore().collection("queryLogs").add({
        userId,
        connectionId,
        query,
        status,
        error,
        executionTimeMs,
        timestamp: firestore_1.Timestamp.now(),
    });
};
exports.logQueryExecution = logQueryExecution;
//# sourceMappingURL=index.js.map