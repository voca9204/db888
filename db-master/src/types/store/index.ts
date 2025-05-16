// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

// Font size types
export type FontSize = 'small' | 'medium' | 'large';

// Code editor theme
export type CodeEditorTheme = 'light' | 'dark' | 'dracula' | 'github' | 'monokai';

// Layout types
export type LayoutMode = 'default' | 'compact' | 'comfortable';

// User preferences
export interface UserPreferences {
  theme: ThemeMode;
  defaultRowsPerPage: number;
  dateFormat: string;
  timeFormat: string;
  showSchemaDetails: boolean;
  language: string;
  notifications: {
    email: boolean;
    inApp: boolean;
    queryResults: boolean;
    scheduled: boolean;
    activitySummary: boolean;
  };
  display: {
    fontSize: FontSize;
    codeEditorTheme: CodeEditorTheme;
    tableLayout: LayoutMode;
    enableAnimations: boolean;
    highContrastMode: boolean;
    autosaveInterval: number; // in minutes, 0 = disabled
  };
  queryEditor: {
    autoComplete: boolean;
    autoFormat: boolean;
    highlightSyntax: boolean;
    indentSize: number;
    wordWrap: boolean;
    showLineNumbers: boolean;
  };
  shortcuts: {
    [key: string]: string;
  };
}

// Database connection types
export interface DbConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string; // Only available for unsaved connections, saved connections store this securely
  ssl: boolean;
  createdAt: number;
  updatedAt: number;
  lastUsed?: number;
  userId: string;
  isActive?: boolean;
}

// Schema types
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

// Query builder types
export type Operator = 
  | '=' | '!=' | '>' | '>=' | '<' | '<=' 
  | 'LIKE' | 'NOT LIKE' | 'IN' | 'NOT IN' 
  | 'BETWEEN' | 'IS NULL' | 'IS NOT NULL';

export type LogicalOperator = 'AND' | 'OR';

export interface QueryCondition {
  id: string;
  table: string;
  column: string;
  operator: Operator;
  value: any;
  valueEnd?: any; // Used for BETWEEN operator
}

export interface QueryJoin {
  id: string;
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  table: string;
  alias?: string;
  on: {
    leftTable: string;
    leftColumn: string;
    rightTable: string;
    rightColumn: string;
  };
}

export interface QueryColumn {
  id: string;
  table: string;
  column: string;
  alias?: string;
  aggregate?: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
  distinct?: boolean;
}

export interface QueryGroup {
  id: string;
  table: string;
  column: string;
}

export interface QueryOrder {
  id: string;
  table: string;
  column: string;
  direction: 'ASC' | 'DESC';
}

export interface QueryState {
  selectedTable: string;
  columns: QueryColumn[];
  joins: QueryJoin[];
  conditions: QueryCondition[];
  groupBy: QueryGroup[];
  having: QueryCondition[];
  orderBy: QueryOrder[];
  limit?: number;
  offset?: number;
  distinct: boolean;
  conditionTree?: any; // TODO: Implement complex condition tree structure
}

// Query results
export interface QueryResult {
  id: string;
  sql: string;
  parameters?: any[];
  columns: { name: string; type: string }[];
  rows: any[];
  rowCount: number;
  executionTime: number;
  timestamp: number;
  error?: string;
}

// Query template
export interface QueryTemplate {
  id: string;
  name: string;
  description?: string;
  sql: string;
  parameters?: QueryTemplateParameter[];
  tags?: string[];
  isPublic: boolean;
  userId: string;
  createdAt: number;
  updatedAt: number;
  queryState?: QueryState;
}

export interface QueryTemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  defaultValue?: any;
  description?: string;
  required: boolean;
}
