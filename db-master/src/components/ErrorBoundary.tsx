import React, { Component, ErrorInfo, ReactNode } from 'react';
import { handleErrorBoundary } from '../utils/monitoring';
import { IS_DEV } from '../utils/environment';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 에러 로깅
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // 모니터링 시스템에 에러 보고
    handleErrorBoundary(error, errorInfo.componentStack);
    
    this.setState({ errorInfo });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 사용자 정의 fallback UI가 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg border border-red-300 dark:border-red-800 max-w-3xl mx-auto my-8 shadow-md">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            애플리케이션 오류 발생
          </h2>
          
          <p className="mb-4">
            죄송합니다. 애플리케이션에서 오류가 발생했습니다. 이 문제는 자동으로 보고되었습니다.
          </p>
          
          <div className="flex gap-4 mb-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              페이지 새로고침
            </button>
            
            <button 
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              홈으로 이동
            </button>
          </div>
          
          {/* 개발 환경에서만 상세 오류 정보 표시 */}
          {IS_DEV && (
            <details className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700">
              <summary className="font-semibold cursor-pointer">상세 오류 정보 (개발 환경만 표시)</summary>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded overflow-auto">
                <p className="text-sm font-mono mb-2">{this.state.error?.toString()}</p>
                <pre className="text-xs font-mono whitespace-pre-wrap text-red-600 dark:text-red-400">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
