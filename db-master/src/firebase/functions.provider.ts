import { httpsCallable } from 'firebase/functions';
import { functions } from './config';
import mockFunctions from './functions.mock';

// 모의 함수 사용 여부 설정
// localStorage 또는 환경 변수에서 읽을 수 있음
const USE_MOCK_FUNCTIONS = localStorage.getItem('USE_MOCK_FUNCTIONS') === 'true' || 
                          process.env.REACT_APP_USE_MOCK_FUNCTIONS === 'true' ||
                          !functions; // Firebase Functions를 사용할 수 없는 경우 모의 함수 사용

// 실제 또는 모의 함수 반환
export const getFunctionProvider = (functionName: string, useMock = USE_MOCK_FUNCTIONS) => {
  if (useMock) {
    console.log(`Using mock function for ${functionName}`);
    // 모의 함수 이름 생성 (예: testConnection → mockTestConnection)
    const mockFunctionName = `mock${functionName.charAt(0).toUpperCase() + functionName.slice(1)}`;
    
    // 모의 함수 반환
    return async (data?: any) => {
      // @ts-ignore - 동적 함수 호출
      if (typeof mockFunctions[mockFunctionName] === 'function') {
        // @ts-ignore
        return await mockFunctions[mockFunctionName](data);
      } else {
        console.error(`Mock function ${mockFunctionName} not found`);
        return {
          data: {
            success: false,
            message: `Mock function ${mockFunctionName} not implemented`,
          }
        };
      }
    };
  } else {
    // 실제 Firebase 함수가 없으면 모의 함수로 폴백
    if (!functions) {
      console.warn(`Firebase Functions not available. Falling back to mock for ${functionName}`);
      return getFunctionProvider(functionName, true);
    }
    
    // 실제 Firebase 함수 반환
    return httpsCallable(functions, functionName);
  }
};

// Specific function exports
export const testDatabaseConnection = getFunctionProvider('testConnection');
export const saveDbConnection = getFunctionProvider('saveConnection');
export const getDbConnections = getFunctionProvider('getConnections');
export const deleteDbConnection = getFunctionProvider('deleteConnection');
export const executeQuery = getFunctionProvider('executeQuery');
export const getDatabaseSchema = getFunctionProvider('getDatabaseSchema');
export const getSchemaVersions = getFunctionProvider('getSchemaVersions');
export const getSchemaChanges = getFunctionProvider('getSchemaChanges');
export const getSchemaVersion = getFunctionProvider('getSchemaVersion');
export const getTableData = getFunctionProvider('getTableData');
export const updateTableRow = getFunctionProvider('updateTableRow');
export const insertTableRow = getFunctionProvider('insertTableRow');
export const deleteTableRow = getFunctionProvider('deleteTableRow');

// Database service export
import databaseService from '../services/DatabaseService';
export { databaseService };

// Debug helper - 모의 모드 전환
export const toggleMockMode = (enable?: boolean) => {
  const newValue = enable !== undefined ? enable : localStorage.getItem('USE_MOCK_FUNCTIONS') !== 'true';
  localStorage.setItem('USE_MOCK_FUNCTIONS', newValue ? 'true' : 'false');
  console.log(`Mock functions ${newValue ? 'enabled' : 'disabled'}. Reload page to apply.`);
  return newValue;
};
