import React, { useEffect, useState } from 'react';
import {
  RecentConnectionsWidget,
  RecentQueriesWidget,
  SavedTemplatesWidget,
  ActivityLogWidget,
  DatabaseStatsWidget,
  QuickActionsWidget
} from '../components/dashboard';
import { useFirebase } from '../context/FirebaseContext';
import { GridLayout, GridItem, GridSection } from '../components/ui/GridLayout';

const Dashboard: React.FC = () => {
  const [greeting, setGreeting] = useState<string>('');
  const { currentUser } = useFirebase();
  
  useEffect(() => {
    // 시간에 따른 인사말 설정
    const hour = new Date().getHours();
    let newGreeting = '';
    
    if (hour < 12) {
      newGreeting = 'Good morning';
    } else if (hour < 18) {
      newGreeting = 'Good afternoon';
    } else {
      newGreeting = 'Good evening';
    }
    
    setGreeting(newGreeting);
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting}, {currentUser?.displayName || 'User'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Welcome back to DB Master. Here's an overview of your database activities.
          </p>
        </div>
      </div>
      
      <GridLayout>
        <GridSection>
          <GridItem colSpan={12}>
            <QuickActionsWidget />
          </GridItem>
        </GridSection>
        
        <GridSection>
          <GridItem colSpan={4}>
            <RecentConnectionsWidget />
          </GridItem>
          <GridItem colSpan={8}>
            <RecentQueriesWidget />
          </GridItem>
        </GridSection>
        
        <GridSection>
          <GridItem colSpan={12}>
            <DatabaseStatsWidget />
          </GridItem>
        </GridSection>
        
        <GridSection>
          <GridItem colSpan={6}>
            <SavedTemplatesWidget />
          </GridItem>
          <GridItem colSpan={6}>
            <ActivityLogWidget />
          </GridItem>
        </GridSection>
      </GridLayout>
    </div>
  );
};

export default Dashboard;
