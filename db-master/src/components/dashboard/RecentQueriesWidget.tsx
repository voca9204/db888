import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui';
import useQueryStore from '../../store/core/queryStore';
import { FileText, Code } from 'lucide-react';

const RecentQueriesWidget: React.FC = () => {
  const { queryHistory, loadQueryFromHistory } = useQueryStore();
  
  // 최신 쿼리 5개만 표시
  const recentQueries = queryHistory.slice(0, 5);
  
  const handleLoadQuery = (id: string) => {
    loadQueryFromHistory(id);
  };
  
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    
    // 오늘 날짜인 경우 시간만 표시
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // 오늘이 아닌 경우 날짜와 시간 모두 표시
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
           ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Card title="Recent Queries" className="h-full">
      {recentQueries.length === 0 ? (
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">
          <Code className="mx-auto h-12 w-12 mb-2 text-gray-400 dark:text-gray-500" />
          <p>No queries executed yet.</p>
          <Link 
            to="/query-builder" 
            className="text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
          >
            Create a query
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentQueries.map((query) => (
            <li key={query.id} className="py-3">
              <Link 
                to="/query-builder" 
                onClick={() => handleLoadQuery(query.id)}
                className="flex items-start hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-md"
              >
                <div className="flex-shrink-0 pt-1">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {query.name || 'Unnamed query'}
                  </p>
                  <pre className="text-xs text-gray-600 dark:text-gray-300 font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded mt-1 overflow-hidden line-clamp-2">
                    {query.sql.substring(0, 150)}{query.sql.length > 150 ? '...' : ''}
                  </pre>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                  {formatTimestamp(query.timestamp)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-2">
        <Link
          to="/query-builder"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Query Builder
        </Link>
      </div>
    </Card>
  );
};

export default RecentQueriesWidget;
