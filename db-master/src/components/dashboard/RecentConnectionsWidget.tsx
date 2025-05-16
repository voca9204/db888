import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui';
import useDbConnectionStore from '../../store/core/dbConnectionStore';
import { Database, Server } from 'lucide-react';

const RecentConnectionsWidget: React.FC = () => {
  const { connections, setActiveConnection } = useDbConnectionStore();
  
  // 마지막 수정일 기준으로 내림차순 정렬하여 최근 5개만 표시
  const recentConnections = [...connections]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);
  
  const handleSelectConnection = (id: string) => {
    setActiveConnection(id);
  };
  
  return (
    <Card title="Recent Connections" className="h-full">
      {recentConnections.length === 0 ? (
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">
          <Server className="mx-auto h-12 w-12 mb-2 text-gray-400 dark:text-gray-500" />
          <p>No connections yet.</p>
          <Link 
            to="/connections" 
            className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
          >
            Add a connection
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentConnections.map((connection) => (
            <li key={connection.id} className="py-3">
              <Link 
                to="/connections" 
                onClick={() => handleSelectConnection(connection.id)}
                className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-md"
              >
                <div className="flex-shrink-0">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {connection.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {connection.host}:{connection.port} ({connection.database})
                  </p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(connection.updatedAt).toLocaleDateString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-2">
        <Link
          to="/connections"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all connections
        </Link>
      </div>
    </Card>
  );
};

export default RecentConnectionsWidget;
