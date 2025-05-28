import {
  getDatabaseSchema,
  getSchemaVersions,
  getSchemaChanges,
  getSchemaVersion
} from '../firebase/functions.real';

/**
 * Retrieve database schema
 * @param connectionId 
 * @param forceRefresh 
 * @param page 
 * @param pageSize 
 * @returns 
 */
export const fetchDatabaseSchema = async (
  connectionId: string, 
  forceRefresh = false,
  page = 1,
  pageSize = 50
) => {
  try {
    const result = await getDatabaseSchema(connectionId, forceRefresh, page, pageSize);
    return result.data as {
      success: boolean;
      schema: Record<string, any>;
      fromCache: boolean;
      updatedAt: number;
      versionId: string;
      pagination: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalTables: number;
      };
      message?: string;
    };
  } catch (error) {
    console.error('Error fetching database schema:', error);
    return {
      success: false,
      schema: {},
      fromCache: false,
      updatedAt: 0,
      versionId: '',
      pagination: {
        page: 1,
        pageSize: 50,
        totalPages: 0,
        totalTables: 0,
      },
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get schema versions for a connection
 * @param connectionId 
 * @param limit 
 * @returns 
 */
export const fetchSchemaVersions = async (
  connectionId: string,
  limit = 10
) => {
  try {
    const result = await getSchemaVersions(connectionId, limit);
    return result.data as {
      success: boolean;
      versions: {
        versionId: string;
        createdAt: number;
      }[];
      message?: string;
    };
  } catch (error) {
    console.error('Error fetching schema versions:', error);
    return {
      success: false,
      versions: [],
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get specific schema version
 * @param connectionId 
 * @param versionId 
 * @param page 
 * @param pageSize 
 * @returns 
 */
export const fetchSchemaVersion = async (
  connectionId: string,
  versionId: string,
  page = 1,
  pageSize = 50
) => {
  try {
    const result = await getSchemaVersion(connectionId, versionId, page, pageSize);
    return result.data as {
      success: boolean;
      schema: Record<string, any>;
      createdAt: number;
      versionId: string;
      pagination: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalTables: number;
      };
      message?: string;
    };
  } catch (error) {
    console.error('Error fetching schema version:', error);
    return {
      success: false,
      schema: {},
      createdAt: 0,
      versionId: '',
      pagination: {
        page: 1,
        pageSize: 50,
        totalPages: 0,
        totalTables: 0,
      },
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get schema changes between two versions
 * @param connectionId 
 * @param oldVersionId 
 * @param newVersionId 
 * @returns 
 */
export const fetchSchemaChanges = async (
  connectionId: string,
  oldVersionId: string,
  newVersionId: string
) => {
  try {
    const result = await getSchemaChanges(connectionId, oldVersionId, newVersionId);
    return result.data as {
      success: boolean;
      changes: {
        addedTables: string[];
        removedTables: string[];
        modifiedTables: Record<string, any>;
      };
      createdAt: number;
      message?: string;
    };
  } catch (error) {
    console.error('Error fetching schema changes:', error);
    return {
      success: false,
      changes: {
        addedTables: [],
        removedTables: [],
        modifiedTables: {},
      },
      createdAt: 0,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Refresh database schema (force update from database)
 * @param connectionId 
 * @returns 
 */
export const refreshDatabaseSchema = async (
  connectionId: string
) => {
  try {
    return await fetchDatabaseSchema(connectionId, true);
  } catch (error) {
    console.error('Error refreshing database schema:', error);
    return {
      success: false,
      schema: {},
      fromCache: false,
      updatedAt: 0,
      versionId: '',
      pagination: {
        page: 1,
        pageSize: 50,
        totalPages: 0,
        totalTables: 0,
      },
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
