import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Spinner, Tabs, TabPanel } from '../components/ui';
import { RefreshIcon, TableIcon, ClockIcon, ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useDbConnectionStore, useSchemaStore } from '../store';
import { fetchDatabaseSchema, fetchSchemaVersions, fetchSchemaChanges, fetchSchemaVersion } from '../services';
import { ERDViewer } from '../components/data';

const SchemaViewer: React.FC = () => {
  const navigate = useNavigate();
  const { connections, activeConnectionId } = useDbConnectionStore();
  const { 
    getSchema, 
    setSchema, 
    getVersions, 
    setVersions, 
    setChanges 
  } = useSchemaStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [activeTab, setActiveTab] = useState('tables');
  const [tableFilter, setTableFilter] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [versions, setVersionsList] = useState<Array<{ versionId: string; createdAt: number }>>([]);
  const [schemaChanges, setSchemaChanges] = useState<Record<string, any> | null>(null);
  const [tableView, setTableView] = useState<'list' | 'details'>('list');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  
  // Current active schema
  const [schema, setCurrentSchema] = useState<Record<string, any>>({});
  const [schemaInfo, setSchemaInfo] = useState<{
    updatedAt: number;
    versionId: string;
    fromCache: boolean;
    pagination: {
      page: number;
      pageSize: number;
      totalPages: number;
      totalTables: number;
    };
  }>({
    updatedAt: 0,
    versionId: '',
    fromCache: false,
    pagination: {
      page: 1,
      pageSize: 50,
      totalPages: 0,
      totalTables: 0,
    },
  });
  
  // Fetch schema data
  const loadSchema = async (forceRefresh = false) => {
    if (!activeConnectionId) {
      setError('No active connection selected');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchDatabaseSchema(
        activeConnectionId,
        forceRefresh,
        currentPage,
        pageSize
      );
      
      if (result.success) {
        setCurrentSchema(result.schema);
        setSchemaInfo({
          updatedAt: result.updatedAt,
          versionId: result.versionId,
          fromCache: result.fromCache,
          pagination: result.pagination,
        });
        
        // Store in schema store
        setSchema(
          activeConnectionId,
          result.schema,
          result.updatedAt,
          result.versionId
        );
        
        // Load versions
        loadVersions();
      } else {
        setError(result.message || 'Failed to load database schema');
      }
    } catch (err) {
      setError('An error occurred while loading the schema');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Load schema versions
  const loadVersions = async () => {
    if (!activeConnectionId) return;
    
    try {
      const result = await fetchSchemaVersions(activeConnectionId, 10);
      
      if (result.success) {
        setVersionsList(result.versions);
        setVersions(activeConnectionId, result.versions);
        
        // Set selected version to latest if not already set
        if (!selectedVersionId && result.versions.length > 0) {
          setSelectedVersionId(result.versions[0].versionId);
        }
        
        // Set compare version to second latest if available
        if (!compareVersionId && result.versions.length > 1) {
          setCompareVersionId(result.versions[1].versionId);
        }
      }
    } catch (err) {
      console.error('Error loading versions:', err);
    }
  };
  
  // Load schema changes
  const loadSchemaChanges = async () => {
    if (!activeConnectionId || !selectedVersionId || !compareVersionId) return;
    
    setLoading(true);
    
    try {
      const result = await fetchSchemaChanges(
        activeConnectionId,
        compareVersionId,
        selectedVersionId
      );
      
      if (result.success) {
        setSchemaChanges(result.changes);
        setChanges(
          activeConnectionId,
          compareVersionId,
          selectedVersionId,
          result.changes,
          result.createdAt
        );
      } else {
        setError(result.message || 'Failed to load schema changes');
        setSchemaChanges(null);
      }
    } catch (err) {
      setError('An error occurred while loading schema changes');
      console.error(err);
      setSchemaChanges(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Load schema for specific version
  const loadSchemaVersion = async () => {
    if (!activeConnectionId || !selectedVersionId) return;
    
    setLoading(true);
    
    try {
      const result = await fetchSchemaVersion(
        activeConnectionId,
        selectedVersionId,
        currentPage,
        pageSize
      );
      
      if (result.success) {
        setCurrentSchema(result.schema);
        setSchemaInfo({
          updatedAt: result.createdAt,
          versionId: result.versionId,
          fromCache: true,
          pagination: result.pagination,
        });
      } else {
        setError(result.message || 'Failed to load schema version');
      }
    } catch (err) {
      setError('An error occurred while loading the schema version');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    if (activeConnectionId) {
      loadSchema();
    }
  }, [activeConnectionId]);
  
  // Load schema when page or page size changes
  useEffect(() => {
    if (activeConnectionId) {
      loadSchema();
    }
  }, [currentPage, pageSize]);
  
  // Load schema changes when selected versions change
  useEffect(() => {
    if (activeTab === 'changes' && selectedVersionId && compareVersionId) {
      loadSchemaChanges();
    }
  }, [activeTab, selectedVersionId, compareVersionId]);
  
  // Load schema version when selected version changes
  useEffect(() => {
    if (activeTab === 'history' && selectedVersionId) {
      loadSchemaVersion();
    }
  }, [activeTab, selectedVersionId]);
  
  // Filter tables based on search input
  const filteredTables = Object.keys(schema).filter(
    tableName => tableName.toLowerCase().includes(tableFilter.toLowerCase())
  );
  
  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    loadSchema(true);
  };
  
  // Handle table selection
  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setTableView('details');
  };
  
  // Switch back to table list
  const handleBackToList = () => {
    setTableView('list');
    setSelectedTable(null);
  };
  
  // Render column details
  const renderColumnDetails = (column: any) => {
    return (
      <div className="flex flex-col space-y-1">
        <div className="flex justify-between">
          <span className="font-medium">{column.name}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {column.type}
            {column.key === 'PRI' && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">
                PK
              </span>
            )}
            {column.key === 'MUL' && (
              <span className="ml-2 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded-full">
                FK
              </span>
            )}
            {column.key === 'UNI' && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-full">
                UNI
              </span>
            )}
          </span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {column.nullable ? 'NULL' : 'NOT NULL'}
          {column.defaultValue !== null && ` DEFAULT ${column.defaultValue}`}
          {column.extra && ` ${column.extra.toUpperCase()}`}
        </div>
        {column.comment && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {column.comment}
          </div>
        )}
      </div>
    );
  };
  
  // Render foreign key details
  const renderForeignKeys = (foreignKeys: any[]) => {
    if (!foreignKeys || foreignKeys.length === 0) {
      return <div className="text-sm text-gray-500 dark:text-gray-400">No foreign keys</div>;
    }
    
    return (
      <div className="space-y-2">
        {foreignKeys.map((fk, index) => (
          <div key={index} className="text-sm">
            <span className="font-medium">{fk.column}</span>
            <span className="text-gray-600 dark:text-gray-400">
              {' → '}
              <span className="cursor-pointer hover:underline" onClick={() => handleTableSelect(fk.referenceTable)}>
                {fk.referenceTable}
              </span>
              ({fk.referenceColumn})
            </span>
          </div>
        ))}
      </div>
    );
  };
  
  // Render indexes
  const renderIndexes = (indexes: any[]) => {
    if (!indexes || indexes.length === 0) {
      return <div className="text-sm text-gray-500 dark:text-gray-400">No indexes</div>;
    }
    
    return (
      <div className="space-y-2">
        {indexes.map((idx, index) => (
          <div key={index} className="text-sm">
            <span className="font-medium">{idx.name}</span>
            <span className="ml-2 text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded-full">
              {idx.unique ? 'UNIQUE' : 'INDEX'}
            </span>
            <div className="text-gray-600 dark:text-gray-400">
              Columns: {idx.columns.join(', ')}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render schema changes
  const renderSchemaChanges = () => {
    if (!schemaChanges) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Select two versions to compare
          </p>
        </div>
      );
    }
    
    const { addedTables, removedTables, modifiedTables } = schemaChanges;
    
    return (
      <div className="space-y-6">
        {addedTables.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Added Tables</h3>
            <ul className="space-y-1">
              {addedTables.map(table => (
                <li key={table} className="text-green-600 dark:text-green-400">+ {table}</li>
              ))}
            </ul>
          </div>
        )}
        
        {removedTables.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Removed Tables</h3>
            <ul className="space-y-1">
              {removedTables.map(table => (
                <li key={table} className="text-red-600 dark:text-red-400">- {table}</li>
              ))}
            </ul>
          </div>
        )}
        
        {Object.keys(modifiedTables).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Modified Tables</h3>
            <div className="space-y-4">
              {Object.entries(modifiedTables).map(([tableName, changes]: [string, any]) => (
                <Card key={tableName} title={tableName} className="overflow-hidden">
                  <div className="space-y-4">
                    {changes.commentChanged && (
                      <div>
                        <h4 className="text-md font-semibold mb-1">Comment Changed</h4>
                        <div className="text-sm">
                          <div className="text-red-600 dark:text-red-400">- {changes.oldComment || '(no comment)'}</div>
                          <div className="text-green-600 dark:text-green-400">+ {changes.newComment || '(no comment)'}</div>
                        </div>
                      </div>
                    )}
                    
                    {changes.addedColumns.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold mb-1">Added Columns</h4>
                        <ul className="space-y-1">
                          {changes.addedColumns.map(col => (
                            <li key={col} className="text-green-600 dark:text-green-400">+ {col}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {changes.removedColumns.length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold mb-1">Removed Columns</h4>
                        <ul className="space-y-1">
                          {changes.removedColumns.map(col => (
                            <li key={col} className="text-red-600 dark:text-red-400">- {col}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {Object.keys(changes.modifiedColumns).length > 0 && (
                      <div>
                        <h4 className="text-md font-semibold mb-1">Modified Columns</h4>
                        <div className="space-y-3">
                          {Object.entries(changes.modifiedColumns).map(([colName, colChanges]: [string, any]) => (
                            <div key={colName} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="font-medium mb-1">{colName}</div>
                              <div className="text-sm space-y-1">
                                {colChanges.changes.type && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Type: </span>
                                    <span className="text-red-600 dark:text-red-400">{colChanges.old.type}</span>
                                    <span> → </span>
                                    <span className="text-green-600 dark:text-green-400">{colChanges.new.type}</span>
                                  </div>
                                )}
                                
                                {colChanges.changes.nullable && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Nullable: </span>
                                    <span className="text-red-600 dark:text-red-400">{colChanges.old.nullable ? 'YES' : 'NO'}</span>
                                    <span> → </span>
                                    <span className="text-green-600 dark:text-green-400">{colChanges.new.nullable ? 'YES' : 'NO'}</span>
                                  </div>
                                )}
                                
                                {colChanges.changes.defaultValue && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Default: </span>
                                    <span className="text-red-600 dark:text-red-400">{colChanges.old.defaultValue || '(null)'}</span>
                                    <span> → </span>
                                    <span className="text-green-600 dark:text-green-400">{colChanges.new.defaultValue || '(null)'}</span>
                                  </div>
                                )}
                                
                                {colChanges.changes.extra && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Extra: </span>
                                    <span className="text-red-600 dark:text-red-400">{colChanges.old.extra || '(none)'}</span>
                                    <span> → </span>
                                    <span className="text-green-600 dark:text-green-400">{colChanges.new.extra || '(none)'}</span>
                                  </div>
                                )}
                                
                                {colChanges.changes.comment && (
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">Comment: </span>
                                    <span className="text-red-600 dark:text-red-400">{colChanges.old.comment || '(none)'}</span>
                                    <span> → </span>
                                    <span className="text-green-600 dark:text-green-400">{colChanges.new.comment || '(none)'}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Similar sections for indexes and foreign keys */}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {addedTables.length === 0 && removedTables.length === 0 && Object.keys(modifiedTables).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No changes detected between these versions
            </p>
          </div>
        )}
      </div>
    );
  };
  
  // If no active connection
  if (!activeConnectionId) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Database Schema</h1>
        </div>
        
        <Card>
          <div className="text-center py-8">
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              No active database connection selected
            </p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/database')}
            >
              Go to Connections
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // Determine active connection
  const activeConnection = connections.find(conn => conn.id === activeConnectionId);
  
  // Main UI render
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Database Schema</h1>
          {activeConnection && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {activeConnection.name} • {activeConnection.host}:{activeConnection.port}/{activeConnection.database}
            </p>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            leftIcon={<RefreshIcon className="h-5 w-5" />}
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Schema'}
          </Button>
        </div>
      </div>
      
      {loading && (
        <div className="flex justify-center py-4">
          <Spinner size="lg" />
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-700">
          {error}
        </div>
      )}
      
      {!loading && !error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Last updated: {formatDate(schemaInfo.updatedAt || Date.now())}
                {schemaInfo.fromCache && ' (from cache)'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {Object.keys(schema).length} tables
                {schemaInfo.pagination.totalTables > Object.keys(schema).length && 
                  ` of ${schemaInfo.pagination.totalTables}`}
              </span>
              
              {schemaInfo.pagination.totalPages > 1 && (
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    &larr;
                  </Button>
                  
                  <span className="text-sm">
                    Page {currentPage} of {schemaInfo.pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage === schemaInfo.pagination.totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    &rarr;
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <Tabs
            tabs={[
              { id: 'tables', label: 'Tables', icon: TableIcon },
              { id: 'erd', label: 'ERD', icon: ChartBarIcon },
              { id: 'history', label: 'History', icon: ClockIcon },
              { id: 'changes', label: 'Changes', icon: ArrowPathIcon },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          >
            <TabPanel id="tables">
              <div className="space-y-4">
                <Input
                  placeholder="Filter tables..."
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  fullWidth
                />
                
                {tableView === 'list' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTables.length === 0 ? (
                      <div className="col-span-3 text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                          No tables found
                        </p>
                      </div>
                    ) : (
                      filteredTables.map(tableName => {
                        const table = schema[tableName];
                        return (
                          <Card 
                            key={tableName} 
                            title={tableName}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleTableSelect(tableName)}
                          >
                            <div className="space-y-2">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {table.columns.length} columns • {table.type}
                              </div>
                              
                              {table.comment && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {table.comment}
                                </div>
                              )}
                              
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {table.columns.slice(0, 3).map(col => col.name).join(', ')}
                                {table.columns.length > 3 && '...'}
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                ) : (
                  selectedTable && (
                    <div className="space-y-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToList}
                      >
                        &larr; Back to Tables
                      </Button>
                      
                      <Card title={selectedTable} subtitle={schema[selectedTable].type}>
                        <div className="space-y-6">
                          {schema[selectedTable].comment && (
                            <div>
                              <h3 className="text-lg font-semibold mb-2">Comment</h3>
                              <p className="text-gray-700 dark:text-gray-300">
                                {schema[selectedTable].comment}
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Columns</h3>
                            <div className="space-y-3">
                              {schema[selectedTable].columns.map((column, index) => (
                                <div 
                                  key={index}
                                  className="p-2 bg-gray-50 dark:bg-gray-800 rounded"
                                >
                                  {renderColumnDetails(column)}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Foreign Keys</h3>
                            {renderForeignKeys(schema[selectedTable].foreignKeys)}
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Indexes</h3>
                            {renderIndexes(schema[selectedTable].indexes)}
                          </div>
                        </div>
                      </Card>
                    </div>
                  )
                )}
              </div>
            </TabPanel>
            
            <TabPanel id="erd">
              <div className="h-[700px]">
                <ERDViewer
                  connectionId={activeConnectionId}
                  schemaData={schema ? { tables: schema } : null}
                />
              </div>
            </TabPanel>
            
            <TabPanel id="history">
              <div className="space-y-4">
                {versions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No schema versions found
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex space-x-2 items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Select version:
                      </span>
                      
                      <select
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={selectedVersionId || ''}
                        onChange={(e) => setSelectedVersionId(e.target.value)}
                      >
                        {versions.map(version => (
                          <option key={version.versionId} value={version.versionId}>
                            {formatDate(version.createdAt)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.keys(schema).map(tableName => {
                        const table = schema[tableName];
                        return (
                          <Card 
                            key={tableName} 
                            title={tableName}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleTableSelect(tableName)}
                          >
                            <div className="space-y-2">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {table.columns.length} columns • {table.type}
                              </div>
                              
                              {table.comment && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {table.comment}
                                </div>
                              )}
                              
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {table.columns.slice(0, 3).map(col => col.name).join(', ')}
                                {table.columns.length > 3 && '...'}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </TabPanel>
            
            <TabPanel id="changes">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 items-start sm:items-center">
                  <div className="flex space-x-2 items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      From:
                    </span>
                    
                    <select
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={compareVersionId || ''}
                      onChange={(e) => setCompareVersionId(e.target.value)}
                    >
                      {versions.map(version => (
                        <option 
                          key={version.versionId} 
                          value={version.versionId}
                          disabled={version.versionId === selectedVersionId}
                        >
                          {formatDate(version.createdAt)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex space-x-2 items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      To:
                    </span>
                    
                    <select
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={selectedVersionId || ''}
                      onChange={(e) => setSelectedVersionId(e.target.value)}
                    >
                      {versions.map(version => (
                        <option 
                          key={version.versionId} 
                          value={version.versionId}
                          disabled={version.versionId === compareVersionId}
                        >
                          {formatDate(version.createdAt)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={loadSchemaChanges}
                    disabled={!selectedVersionId || !compareVersionId || loading}
                  >
                    Compare Versions
                  </Button>
                </div>
                
                {renderSchemaChanges()}
              </div>
            </TabPanel>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default SchemaViewer;
