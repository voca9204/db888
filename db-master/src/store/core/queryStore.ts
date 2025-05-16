import { create } from 'zustand';
import { logger, persist } from '../middleware';
import type { 
  QueryState, 
  QueryColumn, 
  QueryCondition,
  QueryJoin,
  QueryGroup,
  QueryOrder
} from '../../types/store';
import { v4 as uuidv4 } from 'uuid';

interface QueryStore {
  // Current query state
  queryState: QueryState;
  
  // Query history
  queryHistory: {
    id: string;
    name: string;
    sql: string;
    queryState: QueryState;
    timestamp: number;
  }[];
  
  // Query actions
  resetQuery: () => void;
  setSelectedTable: (table: string) => void;
  
  // Columns
  addColumn: (column: Omit<QueryColumn, 'id'>) => void;
  updateColumn: (id: string, data: Partial<Omit<QueryColumn, 'id'>>) => void;
  removeColumn: (id: string) => void;
  clearColumns: () => void;
  
  // Joins
  addJoin: (join: Omit<QueryJoin, 'id'>) => void;
  updateJoin: (id: string, data: Partial<Omit<QueryJoin, 'id'>>) => void;
  removeJoin: (id: string) => void;
  clearJoins: () => void;
  
  // Conditions
  addCondition: (condition: Omit<QueryCondition, 'id'>) => void;
  updateCondition: (id: string, data: Partial<Omit<QueryCondition, 'id'>>) => void;
  removeCondition: (id: string) => void;
  clearConditions: () => void;
  
  // Group By
  addGroupBy: (group: Omit<QueryGroup, 'id'>) => void;
  removeGroupBy: (id: string) => void;
  clearGroupBy: () => void;
  
  // Having
  addHaving: (having: Omit<QueryCondition, 'id'>) => void;
  updateHaving: (id: string, data: Partial<Omit<QueryCondition, 'id'>>) => void;
  removeHaving: (id: string) => void;
  clearHaving: () => void;
  
  // Order By
  addOrderBy: (order: Omit<QueryOrder, 'id'>) => void;
  updateOrderBy: (id: string, data: Partial<Omit<QueryOrder, 'id'>>) => void;
  removeOrderBy: (id: string) => void;
  clearOrderBy: () => void;
  
  // Limit & Offset
  setLimit: (limit?: number) => void;
  setOffset: (offset?: number) => void;
  
  // Distinct
  setDistinct: (distinct: boolean) => void;
  
  // Query history
  saveQueryToHistory: (name: string, sql: string) => void;
  clearQueryHistory: () => void;
  loadQueryFromHistory: (id: string) => void;
}

const initialQueryState: QueryState = {
  selectedTable: '',
  columns: [],
  joins: [],
  conditions: [],
  groupBy: [],
  having: [],
  orderBy: [],
  limit: undefined,
  offset: undefined,
  distinct: false,
};

