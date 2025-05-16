import BaseApi from './base';

/**
 * Types for SchemaApi
 */
export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  primary: boolean;
  defaultValue: string | null;
  key: string;
  extra: string;
  comment: string;
}

export interface ForeignKey {
  constraintName: string;
  column: string;
  referenceTable: string;
  referenceColumn: string;
  onUpdate: string;
  onDelete: string;
}

export interface TableIndex {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface Table {
  name: string;
  type: string;
  engine: string;
  comment: string;
  columns: SchemaColumn[];
  foreignKeys: ForeignKey[];
  indexes: TableIndex[];
}

export interface SchemaData {
  tables: Record<string, Table>;
}

export interface SchemaResult {
  schema: SchemaData;
  updatedAt: number;
  versionId: string;
  fromCache: boolean;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalTables: number;
  };
  success: boolean;
  message?: string;
}

export interface SchemaVersion {
  versionId: string;
  createdAt: number;
}

export interface SchemaVersionsResult {
  versions: SchemaVersion[];
  success: boolean;
  message?: string;
}

export interface SchemaChangesResult {
  changes: {
    addedTables: string[];
    removedTables: string[];
    modifiedTables: Record<string, any>;
  };
  createdAt: number;
  success: boolean;
  message?: string;
}

export interface SchemaVersionResult extends SchemaResult {
  createdAt: number;
  versionId: string;
}

/**
 * API for database schema operations
 */
class SchemaApi extends BaseApi {
  /**
   * Get database schema for a connection
   * 
   * @param connectionId - ID of the connection
   * @param refresh - Whether to force a refresh or use cache
   * @param page - Page number for pagination
   * @param pageSize - Page size for pagination
   * @returns Promise with schema data
   */
  async getSchema(
    connectionId: string,
    refresh: boolean = false,
    page: number = 1,
    pageSize: number = 50
  ): Promise<SchemaResult> {
    return this.callFunction<
      { connectionId: string; refresh: boolean; page: number; pageSize: number },
      SchemaResult
    >('getSchema', { connectionId, refresh, page, pageSize });
  }
  
  /**
   * Get schema versions for a connection
   * 
   * @param connectionId - ID of the connection
   * @param limit - Maximum number of versions to retrieve
   * @returns Promise with schema versions
   */
  async getSchemaVersions(
    connectionId: string,
    limit: number = 10
  ): Promise<SchemaVersionsResult> {
    return this.callFunction<
      { connectionId: string; limit: number },
      SchemaVersionsResult
    >('getSchemaVersions', { connectionId, limit });
  }
  
  /**
   * Get schema changes between two versions
   * 
   * @param connectionId - ID of the connection
   * @param fromVersionId - Starting version ID
   * @param toVersionId - Ending version ID
   * @returns Promise with schema changes
   */
  async getSchemaChanges(
    connectionId: string,
    fromVersionId: string,
    toVersionId: string
  ): Promise<SchemaChangesResult> {
    return this.callFunction<
      { connectionId: string; fromVersionId: string; toVersionId: string },
      SchemaChangesResult
    >('getSchemaChanges', { connectionId, fromVersionId, toVersionId });
  }
  
  /**
   * Get a specific schema version
   * 
   * @param connectionId - ID of the connection
   * @param versionId - Version ID to retrieve
   * @param page - Page number for pagination
   * @param pageSize - Page size for pagination
   * @returns Promise with schema version data
   */
  async getSchemaVersion(
    connectionId: string,
    versionId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<SchemaVersionResult> {
    return this.callFunction<
      { connectionId: string; versionId: string; page: number; pageSize: number },
      SchemaVersionResult
    >('getSchemaVersion', { connectionId, versionId, page, pageSize });
  }
}

export default new SchemaApi();
