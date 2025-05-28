import { create } from 'zustand';
import { logger, persist } from '../middleware';
import type { DbConnection } from '../../types/store';

interface DbConnectionStore {
  connections: DbConnection[];
  activeConnectionId: string | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  
  // CRUD actions
  addConnection: (connection: DbConnection) => void;
  updateConnection: (id: string, data: Partial<DbConnection>) => void;
  deleteConnection: (id: string) => void;
  setConnections: (connections: DbConnection[]) => void;
  
  // Active connection management
  setActiveConnectionId: (id: string | null) => void;
  getConnection: (id: string) => DbConnection | undefined;
  getActiveConnection: () => DbConnection | undefined;
  
  // Loading state management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Tag related functions
  getConnectionsByTag: (tag: string) => DbConnection[];
  getAllTags: () => string[];
  
  // Search functions
  searchConnections: (term: string) => DbConnection[];
}

const useDbConnectionStore = create<DbConnectionStore>()(
  logger(
    persist(
      (set, get) => ({
        connections: [],
        activeConnectionId: null,
        isLoading: false,
        error: null,
        lastUpdated: null,
        
        addConnection: (connection) => set((state) => {
          // Check if connection already exists
          const exists = state.connections.some(conn => conn.id === connection.id);
          
          if (exists) {
            return {
              connections: state.connections.map(conn => 
                conn.id === connection.id ? { ...conn, ...connection } : conn
              ),
              lastUpdated: Date.now(),
            };
          }
          
          return {
            connections: [...state.connections, { ...connection }],
            activeConnectionId: state.activeConnectionId || connection.id,
            lastUpdated: Date.now(),
          };
        }),
        
        updateConnection: (id, data) => set((state) => ({
          connections: state.connections.map((conn) => 
            conn.id === id
              ? { ...conn, ...data, updatedAt: Date.now() }
              : conn
          ),
          lastUpdated: Date.now(),
        })),
        
        deleteConnection: (id) => set((state) => {
          const newConnections = state.connections.filter((conn) => conn.id !== id);
          
          // If we're deleting the active connection, set a new active one or null
          let newActiveId = state.activeConnectionId;
          if (state.activeConnectionId === id) {
            newActiveId = newConnections.length > 0 ? newConnections[0].id : null;
          }
          
          return {
            connections: newConnections,
            activeConnectionId: newActiveId,
            lastUpdated: Date.now(),
          };
        }),
        
        setConnections: (connections) => set({
          connections,
          lastUpdated: Date.now(),
        }),
        
        setActiveConnectionId: (id) => set({
          activeConnectionId: id,
        }),
        
        getConnection: (id) => {
          return get().connections.find((conn) => conn.id === id);
        },
        
        getActiveConnection: () => {
          const { connections, activeConnectionId } = get();
          return connections.find((conn) => conn.id === activeConnectionId);
        },
        
        setLoading: (isLoading) => set({
          isLoading,
        }),
        
        setError: (error) => set({
          error,
        }),
        
        getConnectionsByTag: (tag) => {
          return get().connections.filter(conn => 
            conn.tags && conn.tags.includes(tag)
          );
        },
        
        getAllTags: () => {
          const tags = new Set<string>();
          
          get().connections.forEach(conn => {
            if (conn.tags && Array.isArray(conn.tags)) {
              conn.tags.forEach(tag => tags.add(tag));
            }
          });
          
          return Array.from(tags);
        },
        
        searchConnections: (term) => {
          const searchTerm = term.toLowerCase();
          
          return get().connections.filter(conn => 
            (conn.name && conn.name.toLowerCase().includes(searchTerm)) ||
            (conn.host && conn.host.toLowerCase().includes(searchTerm)) ||
            (conn.database && conn.database.toLowerCase().includes(searchTerm)) ||
            (conn.description && conn.description.toLowerCase().includes(searchTerm))
          );
        },
      }),
      { 
        name: 'db-connections',
        partialize: (state) => ({
          connections: state.connections.map(conn => {
            // Don't persist password in localStorage
            const { password, ...rest } = conn;
            return rest;
          }),
          activeConnectionId: state.activeConnectionId,
          // Don't persist loading states, errors
          lastUpdated: state.lastUpdated,
        }),
        version: 2
      }
    ),
    'dbConnectionStore'
  )
);

export default useDbConnectionStore;
