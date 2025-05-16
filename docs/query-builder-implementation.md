# Query Builder Implementation

## Overview
The Query Builder is a tool that helps users create SQL queries through a visual interface. Key features include:

1. Table and column selection
2. Condition setting and filtering
3. SQL query preview and editing
4. Query execution and results display

## Component Structure

### 1. Query Builder Page (`QueryBuilder.tsx`)
- Main page component
- Tab switching between query builder and results screen
- Example query provision
- Query execution logic (currently using dummy data)

### 2. Core Components
- `QueryBuilder`: Overall query builder UI wrapper
- `TableSelector`: Table selection component
- `ColumnSelector`: Column selection component (supports aggregate functions and aliases)
- `ConditionBuilder`: Condition creation component
- `SqlPreview`: SQL preview and editing component
- `QueryResults`: Query execution results display component

### 3. Utilities
- `sqlGenerator.ts`: SQL query generation logic
- `fieldValidation.ts`: Field validation logic

## Implementation Details

### TableSelector
```tsx
// Table selection dropdown
<Select
  id="tableSelect"
  label="Select Table"
  value={queryState.selectedTable || ''}
  onChange={handleTableChange}
  disabled={availableTables.length === 0}
>
  <option value="" disabled>
    {availableTables.length === 0 ? 'No tables available' : 'Select a table'}
  </option>
  {availableTables.map((table) => (
    <option key={table} value={table}>
      {table}
    </option>
  ))}
</Select>
```

### ColumnSelector
- Display all available columns
- Add/remove columns with a single click
- Select/deselect all columns at once
- Support for aggregate functions (COUNT, SUM, AVG, MIN, MAX)
- Column alias designation
- Aggregate function filtering according to column type

### ConditionBuilder
- Operator filtering according to column type (=, !=, >, <, LIKE, etc.)
- Support for complex conditions such as BETWEEN, IN, NOT IN
- Input fields appropriate for field types (numeric, date, text, etc.)
- Input validation and error display
- AND/OR operator support (currently fixed to AND)

### SqlPreview
- Display automatically generated SQL query
- Direct SQL editing capability
- Syntax highlighting (currently only basic functionality)
- Query saving and exporting
- Query execution functionality

### QueryResults
- Display query results table
- Sorting and filtering
- Pagination
- CSV export
- Column visibility settings

## State Management
Query builder state is managed through Zustand store:

```tsx
// Query state interface
interface QueryState {
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
}
```

## Field Validation
- Validation rules by field type (numeric, date, string, boolean, enumeration)
- Required field checking
- Length limit checking
- ENUM value validation
- Date format checking

## SQL Generation Logic
- SELECT clause generation (including aggregate functions, aliases)
- FROM clause generation
- JOIN clause generation (currently only basic implementation)
- WHERE clause generation (supports various operators)
- GROUP BY clause generation
- HAVING clause generation
- ORDER BY clause generation
- LIMIT/OFFSET clause generation

## Future Improvements
1. JOIN relationship visualization and implementation
2. Creating query conditions with drag and drop
3. GROUP BY and aggregation function enhancement
4. Query template saving and sharing
5. Query log and history
6. Performance optimization (large data processing)