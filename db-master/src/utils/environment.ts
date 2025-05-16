/**
 * 환경 설정 유틸리티
 * 
 * 이 모듈은 애플리케이션에서 사용되는 환경 변수 및 설정을 관리합니다.
 * 개발, 스테이징, 프로덕션 환경에 따라 다른 설정을 제공합니다.
 */

/**
 * 애플리케이션 환경
 */
export enum AppEnvironment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

/**
 * 현재 애플리케이션 환경
 */
export const APP_ENV = (import.meta.env.VITE_APP_ENV || 'development') as AppEnvironment;

/**
 * 애플리케이션 빌드 버전
 */
export const APP_VERSION = __APP_VERSION__ || '0.0.0';

/**
 * 애플리케이션 빌드 시간
 */
export const BUILD_TIME = __BUILD_TIME__ || new Date().toISOString();

/**
 * 개발 환경인지 여부
 */
export const IS_DEV = APP_ENV === AppEnvironment.Development;

/**
 * 스테이징 환경인지 여부
 */
export const IS_STAGING = APP_ENV === AppEnvironment.Staging;

/**
 * 프로덕션 환경인지 여부
 */
export const IS_PROD = APP_ENV === AppEnvironment.Production;

/**
 * Firebase 에뮬레이터 사용 여부
 */
export const USE_EMULATORS = import.meta.env.VITE_USE_EMULATORS === 'true';

/**
 * Firebase 설정
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * 에뮬레이터 호스트 설정
 */
export const emulatorConfig = {
  authHost: 'http://localhost:9099',
  firestoreHost: 'localhost:8080',
  functionsHost: 'localhost:5001',
  storageHost: 'localhost:9199',
};

/**
 * 현재 환경에 따른 Firebase 호스트 URL
 */
export const firebaseHostUrl = () => {
  switch (APP_ENV) {
    case AppEnvironment.Development:
      return 'http://localhost:5000';
    case AppEnvironment.Staging:
      return 'https://db888-staging.web.app';
    case AppEnvironment.Production:
      return 'https://db888-67827.web.app';
    default:
      return 'http://localhost:5000';
  }
};

/**
 * 애플리케이션 로그 레벨
 */
export const logLevel = IS_PROD ? 'error' : 'debug';

/**
 * 애플리케이션 기능 플래그 (Feature Flags)
 */
export const featureFlags = {
  enableQueryScheduling: IS_PROD ? false : true, // 프로덕션에서는 아직 비활성화
  enableAdvancedVisualization: IS_PROD ? false : true, // 프로덕션에서는 아직 비활성화
  enableFieldDistribution: !IS_PROD, // 프로덕션이 아닌 환경에서만 활성화
  enableActivityLogging: true, // 모든 환경에서 활성화
  enableBackups: IS_PROD, // 프로덕션 환경에서만 활성화
};

/**
 * 현재 환경 이름 (로깅용)
 */
export const environmentName = () => {
  switch (APP_ENV) {
    case AppEnvironment.Development:
      return 'Development';
    case AppEnvironment.Staging:
      return 'Staging';
    case AppEnvironment.Production:
      return 'Production';
    default:
      return 'Unknown';
  }
};

/**
 * 애플리케이션 정보 로그
 */
export const logAppInfo = () => {
  if (!IS_PROD) {
    console.info(`
      🚀 DB Master App
      Environment: ${environmentName()}
      Version: ${APP_VERSION}
      Build Time: ${BUILD_TIME}
      Firebase Project: ${firebaseConfig.projectId}
      Emulators: ${USE_EMULATORS ? 'Enabled' : 'Disabled'}
    `);
  }
};
