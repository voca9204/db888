import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  ServerIcon, 
  TableCellsIcon, 
  CommandLineIcon, 
  DocumentDuplicateIcon, 
  DocumentTextIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import ThemeToggle from '../ThemeToggle';

const Sidebar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', path: '/', icon: HomeIcon },
    { name: 'Database Connections', path: '/database', icon: ServerIcon },
    { name: 'Schema Viewer', path: '/schema', icon: TableCellsIcon },
    { name: 'Table Browser', path: '/tables', icon: TableCellsIcon },
    { name: 'Query Builder', path: '/query-builder', icon: CommandLineIcon },
    { name: 'Query Templates', path: '/templates', icon: DocumentDuplicateIcon },
    { name: 'Scheduled Queries', path: '/scheduled-queries', icon: ClockIcon },
    { name: 'Query Results', path: '/results', icon: DocumentTextIcon },
    { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
  ];
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>
      
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}
      
      {/* Sidebar for mobile */}
      <div 
        className={`md:hidden fixed inset-y-0 left-0 w-64 bg-white dark:bg-dark-800 shadow-lg transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-dark-700">
          <h1 className="text-xl font-bold text-primary-600">DB Master</h1>
          <ThemeToggle />
        </div>
        
        <nav className="mt-5 px-2">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                  }`
                }
                onClick={closeMobileMenu}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                    location.pathname === item.path
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
      
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-dark-700">
            <h1 className="text-xl font-bold text-primary-600">DB Master</h1>
            <ThemeToggle />
          </div>
          
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 mt-5 px-2">
              <div className="space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                      }`
                    }
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                        location.pathname === item.path
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
