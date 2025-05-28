// Firebase Functions 모의 구현
// 개발 환경이나 Firebase 연결 실패 시 폴백으로 사용

/**
 * 모의 데이터베이스 연결 테스트 함수
 */
export const mockTestConnection = async (data: any) => {
  // 0.5초 지연 (실제 네트워크 호출 시뮬레이션)
  await new Promise(resolve => setTimeout(resolve, 500));

  const connectionId = typeof data === 'string' ? data : undefined;
  const connectionDetails = typeof data === 'object' ? data : undefined;

  // 연결 ID나 연결 세부 정보가 있는 경우
  if (connectionId || connectionDetails) {
    return {
      data: {
        success: true,
        message: "Mock connection successful (테스트 모드)",
        executionTime: 450,
        details: {
          host: connectionDetails?.host || 'localhost',
          port: connectionDetails?.port || 3306,
          database: connectionDetails?.database || 'test_db',
          user: connectionDetails?.user || 'test_user',
          ssl: connectionDetails?.ssl || false,
          serverInfo: {
            version: "10.6.12-MariaDB-1:10.6.12+maria~ubu2004",
            database: connectionDetails?.database || 'test_db',
            user: `${connectionDetails?.user || 'test_user'}@%`
          },
          permissions: [
            {
              "Host": "%",
              "User": connectionDetails?.user || 'test_user',
              "Grant": "GRANT ALL PRIVILEGES ON *.* TO `test_user`@`%`"
            }
          ],
          schemaInfo: {
            table_count: 15
          },
        }
      }
    };
  }

  // 유효하지 않은 입력의 경우
  return {
    data: {
      success: false,
      message: "Invalid connection parameters",
      errorCode: "invalid_params"
    }
  };
};

/**
 * 모의 데이터베이스 연결 저장 함수
 */
export const mockSaveConnection = async (data: any) => {
  // 0.5초 지연
  await new Promise(resolve => setTimeout(resolve, 500));

  // ID가 있으면 업데이트, 없으면 새로 생성
  const isNewConnection = !data.id;
  const connectionId = data.id || `mock-connection-${Date.now()}`;

  return {
    data: {
      success: true,
      connectionId,
      message: isNewConnection
        ? "Connection saved successfully"
        : "Connection updated successfully",
      details: {
        name: data.name,
        host: data.host,
        port: data.port,
        database: data.database,
        user: data.user,
        ssl: data.ssl,
      }
    }
  };
};

/**
 * 모의 데이터베이스 연결 목록 조회 함수
 */
export const mockGetConnections = async () => {
  // 0.5초 지연
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    data: {
      success: true,
      connections: [
        {
          id: "mock-connection-1",
          name: "Local MariaDB",
          host: "localhost",
          port: 3306,
          database: "test_db",
          user: "test_user",
          ssl: false,
          createdAt: Date.now() - 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 12 * 60 * 60 * 1000,
          lastUsed: Date.now() - 2 * 60 * 60 * 1000,
        },
        {
          id: "mock-connection-2",
          name: "Production Database",
          host: "db.example.com",
          port: 3306,
          database: "prod_db",
          user: "prod_user",
          ssl: true,
          createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
          lastUsed: Date.now() - 24 * 60 * 60 * 1000,
        }
      ],
      total: 2,
      filtered: false
    }
  };
};

/**
 * 모의 데이터베이스 연결 삭제 함수
 */
export const mockDeleteConnection = async (data: { connectionId: string }) => {
  // 0.5초 지연
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    data: {
      success: true,
      message: "Connection deleted successfully",
      connectionId: data.connectionId
    }
  };
};

/**
 * 모의 쿼리 실행 함수
 */
export const mockExecuteQuery = async (data: { connectionId: string, query: string, parameters?: any[] }) => {
  // 0.5초 지연
  await new Promise(resolve => setTimeout(resolve, 500));

  // 쿼리에 따라 다른 결과 반환
  if (data.query.toUpperCase().includes("SELECT")) {
    return {
      data: {
        success: true,
        results: [
          { id: 1, name: "Test 1", value: 100 },
          { id: 2, name: "Test 2", value: 200 },
          { id: 3, name: "Test 3", value: 300 },
        ],
        fields: [
          { name: "id", type: "INT" },
          { name: "name", type: "VARCHAR" },
          { name: "value", type: "INT" },
        ],
        executionTime: 123,
      }
    };
  } else {
    return {
      data: {
        success: true,
        affectedRows: 1,
        executionTime: 87,
      }
    };
  }
};

/**
 * 모의 테이블 데이터 조회 함수
 */
export const mockGetTableData = async (data: { connectionId: string, tableName: string }) => {
  // 0.5초 지연
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    data: {
      success: true,
      data: {
        rows: [
          { id: 1, name: "Test 1", created_at: "2023-01-01T00:00:00.000Z" },
          { id: 2, name: "Test 2", created_at: "2023-01-02T00:00:00.000Z" },
          { id: 3, name: "Test 3", created_at: "2023-01-03T00:00:00.000Z" },
        ],
        page: 1,
        pageSize: 10,
        total: 3,
        totalPages: 1,
      }
    }
  };
};

// 모의 함수 객체
const mockFunctions = {
  mockTestConnection,
  mockSaveConnection,
  mockGetConnections,
  mockDeleteConnection,
  mockExecuteQuery,
  mockGetTableData,
};

export default mockFunctions;
