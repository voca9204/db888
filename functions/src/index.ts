import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Setup database connection utilities
import "./database";

// Import all function modules
import * as authFunctions from "./auth";
import * as databaseFunctions from "./database/functions";
import * as schedulingFunctions from "./scheduling/functions";
import * as notificationFunctions from "./scheduling/notifications";
import * as tableFunctions from "./database/table-functions";

// Auth functions
export const createUserProfile = authFunctions.createUserProfile;

// Database functions
export const testConnection = databaseFunctions.testConnection;
export const executeQuery = databaseFunctions.executeQuery;
export const getDatabaseSchema = databaseFunctions.getDatabaseSchema;
export const saveDbConnection = databaseFunctions.saveDbConnection;
export const getDbConnections = databaseFunctions.getDbConnections;
export const deleteDbConnection = databaseFunctions.deleteDbConnection;
export const getSchemaVersions = databaseFunctions.getSchemaVersions;
export const getSchemaChanges = databaseFunctions.getSchemaChanges;
export const getSchemaVersion = databaseFunctions.getSchemaVersion;

// Table functions
export const getTableData = tableFunctions.getTableData;
export const updateTableRow = tableFunctions.updateTableRow;
export const insertTableRow = tableFunctions.insertTableRow;
export const deleteTableRow = tableFunctions.deleteTableRow;

// Scheduling and notification functions
export const executeScheduledQuery = schedulingFunctions.executeScheduledQuery;
export const manualExecuteScheduledQuery = schedulingFunctions.manualExecuteScheduledQuery;
export const cleanupScheduledQueryExecutions = schedulingFunctions.cleanupScheduledQueryExecutions;
export const sendNotificationSummary = notificationFunctions.sendNotificationSummary;
