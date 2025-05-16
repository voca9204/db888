import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui';
import {
  PlusCircle,
  Search,
  Database,
  BarChart2,
  Settings,
  FileText,
  FolderPlus,
  Share2
} from 'lucide-react';

const QuickActionsWidget: React.FC = () => {
  const actions = [
    {
      title: 'New Connection',
      description: 'Connect to a database',
      icon: <PlusCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      link: '/connections/new',
      color: 'bg-blue-100 dark:bg-blue-950'
    },
    {
      title: 'Browse Tables',
      description: 'Browse database tables',
      icon: <Database className="h-6 w-6 text-green-600 dark:text-green-400" />,
      link: '/tables',
      color: 'bg-green-100 dark:bg-green-950'
    },
    {
      title: 'Run Query',
      description: 'Execute SQL queries',
      icon: <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />,
      link: '/query-builder',
      color: 'bg-purple-100 dark:bg-purple-950'
    },
    {
      title: 'Create Template',
      description: 'Save a query template',
      icon: <FolderPlus className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      link: '/query-templates/new',
      color: 'bg-amber-100 dark:bg-amber-950'
    },
    {
      title: 'Visualize Data',
      description: 'Create data visualizations',
      icon: <BarChart2 className="h-6 w-6 text-rose-600 dark:text-rose-400" />,
      link: '/query-results',
      color: 'bg-rose-100 dark:bg-rose-950'
    },
    {
      title: 'App Settings',
      description: 'Configure your preferences',
      icon: <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />,
      link: '/settings',
      color: 'bg-gray-100 dark:bg-gray-800'
    }
  ];

  return (
    <Card title="Quick Actions" className="h-full">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className={`p-4 rounded-lg ${action.color} hover:shadow-md transition-shadow flex flex-col items-center text-center`}
          >
            <div className="mb-2">
              {action.icon}
            </div>
            <h3 className="font-medium text-sm text-gray-900 dark:text-white">
              {action.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </Card>
  );
};

export default QuickActionsWidget;
