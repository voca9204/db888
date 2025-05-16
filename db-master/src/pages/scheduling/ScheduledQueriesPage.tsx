import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ScheduledQueryModel, 
  ScheduleFrequency,
  FirestoreScheduledQuery
} from '../../firebase/models/scheduling';
import {
  Clock,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { format } from 'date-fns';

const ScheduledQueriesPage: React.FC = () => {
  const [queries, setQueries] = useState<FirestoreScheduledQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScheduledQueries();
  }, []);

  const fetchScheduledQueries = async () => {
    try {
      setLoading(true);
      const fetchedQueries = await ScheduledQueryModel.listQueries();
      setQueries(fetchedQueries);
      setError(null);
    } catch (err) {
      console.error('Error fetching scheduled queries:', err);
      setError('Failed to load scheduled queries');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await ScheduledQueryModel.setActiveStatus(id, isActive);
      // 성공 메시지
      // 목록 새로고침
      fetchScheduledQueries();
    } catch (err) {
      console.error('Error toggling query status:', err);
      // 오류 메시지
    }
  };

  const formatSchedule = (query: FirestoreScheduledQuery) => {
    const { frequency, schedule } = query;
    
    switch (frequency) {
      case ScheduleFrequency.ONCE:
        return `Once at ${format(schedule.startTime.toDate(), 'PPp')}`;
      
      case ScheduleFrequency.HOURLY:
        return `Hourly at ${schedule.minute || 0} minute${schedule.minute !== 1 ? 's' : ''} past each hour`;
      
      case ScheduleFrequency.DAILY:
        const hour = schedule.hour || 0;
        const minute = schedule.minute || 0;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        
        return `Daily at ${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
      
      case ScheduleFrequency.WEEKLY:
        if (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0) {
          return 'Weekly (no days specified)';
        }
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const selectedDays = schedule.daysOfWeek.map(day => days[day]).join(', ');
        
        const hour2 = schedule.hour || 0;
        const minute2 = schedule.minute || 0;
        const ampm2 = hour2 >= 12 ? 'PM' : 'AM';
        const hour12_2 = hour2 % 12 || 12;
        
        return `Weekly on ${selectedDays} at ${hour12_2}:${minute2.toString().padStart(2, '0')} ${ampm2}`;
      
      case ScheduleFrequency.MONTHLY:
        const day = schedule.dayOfMonth || 1;
        const dayStr = getDayWithSuffix(day);
        
        const hour3 = schedule.hour || 0;
        const minute3 = schedule.minute || 0;
        const ampm3 = hour3 >= 12 ? 'PM' : 'AM';
        const hour12_3 = hour3 % 12 || 12;
        
        return `Monthly on the ${dayStr} at ${hour12_3}:${minute3.toString().padStart(2, '0')} ${ampm3}`;
      
      case ScheduleFrequency.CUSTOM:
        return `Custom (CRON: ${schedule.cronExpression || 'not specified'})`;
      
      default:
        return 'Unknown schedule';
    }
  };

  const getDayWithSuffix = (day: number) => {
    if (day >= 11 && day <= 13) {
      return `${day}th`;
    }
    
    switch (day % 10) {
      case 1:
        return `${day}st`;
      case 2:
        return `${day}nd`;
      case 3:
        return `${day}rd`;
      default:
        return `${day}th`;
    }
  };

  const getStatusIcon = (query: FirestoreScheduledQuery) => {
    if (!query.active) {
      return <XCircle className="w-5 h-5 text-gray-400" />;
    }
    
    if (!query.lastExecutionStatus) {
      return <Clock className="w-5 h-5 text-blue-500" />;
    }
    
    if (query.lastExecutionStatus === 'SUCCESS') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled Queries</h1>
        
        <Link to="/scheduled-queries/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Scheduled Query
          </Button>
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-4 rounded">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
        </div>
      ) : queries.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Scheduled Queries</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              You haven't created any scheduled queries yet.
            </p>
            <Link to="/scheduled-queries/new" className="mt-4 inline-flex items-center">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create a scheduled query
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {queries.map((query) => (
            <Card key={query.id} className="overflow-hidden">
              <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="mr-4">
                  {getStatusIcon(query)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{query.name}</h3>
                  {query.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{query.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Active</span>
                    <div 
                      className={`w-10 h-5 rounded-full p-0.5 cursor-pointer ${
                        query.active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      onClick={() => handleToggleActive(query.id, !query.active)}
                    >
                      <div 
                        className={`w-4 h-4 rounded-full bg-white transform duration-200 ${
                          query.active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      ></div>
                    </div>
                  </div>
                  <Link 
                    to={`/scheduled-queries/${query.id}`}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </Link>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatSchedule(query)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {query.lastExecutionAt ? (
                      <>
                        Last run: {format(query.lastExecutionAt.toDate(), 'PPp')}
                        {query.lastExecutionStatus && (
                          <span className={`ml-2 ${
                            query.lastExecutionStatus === 'SUCCESS' 
                              ? 'text-green-500 dark:text-green-400' 
                              : 'text-red-500 dark:text-red-400'
                          }`}>
                            {query.lastExecutionStatus}
                          </span>
                        )}
                      </>
                    ) : (
                      'Never run'
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduledQueriesPage;
