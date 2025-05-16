import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Spinner } from '../components/ui';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useDbConnectionStore } from '../store';
import { useAuth } from '../hooks/useAuth';
import type { DbConnection } from '../types/store';
import { testConnection, saveConnection, loadConnections, removeConnection } from '../services';

const DatabaseConnections: React.FC = () => {
  const { activeConnectionId, setActiveConnection } = useDbConnectionStore();
  const { user } = useAuth();
  const [showNewConnectionForm, setShowNewConnectionForm] = useState(false);
  const [editConnectionId, setEditConnectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [connections, setConnections] = useState<DbConnection[]>([]);
  
  // Form state
  const [formValues, setFormValues] = useState<Omit<DbConnection, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    host: '',
    port: 3306,
    database: '',
    user: '',
    password: '',
    ssl: false,
    userId: user?.uid || 'unknown-user', // Get from auth context
  });
  
  // Load connections on component mount
  useEffect(() => {
    const fetchConnections = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await loadConnections();
        if (result.success) {
          setConnections(result.connections || []);
        } else {
          setError(result.message || 'Failed to load connections');
        }
      } catch (err) {
        setError('Failed to load connections');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConnections();
  }, [user?.uid]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value,
    }));
  };
  
  // Start editing a connection
  const handleEditConnection = (connection: DbConnection) => {
    setEditConnectionId(connection.id);
    setFormValues({
      name: connection.name,
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.user,
      password: '', // Don't populate password
      ssl: connection.ssl,
      userId: connection.userId,
    });
    setError(null);
    setSuccessMessage(null);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditConnectionId(null);
    setShowNewConnectionForm(false);
    setFormValues({
      name: '',
      host: '',
      port: 3306,
      database: '',
      user: '',
      password: '',
      ssl: false,
      userId: user?.uid || 'unknown-user',
    });
    setError(null);
    setSuccessMessage(null);
  };
  
  // Save new connection
  const handleSaveNewConnection = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const result = await saveConnection({
        ...formValues,
        userId: user?.uid || 'unknown-user',
      });
      
      if (result.success) {
        setSuccessMessage('Connection saved successfully');
        setShowNewConnectionForm(false);
        setFormValues({
          name: '',
          host: '',
          port: 3306,
          database: '',
          user: '',
          password: '',
          ssl: false,
          userId: user?.uid || 'unknown-user',
        });
      } else {
        setError(result.message || 'Failed to save connection');
      }
    } catch (err) {
      setError('An error occurred while saving the connection');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update existing connection
  const handleUpdateConnection = async () => {
    if (editConnectionId) {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      try {
        const result = await saveConnection({
          ...formValues,
          id: editConnectionId,
          userId: user?.uid || 'unknown-user',
        });
        
        if (result.success) {
          setSuccessMessage('Connection updated successfully');
          setEditConnectionId(null);
          setFormValues({
            name: '',
            host: '',
            port: 3306,
            database: '',
            user: '',
            password: '',
            ssl: false,
            userId: user?.uid || 'unknown-user',
          });
        } else {
          setError(result.message || 'Failed to update connection');
        }
      } catch (err) {
        setError('An error occurred while updating the connection');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Delete a connection
  const handleDeleteConnection = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this connection?')) {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      try {
        const result = await removeConnection(id);
        
        if (result.success) {
          setSuccessMessage('Connection deleted successfully');
        } else {
          setError(result.message || 'Failed to delete connection');
        }
      } catch (err) {
        setError('An error occurred while deleting the connection');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Set active connection
  const handleSetActiveConnection = async (id: string) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Set active connection in store
      setActiveConnection(id);
      setSuccessMessage('Connection activated');
    } catch (err) {
      setError('Failed to activate connection');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Test a connection
  const handleTestConnection = async (connection: DbConnection) => {
    setIsTesting(connection.id);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const result = await testConnection(connection.id);
      
      if (result.success) {
        setSuccessMessage(`Connection successful: ${result.message}`);
      } else {
        setError(`Connection failed: ${result.message}`);
      }
    } catch (err) {
      setError('An error occurred while testing the connection');
      console.error(err);
    } finally {
      setIsTesting(null);
    }
  };

  // Test a new connection
  const handleTestNewConnection = async () => {
    setIsTesting('new');
    setError(null);
    setSuccessMessage(null);
    
    try {
      const result = await testConnection(undefined, {
        host: formValues.host,
        port: formValues.port,
        user: formValues.user,
        password: formValues.password,
        database: formValues.database,
        ssl: formValues.ssl,
      });
      
      if (result.success) {
        setSuccessMessage(`Connection successful: ${result.message}`);
      } else {
        setError(`Connection failed: ${result.message}`);
      }
    } catch (err) {
      setError('An error occurred while testing the connection');
      console.error(err);
    } finally {
      setIsTesting(null);
    }
  };

  // Connection form component
  const ConnectionForm = () => (
    <div className="space-y-4">
      <Input
        label="Connection Name"
        name="name"
        value={formValues.name}
        onChange={handleInputChange}
        required
        fullWidth
      />
      
      <Input
        label="Host"
        name="host"
        value={formValues.host}
        onChange={handleInputChange}
        required
        fullWidth
      />
      
      <Input
        label="Port"
        name="port"
        type="number"
        value={formValues.port.toString()}
        onChange={handleInputChange}
        required
        fullWidth
      />
      
      <Input
        label="Database"
        name="database"
        value={formValues.database}
        onChange={handleInputChange}
        required
        fullWidth
      />
      
      <Input
        label="User"
        name="user"
        value={formValues.user}
        onChange={handleInputChange}
        required
        fullWidth
      />
      
      <Input
        label="Password"
        name="password"
        type="password"
        value={formValues.password}
        onChange={handleInputChange}
        required={!editConnectionId} // Only required for new connections
        fullWidth
        helperText={editConnectionId ? "Leave blank to keep current password" : ""}
      />
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="ssl-connection"
          name="ssl"
          checked={formValues.ssl}
          onChange={handleInputChange}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label htmlFor="ssl-connection" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Use SSL connection
        </label>
      </div>
      
      <div className="pt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={handleCancelEdit}
          disabled={isLoading || isTesting !== null}
        >
          Cancel
        </Button>
        
        <Button
          variant="secondary"
          onClick={handleTestNewConnection}
          disabled={
            isLoading || 
            isTesting !== null || 
            !formValues.host || 
            !formValues.user || 
            !formValues.database || 
            (!editConnectionId && !formValues.password)
          }
        >
          {isTesting ? (
            <span className="flex items-center">
              <Spinner size="sm" className="mr-2" />
              Testing...
            </span>
          ) : 'Test Connection'}
        </Button>
        
        <Button
          variant="primary"
          onClick={editConnectionId ? handleUpdateConnection : handleSaveNewConnection}
          disabled={
            isLoading || 
            isTesting !== null || 
            !formValues.name || 
            !formValues.host || 
            !formValues.database || 
            !formValues.user || 
            (!editConnectionId && !formValues.password)
          }
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : editConnectionId ? 'Update' : 'Save'} Connection
        </Button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-700">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-700">
          {successMessage}
        </div>
      )}
    </div>
  );
  
  // New connection card
  const NewConnectionCard = () => (
    <Card
      title={showNewConnectionForm ? "New Connection" : undefined}
      className={showNewConnectionForm ? "" : "border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center p-6"}
    >
      {showNewConnectionForm ? (
        <ConnectionForm />
      ) : (
        <Button 
          variant="ghost" 
          className="w-full h-full flex flex-col items-center justify-center"
          leftIcon={<PlusIcon className="h-8 w-8 mb-2" />}
          onClick={() => {
            setShowNewConnectionForm(true);
            setError(null);
            setSuccessMessage(null);
          }}
          disabled={isLoading || isTesting !== null}
        >
          <span className="text-lg font-medium">New Connection</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">Configure a new database connection</span>
        </Button>
      )}
    </Card>
  );
  
  // Connection card component
  const ConnectionCard = ({ connection }: { connection: any }) => {
    const isActive = connection.id === activeConnectionId;
    const isEditing = connection.id === editConnectionId;
    
    return (
      <Card
        title={isEditing ? "Edit Connection" : connection.name}
        subtitle={isEditing ? "" : `${connection.host}:${connection.port}`}
        headerAction={
          isEditing ? null : (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          )
        }
      >
        {isEditing ? (
          <ConnectionForm />
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Host:</span>
                <span className="text-sm font-medium">{connection.host}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Port:</span>
                <span className="text-sm font-medium">{connection.port}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Database:</span>
                <span className="text-sm font-medium">{connection.database}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">User:</span>
                <span className="text-sm font-medium">{connection.user}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">SSL:</span>
                <span className="text-sm font-medium">{connection.ssl ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Last Used:</span>
                <span className="text-sm font-medium">
                  {connection.lastUsed 
                    ? new Date(connection.lastUsed).toLocaleString() 
                    : 'Never'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                leftIcon={<PencilIcon className="h-4 w-4" />}
                onClick={() => handleEditConnection(connection)}
                disabled={isCreating || isUpdating || isTesting}
              >
                Edit
              </Button>
              
              <Button 
                variant="danger" 
                size="sm"
                leftIcon={<TrashIcon className="h-4 w-4" />}
                onClick={() => handleDeleteConnection(connection.id)}
                disabled={isLoading || isTesting !== null}
              >
                Delete
              </Button>
              
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => handleTestConnection(connection)}
                disabled={isLoading || isTesting !== null}
              >
                {isTesting === connection.id ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Testing...
                  </span>
                ) : 'Test'}
              </Button>
              
              {!isActive && (
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => handleSetActiveConnection(connection.id)}
                  disabled={isLoading || isTesting !== null}
                >
                  Connect
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Database Connections</h1>
        <Button 
          variant="primary" 
          leftIcon={<PlusIcon className="h-5 w-5" />}
          onClick={() => {
            setShowNewConnectionForm(true);
            setError(null);
            setSuccessMessage(null);
          }}
          disabled={showNewConnectionForm || editConnectionId !== null || isLoading || isTesting !== null}
        >
          New Connection
        </Button>
      </div>
      
      {isLoading && (
        <div className="flex justify-center my-8">
          <Spinner size="lg" />
        </div>
      )}
      
      {!isLoading && error && !editConnectionId && !showNewConnectionForm && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-700">
          {error}
        </div>
      )}
      
      {!isLoading && successMessage && !editConnectionId && !showNewConnectionForm && (
        <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-700">
          {successMessage}
        </div>
      )}
      
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((connection) => (
            <ConnectionCard key={connection.id} connection={connection} />
          ))}
          
          <NewConnectionCard />
        </div>
      )}
    </div>
  );
};

export default DatabaseConnections;
