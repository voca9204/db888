import React from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useUserStore } from '../store';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { preferences, setTheme } = useUserStore();
  const theme = preferences.theme;
  
  const handleClick = () => {
    // Cycle through themes: light -> dark -> system -> light
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };
  
  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
      aria-label={`Current theme: ${theme}. Click to switch theme.`}
      title={`Current theme: ${theme}`}
    >
      {theme === 'light' && <SunIcon className="h-5 w-5" />}
      {theme === 'dark' && <MoonIcon className="h-5 w-5" />}
      {theme === 'system' && <ComputerDesktopIcon className="h-5 w-5" />}
    </button>
  );
};

export default ThemeToggle;
