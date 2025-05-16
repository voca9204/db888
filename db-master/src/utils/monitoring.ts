/**
 * 성능 모니터링 및 에러 추적 유틸리티
 * 
 * 이 모듈은 애플리케이션 성능 모니터링 및 에러 추적을 위한 유틸리티를 제공합니다.
 * Firebase Performance Monitoring과 Crashlytics를 활용합니다.
 */

import { getPerformance, trace } from 'firebase/performance';
import { logEvent } from 'firebase/analytics';
import { getAnalytics } from 'firebase/analytics';
import { app } from '../firebase/config';
import { IS_PROD, IS_DEV } from './environment';

// Firebase Performance 인스턴스 초기화
let performance: ReturnType<typeof getPerformance> | null = null;

// Firebase Analytics 인스턴스 초기화
let analytics: ReturnType<typeof getAnalytics> | null = null;

// 기존 트레이스 저장 객체
const activeTraces: Record<string, ReturnType<typeof trace>> = {};

/**
 * Firebase Performance 초기화
 */
export const initPerformance = () => {
  if (typeof window !== 'undefined' && !performance) {
    try {
      // 프로덕션 환경에서만 Performance Monitoring 사용
      if (IS_PROD) {
        const { getPerformance } = require('firebase/performance');
        performance = getPerformance(app);
        console.info('Firebase Performance initialized');
      }
    } catch (error) {
      console.error('Error initializing Firebase Performance:', error);
    }
  }
  return performance;
};

/**
 * Firebase Analytics 초기화
 */
export const initAnalytics = () => {
  if (typeof window !== 'undefined' && !analytics) {
    try {
      // 개발 환경이 아닌 경우에만 Analytics 사용
      if (!IS_DEV) {
        const { getAnalytics } = require('firebase/analytics');
        analytics = getAnalytics(app);
        console.info('Firebase Analytics initialized');
      }
    } catch (error) {
      console.error('Error initializing Firebase Analytics:', error);
    }
  }
  return analytics;
};

/**
 * 성능 트레이스 시작
 * @param traceName 트레이스 이름
 * @param attributes 트레이스 속성
 * @returns 트레이스 ID
 */
export const startTrace = (traceName: string, attributes?: Record<string, string>): string => {
  // 이미 시작된 트레이스가 있는지 확인
  if (activeTraces[traceName]) {
    console.warn(`Trace "${traceName}" is already active. Stopping previous trace.`);
    activeTraces[traceName].stop();
  }
  
  if (performance) {
    try {
      const newTrace = trace(performance, traceName);
      
      // 추가 속성 설정
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          newTrace.putAttribute(key, value);
        });
      }
      
      newTrace.start();
      activeTraces[traceName] = newTrace;
      
      return traceName;
    } catch (error) {
      console.error(`Error starting trace "${traceName}":`, error);
    }
  } else if (!IS_DEV) {
    // 개발 환경이 아닌데 Performance가 초기화되지 않은 경우 초기화 시도
    initPerformance();
  }
  
  // Performance가 사용 불가능한 경우 로깅만 수행
  console.info(`[Performance] Started trace: ${traceName}`);
  return traceName;
};

/**
 * 성능 트레이스 중단
 * @param traceId 트레이스 ID
 * @param metrics 트레이스 측정 항목
 */
export const stopTrace = (traceId: string, metrics?: Record<string, number>): void => {
  const activeTrace = activeTraces[traceId];
  
  if (activeTrace) {
    try {
      // 추가 측정 항목 설정
      if (metrics) {
        Object.entries(metrics).forEach(([key, value]) => {
          activeTrace.putMetric(key, value);
        });
      }
      
      activeTrace.stop();
      delete activeTraces[traceId];
    } catch (error) {
      console.error(`Error stopping trace "${traceId}":`, error);
    }
  } else {
    console.warn(`No active trace found for ID: ${traceId}`);
  }
};

/**
 * 이벤트 로깅
 * @param eventName 이벤트 이름
 * @param eventParams 이벤트 매개변수
 */
export const logAnalyticsEvent = (eventName: string, eventParams?: Record<string, any>): void => {
  if (analytics) {
    try {
      logEvent(analytics, eventName, eventParams);
    } catch (error) {
      console.error(`Error logging event "${eventName}":`, error);
    }
  } else if (!IS_DEV) {
    // 개발 환경이 아닌데 Analytics가 초기화되지 않은 경우 초기화 시도
    initAnalytics();
  }
};

/**
 * 에러 로깅
 * @param error 에러 객체
 * @param context 추가 컨텍스트
 */
export const logError = (error: Error, context?: Record<string, any>): void => {
  // 콘솔에 에러 출력
  console.error(`[Error] ${error.message}`, {
    name: error.name,
    stack: error.stack,
    context,
  });
  
  // Analytics에 에러 이벤트 로깅
  if (!IS_DEV) {
    logAnalyticsEvent('error', {
      error_name: error.name,
      error_message: error.message,
      ...context,
    });
  }
};

/**
 * 에러 경계 핸들러
 * React ErrorBoundary 컴포넌트에서 사용
 * @param error 에러 객체
 * @param componentStack 컴포넌트 스택
 */
export const handleErrorBoundary = (error: Error, componentStack: string): void => {
  logError(error, { componentStack });
};

/**
 * 전역 에러 핸들러 설정
 */
export const setupGlobalErrorHandlers = (): void => {
  if (typeof window !== 'undefined') {
    // 처리되지 않은 Promise 예외 처리
    window.addEventListener('unhandledrejection', (event) => {
      logError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'unhandledrejection' }
      );
    });
    
    // 전역 에러 처리
    window.addEventListener('error', (event) => {
      logError(
        event.error || new Error(event.message),
        {
          type: 'global',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      );
    });
  }
};
