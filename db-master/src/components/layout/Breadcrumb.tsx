import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  name: string;
  path: string;
  current: boolean;
}

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  
  // Skip breadcrumb on home and login pages
  if (location.pathname === '/' || location.pathname === '/login') {
    return null;
  }
  
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', path: '/', current: pathnames.length === 0 },
  ];
  
  // Build breadcrumb items based on current path
  if (pathnames.length > 0) {
    pathnames.forEach((value, index) => {
      const route = `/${pathnames.slice(0, index + 1).join('/')}`;
      
      // Format the breadcrumb name
      let name = value.charAt(0).toUpperCase() + value.slice(1);
      name = name.replace(/-/g, ' '); // Replace hyphens with spaces
      
      breadcrumbs.push({
        name,
        path: route,
        current: index === pathnames.length - 1
      });
    });
  }
  
  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.path}>
            <div className="flex items-center">
              {index !== 0 && (
                <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-1" aria-hidden="true" />
              )}
              
              {breadcrumb.current ? (
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {breadcrumb.name}
                </span>
              ) : (
                <Link
                  to={breadcrumb.path}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
                >
                  {index === 0 && (
                    <HomeIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                  )}
                  {breadcrumb.name}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
