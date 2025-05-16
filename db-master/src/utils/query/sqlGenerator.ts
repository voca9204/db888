import { QueryState, QueryColumn, QueryCondition, QueryJoin, QueryGroup, QueryOrder } from '../../types/store';

/**
 * Generates a SQL query string from the QueryState object
 * @param queryState The current query state
 * @returns A valid SQL query string
 */
export const generateSqlQuery = (queryState: QueryState): string => {
  if (!queryState.selectedTable) {
    return '';
  }
  
  // Start building the SQL query parts
  const parts: string[] = [];
  
  // SELECT clause
  parts.push(generateSelectClause(queryState));
  
  // FROM clause
  parts.push(generateFromClause(queryState));
  
  // JOIN clauses
  const joinClauses = generateJoinClauses(queryState);
  if (joinClauses) {
    parts.push(joinClauses);
  }
  
  // WHERE clause
  const whereClause = generateWhereClause(queryState);
  if (whereClause) {
    parts.push(whereClause);
  }
  
  // GROUP BY clause
  const groupByClause = generateGroupByClause(queryState);
  if (groupByClause) {
    parts.push(groupByClause);
  }
  
  // HAVING clause
  const havingClause = generateHavingClause(queryState);
  if (havingClause) {
    parts.push(havingClause);
  }
  
  // ORDER BY clause
  const orderByClause = generateOrderByClause(queryState);
  if (orderByClause) {
    parts.push(orderByClause);
  }
  
  // LIMIT and OFFSET clauses
  const limitOffsetClause = generateLimitOffsetClause(queryState);
  if (limitOffsetClause) {
    parts.push(limitOffsetClause);
  }
  
  return parts.join('\n');
};

/**
 * Generates the SELECT clause of the SQL query
 */
const generateSelectClause = (queryState: QueryState): string => {
  const selectClause = queryState.columns.length > 0
    ? queryState.columns.map((col: QueryColumn) => {
        let columnPart = `\`${col.table || queryState.selectedTable}\`.\`${col.column}\``;
        
        // Add aggregate function if specified
        if (col.aggregate) {
          columnPart = `${col.aggregate}(${columnPart})`;
        }
        
        // Add alias if specified
        if (col.alias) {
          columnPart = `${columnPart} AS \`${col.alias}\``;
        }
        
        return columnPart;
      }).join(', ')
    : `\`${queryState.selectedTable}\`.*`;
  
  return `SELECT ${queryState.distinct ? 'DISTINCT ' : ''}${selectClause}`;
};

/**
 * Generates the FROM clause of the SQL query
 */
const generateFromClause = (queryState: QueryState): string => {
  return `FROM \`${queryState.selectedTable}\``;
};

/**
 * Generates the JOIN clauses of the SQL query
 */
const generateJoinClauses = (queryState: QueryState): string | null => {
  if (!queryState.joins || queryState.joins.length === 0) {
    return null;
  }
  
  return queryState.joins.map((join: QueryJoin) => {
    const joinType = join.type;
    const rightTable = join.alias 
      ? `\`${join.table}\` AS \`${join.alias}\`` 
      : `\`${join.table}\``;
      
    const leftColumn = `\`${join.on.leftTable}\`.\`${join.on.leftColumn}\``;
    const rightColumn = `\`${join.on.rightTable}\`.\`${join.on.rightColumn}\``;
    
    return `${joinType} JOIN ${rightTable} ON ${leftColumn} = ${rightColumn}`;
  }).join('\n');
};

/**
 * Generates the WHERE clause of the SQL query
 */
const generateWhereClause = (queryState: QueryState): string | null => {
  if (!queryState.conditions || queryState.conditions.length === 0) {
    return null;
  }
  
  const whereClauses = queryState.conditions.map((cond: QueryCondition, index: number) => {
    // Build the condition based on the operator
    let conditionPart = '';
    const columnRef = `\`${cond.table || queryState.selectedTable}\`.\`${cond.column}\``;
    
    switch (cond.operator) {
      case 'IS NULL':
        conditionPart = `${columnRef} IS NULL`;
        break;
      case 'IS NOT NULL':
        conditionPart = `${columnRef} IS NOT NULL`;
        break;
      case 'BETWEEN':
        conditionPart = `${columnRef} BETWEEN ${formatValue(cond.value)} AND ${formatValue(cond.valueEnd)}`;
        break;
      case 'IN':
      case 'NOT IN':
        // Assume value is comma separated
        const values = String(cond.value || '')
          .split(',')
          .map(v => formatValue(v.trim()))
          .join(', ');
          
        conditionPart = `${columnRef} ${cond.operator} (${values})`;
        break;
      case 'LIKE':
      case 'NOT LIKE':
        // Ensure value has wildcards if it doesn't already
        let likeValue = String(cond.value || '');
        if (!likeValue.includes('%') && !likeValue.includes('_')) {
          likeValue = `%${likeValue}%`;
        }
        conditionPart = `${columnRef} ${cond.operator} ${formatValue(likeValue)}`;
        break;
      default:
        conditionPart = `${columnRef} ${cond.operator} ${formatValue(cond.value)}`;
    }
    
    // Add AND/OR for all but the first condition
    return index === 0 ? conditionPart : `AND ${conditionPart}`;
  }).join(' ');
  
  return `WHERE ${whereClauses}`;
};

