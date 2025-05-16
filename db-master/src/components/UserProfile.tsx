import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, Button } from '../components/ui';
import { UserIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

const UserProfile: React.FC = () => {
  const { logout, isAdmin } = useAuth();
  const { userProfile } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  return (
    <Card className="w-full">
      <div className="flex items-center">
        <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-4">
          <UserIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {userProfile?.displayName || 'User'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {userProfile?.email}
          </p>
          <div className="mt-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
              {isAdmin ? 'Admin' : 'User'}
            </span>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={handleLogout}
          isLoading={isLoggingOut}
          leftIcon={<ArrowLeftOnRectangleIcon className="h-5 w-5" />}
        >
          Logout
        </Button>
      </div>
    </Card>
  );
};

export default UserProfile;
