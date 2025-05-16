import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Button, Tabs, Tab, Switch, Spinner } from '../components/ui';
import { useUserStore } from '../store';
import { useAuth } from '../hooks/useAuth';
import { Toast } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const { 
    preferences, 
    isLoading, 
    hasSynced,
    setTheme,
    setDefaultRowsPerPage,
    setDateFormat,
    setTimeFormat,
    setLanguage,
    setNotifications,
    setFontSize,
    setCodeEditorTheme,
    setTableLayout,
    setEnableAnimations,
    setHighContrastMode,
    setAutosaveInterval,
    setQueryEditorPreferences,
    setShowSchemaDetails,
    setShortcut,
    resetPreferences,
    syncPreferencesToFirestore,
    loadPreferencesFromFirestore,
    setAllPreferences
  } = useUserStore();
  
  const [formValues, setFormValues] = useState({ ...preferences });
  const [activeTab, setActiveTab] = useState('general');
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  
  // Load preferences from Firestore on component mount
  useEffect(() => {
    if (user && !hasSynced && !isLoading) {
      loadPreferencesFromFirestore();
    }
  }, [user, hasSynced, isLoading, loadPreferencesFromFirestore]);
  
  // Update form values when preferences change
  useEffect(() => {
    setFormValues({ ...preferences });
  }, [preferences]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/settings' } });
    }
  }, [authLoading, user, navigate]);
  
  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
    
    // Auto-close toast after 3 seconds
    setTimeout(() => {
      setToastOpen(false);
    }, 3000);
  };
  
  // Handle form input changes
  const handleInputChange = <T extends keyof typeof formValues>(
    field: T, 
    value: typeof formValues[T]
  ) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle notification toggle
  const handleNotificationChange = (key: keyof typeof preferences.notifications) => {
    setFormValues(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };
  
  // Handle display settings changes
  const handleDisplayChange = <T extends keyof typeof preferences.display>(
    field: T, 
    value: typeof preferences.display[T]
  ) => {
    setFormValues(prev => ({
      ...prev,
      display: {
        ...prev.display,
        [field]: value,
      },
    }));
  };
  
  // Handle query editor settings changes
  const handleQueryEditorChange = <T extends keyof typeof preferences.queryEditor>(
    field: T, 
    value: typeof preferences.queryEditor[T]
  ) => {
    setFormValues(prev => ({
      ...prev,
      queryEditor: {
        ...prev.queryEditor,
        [field]: value,
      },
    }));
  };
  
  // Handle shortcut changes
  const handleShortcutChange = (action: string, keys: string) => {
    setFormValues(prev => ({
      ...prev,
      shortcuts: {
        ...prev.shortcuts,
        [action]: keys,
      },
    }));
  };
  
  // Save all preferences
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update all settings at once
    setAllPreferences(formValues);
    
    // Sync to Firestore
    if (user) {
      try {
        await syncPreferencesToFirestore();
        showToast('Settings saved successfully!', 'success');
      } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Error saving settings. Please try again.', 'error');
      }
    } else {
      showToast('Settings saved locally. Log in to sync to the cloud.', 'info');
    }
  };
  
  // Reset preferences to default
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      resetPreferences();
      showToast('Settings reset to defaults', 'info');
    }
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            color="gray" 
            onClick={handleReset}
            title="Reset all settings to defaults"
          >
            Reset All
          </Button>
          
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            title="Save all settings"
          >
            Save Settings
          </Button>
        </div>
      </div>
      
      <Card>
        <Tabs activeTab={activeTab} onChange={setActiveTab}>
          <Tab id="general" title="General" />
          <Tab id="appearance" title="Appearance" />
          <Tab id="editor" title="Query Editor" />
          <Tab id="notifications" title="Notifications" />
          <Tab id="shortcuts" title="Shortcuts" />
          <Tab id="account" title="Account" />
        </Tabs>
        
        <div className="mt-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">General Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Select
                    label="Language"
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'ko', label: '한국어' },
                      { value: 'ja', label: '日本語' },
                      { value: 'zh', label: '中文' },
                      { value: 'es', label: 'Español' },
                      { value: 'fr', label: 'Français' },
                      { value: 'de', label: 'Deutsch' },
                    ]}
                    value={formValues.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Application language (requires reload)
                  </p>
                </div>
                
                <div>
                  <Select
                    label="Date Format"
                    options={[
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                      { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD' },
                      { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
                    ]}
                    value={formValues.dateFormat}
                    onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                  />
                </div>
                
                <div>
                  <Select
                    label="Time Format"
                    options={[
                      { value: 'HH:mm:ss', label: '24-hour (HH:mm:ss)' },
                      { value: 'hh:mm:ss A', label: '12-hour (hh:mm:ss AM/PM)' },
                      { value: 'HH:mm', label: '24-hour (HH:mm)' },
                      { value: 'hh:mm A', label: '12-hour (hh:mm AM/PM)' },
                    ]}
                    value={formValues.timeFormat}
                    onChange={(e) => handleInputChange('timeFormat', e.target.value)}
                  />
                </div>
                
                <div>
                  <Input
                    type="number"
                    label="Rows Per Page"
                    value={formValues.defaultRowsPerPage.toString()}
                    onChange={(e) => handleInputChange('defaultRowsPerPage', parseInt(e.target.value, 10))}
                    min={5}
                    max={100}
                    helperText="Default number of rows to display in result tables"
                  />
                </div>
                
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-schema-details"
                      checked={formValues.showSchemaDetails}
                      onChange={(e) => handleInputChange('showSchemaDetails', e.target.checked)}
                    />
                    <label htmlFor="show-schema-details" className="text-sm text-gray-700 dark:text-gray-300">
                      Show schema details by default
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    When enabled, detailed column information will be shown in the schema viewer
                  </p>
                </div>
                
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-save"
                      checked={formValues.display.autosaveInterval > 0}
                      onChange={(e) => handleDisplayChange('autosaveInterval', e.target.checked ? 5 : 0)}
                    />
                    <label htmlFor="auto-save" className="text-sm text-gray-700 dark:text-gray-300">
                      Enable auto-save
                    </label>
                  </div>
                  
                  {formValues.display.autosaveInterval > 0 && (
                    <div className="mt-2">
                      <Input
                        type="number"
                        label="Auto-save interval (minutes)"
                        value={formValues.display.autosaveInterval.toString()}
                        onChange={(e) => handleDisplayChange('autosaveInterval', parseInt(e.target.value, 10))}
                        min={1}
                        max={60}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Appearance Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Select
                    label="Theme"
                    options={[
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                      { value: 'system', label: 'System Default' },
                    ]}
                    value={formValues.theme}
                    onChange={(e) => handleInputChange('theme', e.target.value as 'light' | 'dark' | 'system')}
                  />
                </div>
                
                <div>
                  <Select
                    label="Font Size"
                    options={[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' },
                    ]}
                    value={formValues.display.fontSize}
                    onChange={(e) => handleDisplayChange('fontSize', e.target.value as 'small' | 'medium' | 'large')}
                  />
                </div>
                
                <div>
                  <Select
                    label="Code Editor Theme"
                    options={[
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                      { value: 'dracula', label: 'Dracula' },
                      { value: 'github', label: 'GitHub' },
                      { value: 'monokai', label: 'Monokai' },
                    ]}
                    value={formValues.display.codeEditorTheme}
                    onChange={(e) => handleDisplayChange('codeEditorTheme', e.target.value as 'light' | 'dark' | 'dracula' | 'github' | 'monokai')}
                  />
                </div>
                
                <div>
                  <Select
                    label="Table Layout"
                    options={[
                      { value: 'default', label: 'Default' },
                      { value: 'compact', label: 'Compact' },
                      { value: 'comfortable', label: 'Comfortable' },
                    ]}
                    value={formValues.display.tableLayout}
                    onChange={(e) => handleDisplayChange('tableLayout', e.target.value as 'default' | 'compact' | 'comfortable')}
                  />
                </div>
                
                <div className="col-span-1 md:col-span-2 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-animations"
                      checked={formValues.display.enableAnimations}
                      onChange={(e) => handleDisplayChange('enableAnimations', e.target.checked)}
                    />
                    <label htmlFor="enable-animations" className="text-sm text-gray-700 dark:text-gray-300">
                      Enable animations
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="high-contrast"
                      checked={formValues.display.highContrastMode}
                      onChange={(e) => handleDisplayChange('highContrastMode', e.target.checked)}
                    />
                    <label htmlFor="high-contrast" className="text-sm text-gray-700 dark:text-gray-300">
                      High contrast mode
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Query Editor Settings */}
          {activeTab === 'editor' && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Query Editor Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-complete"
                      checked={formValues.queryEditor.autoComplete}
                      onChange={(e) => handleQueryEditorChange('autoComplete', e.target.checked)}
                    />
                    <label htmlFor="auto-complete" className="text-sm text-gray-700 dark:text-gray-300">
                      Enable auto-complete
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-format"
                      checked={formValues.queryEditor.autoFormat}
                      onChange={(e) => handleQueryEditorChange('autoFormat', e.target.checked)}
                    />
                    <label htmlFor="auto-format" className="text-sm text-gray-700 dark:text-gray-300">
                      Auto-format queries
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="highlight-syntax"
                      checked={formValues.queryEditor.highlightSyntax}
                      onChange={(e) => handleQueryEditorChange('highlightSyntax', e.target.checked)}
                    />
                    <label htmlFor="highlight-syntax" className="text-sm text-gray-700 dark:text-gray-300">
                      Syntax highlighting
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="word-wrap"
                      checked={formValues.queryEditor.wordWrap}
                      onChange={(e) => handleQueryEditorChange('wordWrap', e.target.checked)}
                    />
                    <label htmlFor="word-wrap" className="text-sm text-gray-700 dark:text-gray-300">
                      Word wrap
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="line-numbers"
                      checked={formValues.queryEditor.showLineNumbers}
                      onChange={(e) => handleQueryEditorChange('showLineNumbers', e.target.checked)}
                    />
                    <label htmlFor="line-numbers" className="text-sm text-gray-700 dark:text-gray-300">
                      Show line numbers
                    </label>
                  </div>
                </div>
                
                <div>
                  <Input
                    type="number"
                    label="Indent Size"
                    value={formValues.queryEditor.indentSize.toString()}
                    onChange={(e) => handleQueryEditorChange('indentSize', parseInt(e.target.value, 10))}
                    min={1}
                    max={8}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notification Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email-notifications"
                    checked={formValues.notifications.email}
                    onChange={() => handleNotificationChange('email')}
                  />
                  <label htmlFor="email-notifications" className="text-sm text-gray-700 dark:text-gray-300">
                    Email notifications
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="inapp-notifications"
                    checked={formValues.notifications.inApp}
                    onChange={() => handleNotificationChange('inApp')}
                  />
                  <label htmlFor="inapp-notifications" className="text-sm text-gray-700 dark:text-gray-300">
                    In-app notifications
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="queryresults-notifications"
                    checked={formValues.notifications.queryResults}
                    onChange={() => handleNotificationChange('queryResults')}
                  />
                  <label htmlFor="queryresults-notifications" className="text-sm text-gray-700 dark:text-gray-300">
                    Query results notifications
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="scheduled-notifications"
                    checked={formValues.notifications.scheduled}
                    onChange={() => handleNotificationChange('scheduled')}
                  />
                  <label htmlFor="scheduled-notifications" className="text-sm text-gray-700 dark:text-gray-300">
                    Scheduled query notifications
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="activity-notifications"
                    checked={formValues.notifications.activitySummary}
                    onChange={() => handleNotificationChange('activitySummary')}
                  />
                  <label htmlFor="activity-notifications" className="text-sm text-gray-700 dark:text-gray-300">
                    Activity summary (weekly digest)
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Keyboard Shortcuts */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Action</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Shortcut</div>
                </div>
                
                {Object.entries(formValues.shortcuts).map(([action, keys]) => (
                  <div key={action} className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b pb-2 border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div>
                      <Input
                        type="text"
                        value={keys}
                        onChange={(e) => handleShortcutChange(action, e.target.value)}
                        placeholder="e.g. Ctrl+S"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                <p>Enter key combinations using the format <code>Ctrl+S</code>, <code>Shift+Alt+F</code>, etc.</p>
                <p>Available modifiers: <code>Ctrl</code>, <code>Alt</code>, <code>Shift</code>, <code>Meta</code> (Command key on Mac)</p>
              </div>
            </div>
          )}
          
          {/* Account Settings */}
          {activeTab === 'account' && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Account Settings</h2>
              
              {user ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="Display Name"
                        value={user.displayName || ''}
                        onChange={() => {}}
                        disabled
                        helperText="Display name is managed through Firebase Authentication"
                      />
                    </div>
                    
                    <div>
                      <Input
                        type="email"
                        label="Email Address"
                        value={user.email || ''}
                        onChange={() => {}}
                        disabled
                        helperText="Email is managed through Firebase Authentication"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 p-4 rounded">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Account Management</h3>
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      Account settings such as password, email, and profile information are managed through Firebase Authentication.
                      To change these settings, please use the Firebase Authentication portal.
                    </p>
                  </div>
                  
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Data Synchronization</h3>
                    
                    <div className="flex items-start space-x-2 mb-3">
                      <div className={`h-4 w-4 mt-0.5 rounded-full ${hasSynced ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {hasSynced ? 
                          'Your settings are synced to the cloud' : 
                          'Your settings are not synced to the cloud yet'}
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleReset}
                      >
                        Reset All Settings
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="primary" 
                        onClick={async () => {
                          try {
                            await syncPreferencesToFirestore();
                            showToast('Settings synced successfully!', 'success');
                          } catch (error) {
                            showToast('Error syncing settings', 'error');
                          }
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? <Spinner size="sm" /> : 'Sync Settings Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 p-4 rounded">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Not Logged In</h3>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    Please log in to manage your account settings and sync your preferences across devices.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-2"
                    onClick={() => navigate('/login', { state: { from: '/settings' } })}
                  >
                    Log In
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
      
      {/* Toast notification */}
      <Toast 
        open={toastOpen} 
        message={toastMessage} 
        type={toastType} 
        onClose={() => setToastOpen(false)} 
      />
    </div>
  );
};

export default Settings;