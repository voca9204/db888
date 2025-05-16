import { create } from 'zustand';
import { logger, persist } from '../middleware';

// Schema store interface
interface SchemaStore {
  // Schema data
  schemas: Record<string, {
    schema: Record<string, any>;
    updatedAt: number;
    versionId: string;
  }>;
  
  // Current version ID for each connection
  currentVersions: Record<string, string>;
  
  // Versions list for each connection
  versions: Record<string, Array<{
    versionId: string;
    createdAt: number;
  }>>;
  
  // Schema changes between versions
  changes: Record<string, {
    oldVersionId: string;
    newVersionId: string;
    changes: Record<string, any>;
    createdAt: number;
  }>;
  
  // Store schema
  setSchema: (
    connectionId: string, 
    schema: Record<string, any>, 
    updatedAt: number,
    versionId: string
  ) => void;
  
  // Set current version for a connection
  setCurrentVersion: (connectionId: string, versionId: string) => void;
  
  // Set versions for a connection
  setVersions: (
    connectionId: string, 
    versions: Array<{
      versionId: string;
      createdAt: number;
    }>
  ) => void;
  
  // Set changes between versions
  setChanges: (
    connectionId: string,
    oldVersionId: string,
    newVersionId: string,
    changes: Record<string, any>,
    createdAt: number
  ) => void;
  
  // Get schema for a connection
  getSchema: (connectionId: string) => {
    schema: Record<string, any>;
    updatedAt: number;
    versionId: string;
  } | null;
  
  // Get versions for a connection
  getVersions: (connectionId: string) => Array<{
    versionId: string;
    createdAt: number;
  }> | null;
  
  // Get changes between versions
  getChanges: (
    connectionId: string,
    oldVersionId: string,
    newVersionId: string
  ) => {
    changes: Record<string, any>;
    createdAt: number;
  } | null;
  
  // Get current version for a connection
  getCurrentVersion: (connectionId: string) => string | null;
  
  // Clear schema for a connection
  clearSchema: (connectionId: string) => void;
  
  // Clear all schema data
  clearAll: () => void;
}

const useSchemaStore = create<SchemaStore>()(
  logger(
    persist(
      (set, get) => ({
        schemas: {},
        currentVersions: {},
        versions: {},
        changes: {},
        
        setSchema: (connectionId, schema, updatedAt, versionId) => set(state => ({
          schemas: {
            ...state.schemas,
            [connectionId]: {
              schema,
              updatedAt,
              versionId,
            },
          },
          currentVersions: {
            ...state.currentVersions,
            [connectionId]: versionId,
          },
        })),
        
        setCurrentVersion: (connectionId, versionId) => set(state => ({
          currentVersions: {
            ...state.currentVersions,
            [connectionId]: versionId,
          },
        })),
        
        setVersions: (connectionId, versions) => set(state => ({
          versions: {
            ...state.versions,
            [connectionId]: versions,
          },
        })),
        
        setChanges: (connectionId, oldVersionId, newVersionId, changes, createdAt) => set(state => ({
          changes: {
            ...state.changes,
            [`${connectionId}:${oldVersionId}:${newVersionId}`]: {
              oldVersionId,
              newVersionId,
              changes,
              createdAt,
            },
          },
        })),
        
        getSchema: (connectionId) => {
          return get().schemas[connectionId] || null;
        },
        
        getVersions: (connectionId) => {
          return get().versions[connectionId] || null;
        },
        
        getChanges: (connectionId, oldVersionId, newVersionId) => {
          const key = `${connectionId}:${oldVersionId}:${newVersionId}`;
          const changesData = get().changes[key];
          
          if (!changesData) {
            return null;
          }
          
          return {
            changes: changesData.changes,
            createdAt: changesData.createdAt,
          };
        },
        
        getCurrentVersion: (connectionId) => {
          return get().currentVersions[connectionId] || null;
        },
        
        clearSchema: (connectionId) => set(state => {
          const { [connectionId]: _, ...remainingSchemas } = state.schemas;
          const { [connectionId]: __, ...remainingVersions } = state.versions;
          const { [connectionId]: ___, ...remainingCurrentVersions } = state.currentVersions;
          
          // Filter out changes related to this connection
          const remainingChanges = { ...state.changes };
          Object.keys(remainingChanges).forEach(key => {
            if (key.startsWith(`${connectionId}:`)) {
              delete remainingChanges[key];
            }
          });
          
          return {
            schemas: remainingSchemas,
            versions: remainingVersions,
            currentVersions: remainingCurrentVersions,
            changes: remainingChanges,
          };
        }),
        
        clearAll: () => set({
          schemas: {},
          currentVersions: {},
          versions: {},
          changes: {},
        }),
      }),
      {
        name: 'db-schemas',
        partialize: (state) => ({
          // Don't persist schema data, which can be large
          currentVersions: state.currentVersions,
        }),
        version: 1,
      }
    ),
    'schemaStore'
  )
);

export default useSchemaStore;
