import { create } from 'zustand';
import { logger, persist } from '../middleware';
import type { DbConnection } from '../../types/store';

interface DbConnectionStore {
  connections: DbConnection[];
  activeConnectionId: string | null;
  
  addConnection: (connection: Omit<DbConnection, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateConnection: (id: string, data: Partial<DbConnection>) => void;
  deleteConnection: (id: string) => void;
  setActiveConnection: (id: string | null) => void;
  getConnection: (id: string) => DbConnection | undefined;
  getActiveConnection: () => DbConnection | undefined;
}

let nextId = 1;

const useDbConnectionStore = create<DbConnectionStore>()(
  logger(
    persist(
      (set, get) => ({
        connections: [],
        activeConnectionId: null,
        
        addConnection: (connection) => set((state) => {
          const newConnection: DbConnection = {
            ...connection,
            id: `conn_${nextId++}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          
          return {
            connections: [...state.connections, newConnection],
            activeConnectionId: state.activeConnectionId || newConnection.id,
          };
        }),
        
        updateConnection: (id, data) => set((state) => ({
          connections: state.connections.map((conn) => 
            conn.id === id
              ? { ...conn, ...data, updatedAt: Date.now() }
              : conn
          ),
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
          };
        }),
        
        setActiveConnection: (id) => set({
          activeConnectionId: id,
        }),
        
        getConnection: (id) => {
          return get().connections.find((conn) => conn.id === id);
        },
        
        getActiveConnection: () => {
          const { connections, activeConnectionId } = get();
          return connections.find((conn) => conn.id === activeConnectionId);
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
        }),
        version: 1
      }
    ),
    'dbConnectionStore'
  )
);

export default useDbConnectionStore;
