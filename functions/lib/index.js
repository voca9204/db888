"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationSummary = exports.cleanupScheduledQueryExecutions = exports.manualExecuteScheduledQuery = exports.executeScheduledQuery = exports.deleteTableRow = exports.insertTableRow = exports.updateTableRow = exports.getTableData = exports.getSchemaVersion = exports.getSchemaChanges = exports.getSchemaVersions = exports.deleteDbConnection = exports.getDbConnections = exports.saveDbConnection = exports.getDatabaseSchema = exports.executeQuery = exports.testConnection = exports.createUserProfile = void 0;
const admin = require("firebase-admin");
admin.initializeApp();
// Setup database connection utilities
require("./database");
// Import all function modules
const authFunctions = require("./auth");
const databaseFunctions = require("./database/functions");
const schedulingFunctions = require("./scheduling/functions");
const notificationFunctions = require("./scheduling/notifications");
const tableFunctions = require("./database/table-functions");
// Auth functions
exports.createUserProfile = authFunctions.createUserProfile;
// Database functions
exports.testConnection = databaseFunctions.testConnection;
exports.executeQuery = databaseFunctions.executeQuery;
exports.getDatabaseSchema = databaseFunctions.getDatabaseSchema;
exports.saveDbConnection = databaseFunctions.saveDbConnection;
exports.getDbConnections = databaseFunctions.getDbConnections;
exports.deleteDbConnection = databaseFunctions.deleteDbConnection;
exports.getSchemaVersions = databaseFunctions.getSchemaVersions;
exports.getSchemaChanges = databaseFunctions.getSchemaChanges;
exports.getSchemaVersion = databaseFunctions.getSchemaVersion;
// Table functions
exports.getTableData = tableFunctions.getTableData;
exports.updateTableRow = tableFunctions.updateTableRow;
exports.insertTableRow = tableFunctions.insertTableRow;
exports.deleteTableRow = tableFunctions.deleteTableRow;
// Scheduling and notification functions
exports.executeScheduledQuery = schedulingFunctions.executeScheduledQuery;
exports.manualExecuteScheduledQuery = schedulingFunctions.manualExecuteScheduledQuery;
exports.cleanupScheduledQueryExecutions = schedulingFunctions.cleanupScheduledQueryExecutions;
exports.sendNotificationSummary = notificationFunctions.sendNotificationSummary;
//# sourceMappingURL=index.js.map