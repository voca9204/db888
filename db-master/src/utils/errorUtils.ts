/**
 * Error handling utility functions
 */

import { FirebaseError } from 'firebase/app';
import { ErrorInfo } from 'react';

// Error code mappings for user-friendly messages
const errorMessages: Record<string, string> = {
  // Firebase Auth errors
  'auth/user-not-found': '사용자를 찾을 수 없습니다. 이메일을 확인해주세요.',
  'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
  'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
  'auth/weak-password': '비밀번호는 최소 6자 이상이어야 합니다.',
  'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
  'auth/requires-recent-login': '보안을 위해 재로그인이 필요합니다.',
  
  // Firebase Firestore errors
  'permission-denied': '해당 작업에 대한 권한이 없습니다.',
  'not-found': '요청한 리소스를 찾을 수 없습니다.',
  
  // Database connection errors
  'db/connection-failed': '데이터베이스 연결에 실패했습니다. 연결 정보를 확인해주세요.',
  'db/auth-failed': '데이터베이스 인증에 실패했습니다. 사용자 이름과 비밀번호를 확인해주세요.',
  'db/query-error': '쿼리 실행 중 오류가 발생했습니다.',
  'db/timeout': '데이터베이스 연결 시간이 초과되었습니다.',
  'db/schema-error': '스키마 정보를 가져오는데 실패했습니다.',
  
  // General errors
  'network-error': '네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
  'unknown-error': '알 수 없는 오류가 발생했습니다. 나중에 다시 시도해주세요.',
  'validation-error': '입력 데이터가 유효하지 않습니다.',
  'server-error': '서버 오류가 발생했습니다. 나중에 다시 시도해주세요.',
};

/**
 * Get user-friendly error message based on error code
 * @param error Error object
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (!error) {
    return '알 수 없는 오류가 발생했습니다.';
  }
  
  // Firebase error
  if (isFirebaseError(error)) {
    const code = error.code;
    return errorMessages[code] || `Firebase 오류: ${error.message}`;
  }
  
  // Regular Error object
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('network') || error.message.includes('Network')) {
      return errorMessages['network-error'];
    }
    
    // Check for timeout errors
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      return errorMessages['db/timeout'];
    }
    
    return error.message;
  }
  
  // String error message
  if (typeof error === 'string') {
    // Check if it's a known error code
    if (error in errorMessages) {
      return errorMessages[error];
    }
    return error;
  }
  
  // Default unknown error
  return errorMessages['unknown-error'];
}

/**
 * Type guard for Firebase errors
 * @param error Error object to check
 * @returns Whether the error is a Firebase error
 */
export function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' && 
    error !== null && 
    'code' in error && 
    'message' in error
  );
}

/**
 * Log error information without sensitive data
 * @param error Error object
 * @param componentInfo Additional component information
 */
export function logError(error: unknown, componentInfo?: string): void {
  // In production, this would log to a real service
  const now = new Date().toISOString();
  
  // Sanitize error object to remove sensitive information
  const sanitizedError = sanitizeErrorData(error);
  
  // Log to console in development
  console.error(`[${now}] Error ${componentInfo ? `in ${componentInfo}` : ''}:`, sanitizedError);
  
  // In production, would send to logging service
  // logToService(sanitizedError, componentInfo);
}

/**
 * Sanitize error data to remove sensitive information
 * @param error Error object
 * @returns Sanitized error object
 */
function sanitizeErrorData(error: unknown): unknown {
  if (!error) return { type: 'null-error' };
  
  // For Firebase errors, remove user credentials
  if (isFirebaseError(error)) {
    return {
      type: 'firebase-error',
      code: error.code,
      message: error.message,
      // Don't include error.customData as it may contain sensitive info
    };
  }
  
  // For regular errors, just include the type and message
  if (error instanceof Error) {
    return {
      type: error.constructor.name,
      message: error.message,
      // Don't include stack trace in production
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }
  
  // For string errors
  if (typeof error === 'string') {
    // Remove any potential passwords or tokens from the string
    return error.replace(/password=(['"])(?:(?=(\\?))\2.)*?\1/g, 'password=[REDACTED]')
               .replace(/token=(['"])(?:(?=(\\?))\2.)*?\1/g, 'token=[REDACTED]');
  }
  
  // For other types, just return the type
  return { type: typeof error };
}

/**
 * Handle React component error boundary errors
 * @param error Error object
 * @param errorInfo React error info
 */
export function handleComponentError(error: Error, errorInfo: ErrorInfo): void {
  logError(error, `Component: ${errorInfo.componentStack}`);
}

/**
 * Validate database connection details
 * @param connection Connection object
 * @returns Validation result with errors if any
 */
export function validateConnectionDetails(connection: {
  name?: string;
  host?: string;
  port?: number | string;
  database?: string;
  user?: string;
  password?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Check required fields
  if (!connection.name?.trim()) {
    errors.name = '연결 이름을 입력해주세요.';
  }
  
  if (!connection.host?.trim()) {
    errors.host = '호스트를 입력해주세요.';
  }
  
  // Convert port to number if it's a string
  const port = typeof connection.port === 'string' 
    ? parseInt(connection.port, 10) 
    : connection.port;
    
  if (!port || isNaN(port) || port < 1 || port > 65535) {
    errors.port = '유효한 포트 번호를 입력해주세요 (1-65535).';
  }
  
  if (!connection.database?.trim()) {
    errors.database = '데이터베이스 이름을 입력해주세요.';
  }
  
  if (!connection.user?.trim()) {
    errors.user = '사용자 이름을 입력해주세요.';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export default {
  getUserFriendlyErrorMessage,
  isFirebaseError,
  logError,
  handleComponentError,
  validateConnectionDetails,
};