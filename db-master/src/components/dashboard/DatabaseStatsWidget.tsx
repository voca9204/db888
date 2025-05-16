import React, { useState, useEffect } from 'react';
import { Card } from '../ui';
import {
  BarChart as BarChartIcon,
  Database,
  Table,
  FileText,
  Server,
  Share2
} from 'lucide-react';
import { useFirebase } from '../../context/FirebaseContext';
import useDbConnectionStore from '../../store/core/dbConnectionStore';
import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface Stats {
  connections: number;
  tables: number;
  queries: number;
  templates: number;
  sharedTemplates: number;
}

const DatabaseStatsWidget: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    connections: 0,
    tables: 0,
    queries: 0,
    templates: 0,
    sharedTemplates: 0
  });
  const [loading, setLoading] = useState(true);
  const { currentUser } = useFirebase();
  const connections = useDbConnectionStore(state => state.connections);
  
  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // 연결 수는 스토어에서 바로 가져옵니다
        const connectionsCount = connections.length;
        
        // 테이블 수는 모든 연결에서 스키마 정보를 가져와 합산합니다
        // 이는 실제로는 더 복잡한 로직이 필요할 수 있습니다
        let tableCount = 0;
        connections.forEach(connection => {
          // 임시로 각 연결당 평균 10개의 테이블이 있다고 가정합니다
          tableCount += 10;
        });
        
        // 쿼리 실행 횟수를 활동 로그에서 가져옵니다
        const queryLogRef = query(
          collection(db, 'activityLogs'),
          where('userId', '==', currentUser.uid),
          where('type', '==', 'QUERY_EXECUTION')
        );
        const queryCountSnapshot = await getCountFromServer(queryLogRef);
        const queriesCount = queryCountSnapshot.data().count;
        
        // 템플릿 수를 Firestore에서 가져옵니다
        const templatesRef = query(
          collection(db, 'queryTemplates'),
          where('createdBy', '==', currentUser.uid)
        );
        const templateCountSnapshot = await getCountFromServer(templatesRef);
        const templateCount = templateCountSnapshot.data().count;
        
        // 공유된 템플릿 수를 가져옵니다
        const sharedTemplatesRef = query(
          collection(db, 'queryTemplateShares'),
          where('ownerId', '==', currentUser.uid)
        );
        const sharedCountSnapshot = await getCountFromServer(sharedTemplatesRef);
        const sharedCount = sharedCountSnapshot.data().count;
        
        setStats({
          connections: connectionsCount,
          tables: tableCount,
          queries: queriesCount,
          templates: templateCount,
          sharedTemplates: sharedCount
        });
      } catch (error) {
        console.error('Error fetching database stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [user, connections]);
  
  const StatCard = ({ title, value, icon: Icon, color }: { 
    title: string, 
    value: number, 
    icon: React.ElementType,
    color: string
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-white">{loading ? '-' : value}</p>
      </div>
    </div>
  );
  
  return (
    <Card title="Database Statistics" className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <StatCard 
          title="Connections" 
          value={stats.connections} 
          icon={Server}
          color="bg-blue-500" 
        />
        <StatCard 
          title="Tables" 
          value={stats.tables} 
          icon={Table}
          color="bg-green-500" 
        />
        <StatCard 
          title="Queries Executed" 
          value={stats.queries} 
          icon={FileText}
          color="bg-purple-500" 
        />
        <StatCard 
          title="Templates" 
          value={stats.templates} 
          icon={Database}
          color="bg-amber-500" 
        />
        <StatCard 
          title="Shared Templates" 
          value={stats.sharedTemplates} 
          icon={Share2}
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Visualizations" 
          value={Math.floor(stats.queries * 0.3)} // 임의의 통계, 쿼리의 30%에 시각화가 생성됨
          icon={BarChartIcon}
          color="bg-rose-500" 
        />
      </div>
    </Card>
  );
};

export default DatabaseStatsWidget;
