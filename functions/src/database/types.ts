// Types for database connections
export interface ConnectionConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  createdAt: number;
  updatedAt: number;
  lastUsed?: number;
  userId: string;
  // Additional optional fields
  tags?: string[];
  description?: string;
  color?: string;
  icon?: string;
  timeout?: number;
  connectionLimit?: number;
  readonly?: boolean;
  favorite?: boolean;
}

// Database schema types
export interface DbTable {
  name: string;
  schema: string;
  type: string;
  columns: DbColumn[];
  primaryKey?: string[];
  foreignKeys?: DbForeignKey[];
  indexes?: DbIndex[];
  comment?: string;
}

export interface DbColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  comment?: string;
  extra?: string;
}

export interface DbForeignKey {
  name: string;
  column: string;
  referenceTable: string;
  referenceColumn: string;
  onUpdate: string;
  onDelete: string;
}

export interface DbIndex {
  name: string;
  columns: string[];
  unique: boolean;
  type: string;
}

// Query execution types
export interface QueryResult {
  rows: any[];
  fields: any[];
  executionTime: number;
}

export interface QueryExecutionLog {
  userId: string;
  connectionId: string;
  query: string;
  status: 'success' | 'error';
  error?: string;
  executionTimeMs?: number;
  timestamp: Date;
}
