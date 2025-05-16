// DEV MODE ONLY: Mock functions for development
import type { DbConnection } from '../types/store';

// Database connection testing
export const testDatabaseConnection = async (
  connectionId?: string,
  connectionDetails?: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl?: boolean;
  }
) => {
  // In development mode, always return success for testing
  return {
    data: {
      success: true,
      message: 'Connection successful (Mock)'
    }
  };
};

// Save database connection
export const saveDbConnection = async (
  connection: Partial<DbConnection> & {
    name: string;
    host: string;
    port: number;
    database: string;
    user: string;
    userId: string;
  }
) => {
  // In development mode, return success with mock ID
  return {
    data: {
      id: `mock_${Date.now()}`,
      success: true
    }
  };
};

// Get all user's database connections
export const getDbConnections = async () => {
  // Return empty array in development mode
  return {
    data: {
      connections: []
    }
  };
};

// Delete database connection
export const deleteDbConnection = async (connectionId: string) => {
  // Return success in development mode
  return {
    data: {
      success: true
    }
  };
};

// Execute SQL query
export const executeSqlQuery = async (
  connectionId: string,
  query: string,
  parameters: any[] = []
) => {
  // Return mock results in development mode
  return {
    data: {
      rows: [],
      fields: [],
      rowCount: 0
    }
  };
};

// Get database schema
export const getDatabaseSchema = async (
  connectionId: string, 
  forceRefresh = false,
  page = 1,
  pageSize = 50
) => {
  // Return mock schema in development mode
  return {
    data: {
      schema: {
        tables: {},
        views: {},
        procedures: {}
      },
      total: 0
    }
  };
};

// Get schema versions
export const getSchemaVersions = async (
  connectionId: string,
  limit = 10
) => {
  // Return empty array in development mode
  return {
    data: {
      versions: []
    }
  };
};

// Get schema changes between two versions
export const getSchemaChanges = async (
  connectionId: string,
  oldVersionId: string,
  newVersionId: string
) => {
  // Return empty changes in development mode
  return {
    data: {
      changes: {}
    }
  };
};

// Get specific schema version
export const getSchemaVersion = async (
  connectionId: string,
  versionId: string,
  page = 1,
  pageSize = 50
) => {
  // Return empty schema in development mode
  return {
    data: {
      version: {},
      schema: {
        tables: {},
        views: {},
        procedures: {}
      }
    }
  };
};

// Get table data with pagination and sorting
export const getTableData = async (
  connectionId: string,
  tableName: string,
  page = 1,
  pageSize = 50,
  sortColumn?: string,
  sortDirection?: 'asc' | 'desc',
  filters?: { column: string, operator: string, value: any }[]
) => {
  // Generate mock data for tables
  const mockData = [];
  const startIdx = (page - 1) * pageSize;
  
  // Generate different data based on table name
  for (let i = 0; i < pageSize; i++) {
    const rowIdx = startIdx + i;
    
    if (tableName === 'users') {
      mockData.push({
        id: rowIdx + 1,
        username: `user${rowIdx + 1}`,
        email: `user${rowIdx + 1}@example.com`,
        role: i % 3 === 0 ? 'admin' : (i % 3 === 1 ? 'editor' : 'user'),
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        active: i % 5 !== 0,
      });
    } else if (tableName === 'products') {
      mockData.push({
        id: rowIdx + 1,
        name: `Product ${rowIdx + 1}`,
        price: Math.round(((rowIdx % 10) * 15.75 + 10) * 100) / 100,
        category: `Category ${(rowIdx % 5) + 1}`,
        stock: Math.floor(Math.random() * 1000),
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      });
    } else if (tableName === 'orders') {
      mockData.push({
        id: rowIdx + 1,
        customer_id: Math.floor(Math.random() * 100) + 1,
        total: Math.round(Math.random() * 10000) / 100,
        status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][i % 5],
        items: Math.floor(Math.random() * 10) + 1,
        orderDate: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      });
    } else {
      // Default table data
      mockData.push({
        id: rowIdx + 1,
        name: `Item ${rowIdx + 1}`,
        description: `Description for item ${rowIdx + 1}`,
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        status: i % 3 === 0 ? 'Active' : (i % 3 === 1 ? 'Pending' : 'Inactive'),
        count: Math.floor(Math.random() * 100),
      });
    }
  }
  
  // Apply sorting if specified
  if (sortColumn) {
    mockData.sort((a, b) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'desc' 
          ? valueB.localeCompare(valueA) 
          : valueA.localeCompare(valueB);
      }
      
      return sortDirection === 'desc'
        ? valueB - valueA
        : valueA - valueB;
    });
  }
  
  // Apply filters if specified
  let filteredData = mockData;
  if (filters && filters.length > 0) {
    filteredData = mockData.filter(item => {
      return filters.every(filter => {
        const value = item[filter.column];
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
          case 'gt':
            return value > filter.value;
          case 'gte':
            return value >= filter.value;
          case 'lt':
            return value < filter.value;
          case 'lte':
            return value <= filter.value;
          default:
            return true;
        }
      });
    });
  }
  
  // Return mock response
  return {
    data: {
      rows: filteredData,
      total: 1000, // Mock total count
      page,
      pageSize,
      totalPages: Math.ceil(1000 / pageSize),
    }
  };
};