/**
 * Generates the GROUP BY clause of the SQL query
 */
const generateGroupByClause = (queryState: QueryState): string | null => {
  if (!queryState.groupBy || queryState.groupBy.length === 0) {
    return null;
  }
  
  const groupByColumns = queryState.groupBy.map((group: QueryGroup) => 
    `\`${group.table || queryState.selectedTable}\`.\`${group.column}\``
  ).join(', ');
  
  return `GROUP BY ${groupByColumns}`;
};

/**
 * Generates the HAVING clause of the SQL query
 */
const generateHavingClause = (queryState: QueryState): string | null => {
  if (!queryState.having || queryState.having.length === 0) {
    return null;
  }
  
  const havingClauses = queryState.having.map((cond: QueryCondition, index: number) => {
    // Build the condition based on the operator
    let conditionPart = '';
    let columnRef = `\`${cond.column}\``;
    
    // If column has an aggregate function, wrap it
    if (cond.aggregate) {
      columnRef = `${cond.aggregate}(${columnRef})`;
    }
    
    switch (cond.operator) {
      case 'IS NULL':
        conditionPart = `${columnRef} IS NULL`;
        break;
      case 'IS NOT NULL':
        conditionPart = `${columnRef} IS NOT NULL`;
        break;
      case 'BETWEEN':
        conditionPart = `${columnRef} BETWEEN ${formatValue(cond.value)} AND ${formatValue(cond.valueEnd)}`;
        break;
      case 'IN':
      case 'NOT IN':
        // Assume value is comma separated
        const values = String(cond.value || '')
          .split(',')
          .map(v => formatValue(v.trim()))
          .join(', ');
          
        conditionPart = `${columnRef} ${cond.operator} (${values})`;
        break;
      default:
        conditionPart = `${columnRef} ${cond.operator} ${formatValue(cond.value)}`;
    }
    
    // Add AND/OR for all but the first condition
    return index === 0 ? conditionPart : `AND ${conditionPart}`;
  }).join(' ');
  
  return `HAVING ${havingClauses}`;
};

/**
 * Generates the ORDER BY clause of the SQL query
 */
const generateOrderByClause = (queryState: QueryState): string | null => {
  if (!queryState.orderBy || queryState.orderBy.length === 0) {
    return null;
  }
  
  const orderByColumns = queryState.orderBy.map((order: QueryOrder) => 
    `\`${order.table || queryState.selectedTable}\`.\`${order.column}\` ${order.direction}`
  ).join(', ');
  
  return `ORDER BY ${orderByColumns}`;
};

/**
 * Generates the LIMIT and OFFSET clauses of the SQL query
 */
const generateLimitOffsetClause = (queryState: QueryState): string | null => {
  if (!queryState.limit) {
    return null;
  }
  
  let clause = `LIMIT ${queryState.limit}`;
  
  if (queryState.offset) {
    clause += `\nOFFSET ${queryState.offset}`;
  }
  
  return clause;
};

/**
 * Formats a value based on its type for use in SQL queries
 * @param value The value to format
 * @returns Formatted value as a string
 */
export const formatValue = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return 'NULL';
  }
  
  // Try to parse as number
  const numValue = Number(value);
  if (!isNaN(numValue) && String(numValue) === String(value)) {
    return String(numValue);
  }
  
  // Check for boolean values
  if (value === 'true' || value === 'false') {
    return value === 'true' ? '1' : '0';
  }
  
  // Handle date objects
  if (value instanceof Date) {
    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }
  
  // Otherwise, treat as string
  return `'${String(value).replace(/'/g, "''")}'`;
};

/**
 * Validates a SQL query for basic syntax errors
 * @param sql The SQL query to validate
 * @returns An object with validation result and error message if any
 */
export const validateSqlQuery = (sql: string): { isValid: boolean; error?: string } => {
  if (!sql.trim()) {
    return { isValid: false, error: 'Query is empty' };
  }
  
  // Basic validation for select statement
  if (!sql.trim().toLowerCase().startsWith('select')) {
    return { isValid: false, error: 'Query must start with SELECT' };
  }
  
  // Check for FROM clause
  if (!sql.toLowerCase().includes('from')) {
    return { isValid: false, error: 'Query must contain FROM clause' };
  }
  
  // More advanced validation could be added here
  
  return { isValid: true };
};
