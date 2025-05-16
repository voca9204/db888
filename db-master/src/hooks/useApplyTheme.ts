import React, { useEffect } from 'react';
import { useUserStore } from '../store';

/**
 * Apply theme from user preferences to document
 */
export const useApplyTheme = () => {
  const { preferences } = useUserStore();
  
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
};

export default useApplyTheme;
