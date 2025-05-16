# Advanced Query Builder Implementation

## Overview
The Advanced Query Builder extends the basic query builder functionality by adding support for multi-table joins, complex conditions, grouping, ordering, and limit/offset operations.

## Components Implemented

### 1. JoinBuilder
- Supports different join types (INNER, LEFT, RIGHT, FULL)
- Allows selection of tables and join conditions
- Provides visual representation of join relationships
- Features join path suggestions based on foreign keys

### 2. GroupByBuilder
- Implements GROUP BY column selection
- Supports HAVING conditions with aggregate functions
- Allows multiple grouping columns
- Enables complex filtering of grouped data

### 3. OrderByBuilder
- Implements ORDER BY functionality
- Supports multiple sorting criteria
- Allows selection of ascending or descending order
- Provides intuitive interface for managing sort order

### 4. LimitOffsetBuilder
- Controls the LIMIT and OFFSET clauses
- Includes DISTINCT toggle for unique results
- Provides preset limit options for convenience
- Includes helpful explanations for pagination usage

## Integration with QueryStore
All components integrate with the central query state store implemented with Zustand. Key store functions utilized:
- `addJoin`, `updateJoin`, `removeJoin`, `clearJoins`
- `addGroupBy`, `removeGroupBy`, `clearGroupBy`
- `addHaving`, `updateHaving`, `removeHaving`, `clearHaving`
- `addOrderBy`, `updateOrderBy`, `removeOrderBy`, `clearOrderBy`
- `setLimit`, `setOffset`, `setDistinct`

## SQL Generation
The SQL generator utility was extended to support:
- Generation of JOIN clauses with different types
- GROUP BY and HAVING clauses
- ORDER BY clauses with direction
- LIMIT and OFFSET clauses
- DISTINCT keyword support

## UI Enhancement
- Tab-based navigation between query building sections
- Visual representations of query structures
- Informative descriptions and hints for each feature
- Consistent styling and user experience

## Future Improvements
- Automatic join path detection based on foreign key relationships
- Subquery support in the query builder
- More advanced visualization of query relationships
- Performance optimizations for large schemas