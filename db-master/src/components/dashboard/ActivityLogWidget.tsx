import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { ActivityLog, ActivityType, ActivityStatus } from '../../types/ActivityLog';
import { activityLogService } from '../../services/activityLogService';
import { useFirebase } from '../../context/FirebaseContext';

const ActivityLogWidget: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userProfile } = useFirebase();
  const isAdmin = userProfile?.role === 'admin';
  
  useEffect(() => {
    const fetchActivityLogs = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const recentLogs = await activityLogService.getActivityLogs({
          userId: currentUser.uid,
        }, 5);
        
        setLogs(recentLogs);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivityLogs();
  }, [user]);
  
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    // If less than a day, show relative time
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      
      if (hours === 0) {
        const minutes = Math.floor(diff / (60 * 1000));
        return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
      }
      
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    // Otherwise show the date
    return timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.QUERY_EXECUTION:
        return <div className="w-2 h-2 rounded-full bg-blue-500"></div>;
      case ActivityType.DB_CONNECTION:
        return <div className="w-2 h-2 rounded-full bg-purple-500"></div>;
      case ActivityType.USER_LOGIN:
      case ActivityType.USER_LOGOUT:
        return <div className="w-2 h-2 rounded-full bg-green-500"></div>;
      case ActivityType.SETTINGS_CHANGE:
        return <div className="w-2 h-2 rounded-full bg-gray-500"></div>;
      case ActivityType.TEMPLATE_CREATION:
      case ActivityType.TEMPLATE_MODIFICATION:
      case ActivityType.TEMPLATE_SHARING:
        return <div className="w-2 h-2 rounded-full bg-indigo-500"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-500"></div>;
    }
  };
  
  return (
    <Card title="Recent Activity" className="h-full">
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-t-blue-600 border-blue-300 rounded-full animate-spin"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">
          <ClipboardList className="mx-auto h-12 w-12 mb-2 text-gray-400 dark:text-gray-500" />
          <p>No activity recorded yet.</p>
          <p className="text-sm mt-1">
            Your recent actions will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {logs.map((log) => (
            <li key={log.id} className="py-3">
              <div className="flex items-start p-2">
                <div className="flex-shrink-0 pt-1">
                  {getActivityIcon(log.type)}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.type.replace(/_/g, ' ')}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {log.details.action}
                    {log.details.target && `: ${log.details.target}`}
                  </p>
                  {log.status === ActivityStatus.FAILURE && log.details.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Error: {log.details.error}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {isAdmin && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-2">
          <Link
            to="/activity-logs"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
          >
            View all activity <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      )}
    </Card>
  );
};

export default ActivityLogWidget;
