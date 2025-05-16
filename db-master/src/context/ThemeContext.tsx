import React, { createContext, useContext, useEffect } from 'react';
import { useUserStore } from '../store';

// Create Context for Theme (for backward compatibility)
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { preferences, setTheme } = useUserStore();
  
  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = preferences.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };
  
  // Apply theme to document
  useEffect(() => {
    const { theme } = preferences;
    
    document.documentElement.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      document.documentElement.classList.add(systemTheme);
    } else {
      document.documentElement.classList.add(theme);
    }
    
    // Listen for system theme changes if using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [preferences.theme]);
  
  // Create context value
  const value: ThemeContextType = {
    theme: preferences.theme,
    toggleTheme,
    setTheme,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook for using theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};
