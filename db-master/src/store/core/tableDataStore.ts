import { create } from 'zustand';
import { logger } from '../middleware';

// Table data structure
export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface TableData {
  rows: Record<string, any>[];
  columns: TableColumn[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
}

// Store interface
interface TableDataStore {
  tableData: Record<string, TableData>;
  activeTable: {
    connectionId: string | null;
    tableName: string | null;
  };

  // Pagination and sorting state
  pagination: {
    page: number;
    pageSize: number;
  };
  sorting: {
    column: string | null;
    direction: 'asc' | 'desc' | null;
  };
  
  // Filters
  filters: Array<{
    id: string;
    column: string;
    operator: string;
    value: any;
  }>;

  // Actions
  setTableData: (
    connectionId: string,
    tableName: string,
    data: {
      rows: Record<string, any>[];
      columns: TableColumn[];
      total: number;
      page: number;
      pageSize: number;
    }
  ) => void;
  
  setActiveTable: (connectionId: string, tableName: string) => void;
  setLoading: (connectionId: string, tableName: string, loading: boolean) => void;
  setError: (connectionId: string, tableName: string, error: string | null) => void;
  setPagination: (page: number, pageSize: number) => void;
  setSorting: (column: string | null, direction: 'asc' | 'desc' | null) => void;
  addFilter: (column: string, operator: string, value: any) => void;
  updateFilter: (id: string, filter: { column?: string; operator?: string; value?: any }) => void;
  removeFilter: (id: string) => void;
  clearFilters: () => void;
  getActiveTableData: () => TableData | null;
  clearTableData: (connectionId: string, tableName: string) => void;
  clearAllTableData: () => void;
}

// Generate a unique ID for filters
const generateId = () => Math.random().toString(36).substring(2, 9);

// Default data for a new table
const defaultTableData: TableData = {
  rows: [],
  columns: [],
  total: 0,
  page: 1,
  pageSize: 25,
  loading: false,
  error: null,
};

// Create the store
const useTableDataStore = create<TableDataStore>()(
  logger(
    (set, get) => ({
      tableData: {},
      activeTable: {
        connectionId: null,
        tableName: null,
      },
      pagination: {
        page: 1,
        pageSize: 25,
      },
      sorting: {
        column: null,
        direction: null,
      },
      filters: [],

      setTableData: (connectionId, tableName, data) => set(state => {
        const tableKey = `${connectionId}:${tableName}`;
        const currentData = state.tableData[tableKey] || { ...defaultTableData };
        
        return {
          tableData: {
            ...state.tableData,
            [tableKey]: {
              ...currentData,
              ...data,
              loading: false,
              error: null,
            },
          },
        };
      }),

      setActiveTable: (connectionId, tableName) => set(() => ({
        activeTable: {
          connectionId,
          tableName,
        },
        // Reset pagination, sorting and filters when changing active table
        pagination: {
          page: 1,
          pageSize: 25,
        },
        sorting: {
          column: null,
          direction: null,
        },
        filters: [],
      })),

      setLoading: (connectionId, tableName, loading) => set(state => {
        const tableKey = `${connectionId}:${tableName}`;
        const currentData = state.tableData[tableKey] || { ...defaultTableData };
        
        return {
          tableData: {
            ...state.tableData,
            [tableKey]: {
              ...currentData,
              loading,
            },
          },
        };
      }),

      setError: (connectionId, tableName, error) => set(state => {
        const tableKey = `${connectionId}:${tableName}`;
        const currentData = state.tableData[tableKey] || { ...defaultTableData };
        
        return {
          tableData: {
            ...state.tableData,
            [tableKey]: {
              ...currentData,
              error,
              loading: false,
            },
          },
        };
      }),

      setPagination: (page, pageSize) => set(() => ({
        pagination: {
          page,
          pageSize,
        },
      })),

      setSorting: (column, direction) => set(() => ({
        sorting: {
          column,
          direction,
        },
      })),

      addFilter: (column, operator, value) => set(state => ({
        filters: [
          ...state.filters,
          {
            id: generateId(),
            column,
            operator,
            value,
          },
        ],
      })),

      updateFilter: (id, filter) => set(state => ({
        filters: state.filters.map(f => 
          f.id === id ? { ...f, ...filter } : f
        ),
      })),

      removeFilter: (id) => set(state => ({
        filters: state.filters.filter(f => f.id !== id),
      })),

      clearFilters: () => set(() => ({
        filters: [],
      })),

      getActiveTableData: () => {
        const { activeTable, tableData } = get();
        
        if (!activeTable.connectionId || !activeTable.tableName) {
          return null;
        }
        
        const tableKey = `${activeTable.connectionId}:${activeTable.tableName}`;
        return tableData[tableKey] || null;
      },

      clearTableData: (connectionId, tableName) => set(state => {
        const { [connectionId + ':' + tableName]: _, ...rest } = state.tableData;
        return {
          tableData: rest,
        };
      }),

      clearAllTableData: () => set(() => ({
        tableData: {},
      })),
    }),
    'tableDataStore'
  )
);

export default useTableDataStore;
