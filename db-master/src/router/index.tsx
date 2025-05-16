import React, { Suspense, lazy } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import Login from '../pages/Login';

// Lazy load page components for better performance
const Dashboard = lazy(() => import('../pages/Dashboard'));
const DatabaseConnections = lazy(() => import('../pages/DatabaseConnections'));
const SchemaViewer = lazy(() => import('../pages/SchemaViewer'));
const TableBrowser = lazy(() => import('../pages/TableBrowser'));
const QueryBuilder = lazy(() => import('../pages/QueryBuilder'));
const QueryTemplates = lazy(() => import('../pages/QueryTemplates'));
const QueryResults = lazy(() => import('../pages/QueryResults'));
const Settings = lazy(() => import('../pages/Settings'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Scheduled queries pages
const ScheduledQueriesPage = lazy(() => import('../pages/scheduling/ScheduledQueriesPage'));
const ScheduledQueryForm = lazy(() => import('../pages/scheduling/ScheduledQueryForm'));

// Loading component for suspense fallback
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
  </div>
);

// For development, using mock authentication
const isAuthenticated = true;

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes - using mock authentication for now */}
          <Route 
            path="/" 
            element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            } 
          />
          
          <Route 
            path="/database" 
            element={
              <MainLayout>
                <DatabaseConnections />
              </MainLayout>
            } 
          />
          
          <Route 
            path="/schema" 
            element={
              <MainLayout>
                <SchemaViewer />
              </MainLayout>
            } 
          />
          
          <Route 
            path="/tables" 
            element={
              <MainLayout>
                <TableBrowser />
              </MainLayout>
            } 
          />
          
          <Route 
            path="/query-builder" 
            element={
              <MainLayout>
                <QueryBuilder />
              </MainLayout>
            } 
          />
          
          <Route 
            path="/templates" 
            element={
              <MainLayout>
                <QueryTemplates />
              </MainLayout>
            } 
          />
          
          <Route 
            path="/results" 
            element={
              <MainLayout>
                <QueryResults />
              </MainLayout>
            } 
          />
          
          <Route 
            path="/settings" 
            element={
              <MainLayout>
                <Settings />
              </MainLayout>
            } 
          />
          
          {/* Scheduled Queries Routes */}
          <Route 
            path="/scheduled-queries" 
            element={
              <MainLayout>
                <ScheduledQueriesPage />
              </MainLayout>
            } 
          />
          
          <Route 
            path="/scheduled-queries/new" 
            element={
              <MainLayout>
                <ScheduledQueryForm />
              </MainLayout>
            } 
          />
          
          <Route 
            path="/scheduled-queries/:id" 
            element={
              <MainLayout>
                <ScheduledQueryForm />
              </MainLayout>
            } 
          />
          
          {/* 404 Not Found route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
