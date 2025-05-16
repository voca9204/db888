import React, { useEffect } from 'react';
import './App.css';
import AppRouter from './router';
import useApplyTheme from './hooks/useApplyTheme';
import ErrorBoundary from './components/ErrorBoundary';
import { initPerformance, initAnalytics, setupGlobalErrorHandlers } from './utils/monitoring';
import { IS_DEV } from './utils/environment';

function App() {
  // Apply theme from user preferences
  useApplyTheme();
  
  // Initialize performance monitoring and error tracking
  useEffect(() => {
    // 개발 환경이 아닌 경우에만 성능 모니터링 초기화
    if (!IS_DEV) {
      // Firebase Performance 초기화
      initPerformance();
      
      // Firebase Analytics 초기화
      initAnalytics();
      
      // 전역 에러 핸들러 설정
      setupGlobalErrorHandlers();
    }
  }, []);
  
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}

export default App;
