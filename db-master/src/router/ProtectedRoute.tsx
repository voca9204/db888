import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false
}) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();
  
  // Show loading indicator while authentication state is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If admin is required but user is not admin, redirect to dashboard
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  // Otherwise, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
