import { create } from 'zustand';
import { logger, persist } from '../middleware';
import type { UserPreferences, ThemeMode, FontSize, CodeEditorTheme, LayoutMode } from '../../types/store';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';

interface UserStore {
  preferences: UserPreferences;
  isLoading: boolean;
  hasSynced: boolean;
  
  // Basic preferences
  setTheme: (theme: ThemeMode) => void;
  setDefaultRowsPerPage: (rows: number) => void;
  setDateFormat: (format: string) => void;
  setTimeFormat: (format: string) => void;
  setShowSchemaDetails: (show: boolean) => void;
  setLanguage: (language: string) => void;
  
  // Notification preferences
  setNotifications: (notifications: Partial<UserPreferences['notifications']>) => void;
  
  // Display preferences
  setFontSize: (size: FontSize) => void;
  setCodeEditorTheme: (theme: CodeEditorTheme) => void;
  setTableLayout: (layout: LayoutMode) => void;
  setEnableAnimations: (enable: boolean) => void;
  setHighContrastMode: (enable: boolean) => void;
  setAutosaveInterval: (minutes: number) => void;
  
  // Query editor preferences
  setQueryEditorPreferences: (preferences: Partial<UserPreferences['queryEditor']>) => void;
  
  // Keyboard shortcuts
  setShortcut: (action: string, keys: string) => void;
  
  // Advanced functionality
  resetPreferences: () => void;
  syncPreferencesToFirestore: () => Promise<void>;
  loadPreferencesFromFirestore: () => Promise<void>;
  setAllPreferences: (preferences: Partial<UserPreferences>) => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  defaultRowsPerPage: 25,
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm:ss',
  showSchemaDetails: true,
  language: 'en',
  notifications: {
    email: true,
    inApp: true,
    queryResults: true,
    scheduled: true,
    activitySummary: false
  },
  display: {
    fontSize: 'medium',
    codeEditorTheme: 'dark',
    tableLayout: 'default',
    enableAnimations: true,
    highContrastMode: false,
    autosaveInterval: 5 // 5 minutes
  },
  queryEditor: {
    autoComplete: true,
    autoFormat: true,
    highlightSyntax: true,
    indentSize: 2,
    wordWrap: true,
    showLineNumbers: true
  },
  shortcuts: {
    'execute_query': 'Ctrl+Enter',
    'save': 'Ctrl+S',
    'format_query': 'Ctrl+Shift+F',
    'open_new_tab': 'Ctrl+T',
    'switch_theme': 'Ctrl+Shift+D',
  }
};

const useUserStore = create<UserStore>()(
  logger(
    persist(
      (set, get) => ({
        preferences: { ...defaultPreferences },
        isLoading: false,
        hasSynced: false,
        
        // Basic preferences
        setTheme: (theme) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              theme 
            } 
          })),
          
        setDefaultRowsPerPage: (defaultRowsPerPage) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              defaultRowsPerPage 
            } 
          })),
          
        setDateFormat: (dateFormat) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              dateFormat 
            } 
          })),
          
        setTimeFormat: (timeFormat) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              timeFormat 
            } 
          })),
          
        setShowSchemaDetails: (showSchemaDetails) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              showSchemaDetails 
            } 
          })),
          
        setLanguage: (language) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              language 
            } 
          })),
        
        // Notification preferences
        setNotifications: (notifications) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              notifications: {
                ...state.preferences.notifications,
                ...notifications
              }
            } 
          })),
        
        // Display preferences
        setFontSize: (fontSize) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              display: {
                ...state.preferences.display,
                fontSize
              }
            } 
          })),
        
        setCodeEditorTheme: (codeEditorTheme) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              display: {
                ...state.preferences.display,
                codeEditorTheme
              }
            } 
          })),
          
        setTableLayout: (tableLayout) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              display: {
                ...state.preferences.display,
                tableLayout
              }
            } 
          })),
          
        setEnableAnimations: (enableAnimations) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              display: {
                ...state.preferences.display,
                enableAnimations
              }
            } 
          })),
          
        setHighContrastMode: (highContrastMode) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              display: {
                ...state.preferences.display,
                highContrastMode
              }
            } 
          })),
          
        setAutosaveInterval: (autosaveInterval) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              display: {
                ...state.preferences.display,
                autosaveInterval
              }
            } 
          })),
        
        // Query editor preferences
        setQueryEditorPreferences: (queryEditorPrefs) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              queryEditor: {
                ...state.preferences.queryEditor,
                ...queryEditorPrefs
              }
            } 
          })),
        
        // Keyboard shortcuts
        setShortcut: (action, keys) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              shortcuts: {
                ...state.preferences.shortcuts,
                [action]: keys
              }
            } 
          })),
        
        // Reset all preferences to defaults
        resetPreferences: () => 
          set({ preferences: { ...defaultPreferences } }),
        
        // Sync preferences to Firestore
        syncPreferencesToFirestore: async () => {
          const currentUser = auth.currentUser;
          
          if (!currentUser) {
            console.warn('Cannot sync preferences to Firestore: User not authenticated');
            return;
          }
          
          set({ isLoading: true });
          
          try {
            const preferences = get().preferences;
            const preferencesRef = doc(db, 'userPreferences', currentUser.uid);
            
            await setDoc(preferencesRef, {
              preferences,
              userId: currentUser.uid,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
            
            set({ hasSynced: true, isLoading: false });
          } catch (error) {
            console.error('Error syncing preferences to Firestore:', error);
            set({ isLoading: false });
          }
        },
        
        // Load preferences from Firestore
        loadPreferencesFromFirestore: async () => {
          const currentUser = auth.currentUser;
          
          if (!currentUser) {
            console.warn('Cannot load preferences from Firestore: User not authenticated');
            return;
          }
          
          set({ isLoading: true });
          
          try {
            const preferencesRef = doc(db, 'userPreferences', currentUser.uid);
            const preferencesSnap = await getDoc(preferencesRef);
            
            if (preferencesSnap.exists()) {
              const data = preferencesSnap.data();
              
              if (data.preferences) {
                // Merge with defaults to ensure all properties exist
                const mergedPreferences = {
                  ...defaultPreferences,
                  ...data.preferences,
                  // Ensure nested objects are also merged with defaults
                  notifications: {
                    ...defaultPreferences.notifications,
                    ...(data.preferences.notifications || {})
                  },
                  display: {
                    ...defaultPreferences.display,
                    ...(data.preferences.display || {})
                  },
                  queryEditor: {
                    ...defaultPreferences.queryEditor,
                    ...(data.preferences.queryEditor || {})
                  },
                  shortcuts: {
                    ...defaultPreferences.shortcuts,
                    ...(data.preferences.shortcuts || {})
                  }
                };
                
                set({ 
                  preferences: mergedPreferences,
                  hasSynced: true
                });
              }
            }
            
            set({ isLoading: false });
          } catch (error) {
            console.error('Error loading preferences from Firestore:', error);
            set({ isLoading: false });
          }
        },
        
        // Set all preferences at once
        setAllPreferences: (newPreferences) => 
          set((state) => ({ 
            preferences: { 
              ...state.preferences, 
              ...newPreferences
            } 
          })),
      }),
      { name: 'user-preferences' }
    ),
    'userStore'
  )
);

export default useUserStore;
