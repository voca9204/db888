import * as functions from "firebase-functions";

// Mock database connection test function
export const mockTestConnection = functions.https.onCall(async (data, context) => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Always return success for testing purposes
  return { 
    success: true, 
    message: "Mock connection successful (테스트 모드)", 
    executionTime: 450,
    details: {
      host: data.host || "localhost",
      port: data.port || 3306,
      database: data.database || "test_db",
      user: data.user || "test_user",
      ssl: data.ssl || false,
      serverInfo: {
        version: "10.6.12-MariaDB-1:10.6.12+maria~ubu2004",
        database: data.database || "test_db",
        user: `${data.user || "test_user"}@%`
      },
      permissions: [
        { 
          "Host": "%", 
          "User": data.user || "test_user", 
          "Grant": "GRANT ALL PRIVILEGES ON *.* TO `test_user`@`%`" 
        }
      ],
      schemaInfo: {
        table_count: 15
      },
    }
  };
});

// Export the mock functions
export default {
  mockTestConnection
};