const useQueryStore = create<QueryStore>()(
  logger(
    persist(
      (set, get) => ({
        queryState: { ...initialQueryState },
        queryHistory: [],
        
        resetQuery: () => set({
          queryState: { ...initialQueryState },
        }),
        
        setSelectedTable: (selectedTable) => set((state) => ({
          queryState: {
            ...state.queryState,
            selectedTable,
          },
        })),
        
        // Columns
        addColumn: (column) => set((state) => ({
          queryState: {
            ...state.queryState,
            columns: [
              ...state.queryState.columns,
              { ...column, id: uuidv4() },
            ],
          },
        })),
        
        updateColumn: (id, data) => set((state) => ({
          queryState: {
            ...state.queryState,
            columns: state.queryState.columns.map((col) => 
              col.id === id ? { ...col, ...data } : col
            ),
          },
        })),
        
        removeColumn: (id) => set((state) => ({
          queryState: {
            ...state.queryState,
            columns: state.queryState.columns.filter((col) => col.id !== id),
          },
        })),
        
        clearColumns: () => set((state) => ({
          queryState: {
            ...state.queryState,
            columns: [],
          },
        })),
        
        // Joins
        addJoin: (join) => set((state) => ({
          queryState: {
            ...state.queryState,
            joins: [
              ...state.queryState.joins,
              { ...join, id: uuidv4() },
            ],
          },
        })),
        
        updateJoin: (id, data) => set((state) => ({
          queryState: {
            ...state.queryState,
            joins: state.queryState.joins.map((join) => 
              join.id === id ? { ...join, ...data } : join
            ),
          },
        })),
        
        removeJoin: (id) => set((state) => ({
          queryState: {
            ...state.queryState,
            joins: state.queryState.joins.filter((join) => join.id !== id),
          },
        })),
        
        clearJoins: () => set((state) => ({
          queryState: {
            ...state.queryState,
            joins: [],
          },
        })),
        
        // Conditions
        addCondition: (condition) => set((state) => ({
          queryState: {
            ...state.queryState,
            conditions: [
              ...state.queryState.conditions,
              { ...condition, id: uuidv4() },
            ],
          },
        })),
        
        updateCondition: (id, data) => set((state) => ({
          queryState: {
            ...state.queryState,
            conditions: state.queryState.conditions.map((cond) => 
              cond.id === id ? { ...cond, ...data } : cond
            ),
          },
        })),
        
        removeCondition: (id) => set((state) => ({
          queryState: {
            ...state.queryState,
            conditions: state.queryState.conditions.filter((cond) => cond.id !== id),
          },
        })),
        
        clearConditions: () => set((state) => ({
          queryState: {
            ...state.queryState,
            conditions: [],
          },
        })),
        
        // Group By
        addGroupBy: (group) => set((state) => ({
          queryState: {
            ...state.queryState,
            groupBy: [
              ...state.queryState.groupBy,
              { ...group, id: uuidv4() },
            ],
          },
        })),
        
        removeGroupBy: (id) => set((state) => ({
          queryState: {
            ...state.queryState,
            groupBy: state.queryState.groupBy.filter((group) => group.id !== id),
          },
        })),
        
        clearGroupBy: () => set((state) => ({
          queryState: {
            ...state.queryState,
            groupBy: [],
          },
        })),
        
        // Having
        addHaving: (having) => set((state) => ({
          queryState: {
            ...state.queryState,
            having: [
              ...state.queryState.having,
              { ...having, id: uuidv4() },
            ],
          },
        })),
        
        updateHaving: (id, data) => set((state) => ({
          queryState: {
            ...state.queryState,
            having: state.queryState.having.map((hav) => 
              hav.id === id ? { ...hav, ...data } : hav
            ),
          },
        })),
        
        removeHaving: (id) => set((state) => ({
          queryState: {
            ...state.queryState,
            having: state.queryState.having.filter((hav) => hav.id !== id),
          },
        })),
        
        clearHaving: () => set((state) => ({
          queryState: {
            ...state.queryState,
            having: [],
          },
        })),
        
        // Order By
        addOrderBy: (order) => set((state) => ({
          queryState: {
            ...state.queryState,
            orderBy: [
              ...state.queryState.orderBy,
              { ...order, id: uuidv4() },
            ],
          },
        })),
        
        updateOrderBy: (id, data) => set((state) => ({
          queryState: {
            ...state.queryState,
            orderBy: state.queryState.orderBy.map((ord) => 
              ord.id === id ? { ...ord, ...data } : ord
            ),
          },
        })),
        
        removeOrderBy: (id) => set((state) => ({
          queryState: {
            ...state.queryState,
            orderBy: state.queryState.orderBy.filter((ord) => ord.id !== id),
          },
        })),
        
        clearOrderBy: () => set((state) => ({
          queryState: {
            ...state.queryState,
            orderBy: [],
          },
        })),
        
        // Limit & Offset
        setLimit: (limit) => set((state) => ({
          queryState: {
            ...state.queryState,
            limit,
          },
        })),
        
        setOffset: (offset) => set((state) => ({
          queryState: {
            ...state.queryState,
            offset,
          },
        })),
        
        // Distinct
        setDistinct: (distinct) => set((state) => ({
          queryState: {
            ...state.queryState,
            distinct,
          },
        })),
        
        // Query history
        saveQueryToHistory: (name, sql) => set((state) => {
          // Limit history to last 20 entries
          const history = [
            {
              id: uuidv4(),
              name,
              sql,
              queryState: { ...state.queryState },
              timestamp: Date.now(),
            },
            ...state.queryHistory,
          ].slice(0, 20);
          
          return { queryHistory: history };
        }),
        
        clearQueryHistory: () => set({ queryHistory: [] }),
        
        loadQueryFromHistory: (id) => {
          const { queryHistory } = get();
          const historyItem = queryHistory.find((item) => item.id === id);
          
          if (historyItem) {
            set({
              queryState: { ...historyItem.queryState },
            });
          }
        },
      }),
      { 
        name: 'query-builder',
        partialize: (state) => ({
          queryHistory: state.queryHistory.slice(0, 20),
        }),
        version: 1
      }
    ),
    'queryStore'
  )
);

export default useQueryStore;
