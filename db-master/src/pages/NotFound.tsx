import React from 'react';
import { Card, Button } from '../components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full text-center p-8">
        <div className="space-y-6">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Page Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button 
            variant="primary" 
            leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
