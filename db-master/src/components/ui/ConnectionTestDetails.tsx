import React from 'react';

interface ConnectionTestDetailsProps {
  results: any;
}

/**
 * 연결 테스트 결과를 보여주는 컴포넌트
 */
const ConnectionTestDetails: React.FC<ConnectionTestDetailsProps> = ({ results }) => {
  // 테스트 성공 여부에 따라 표시할 내용이 다름
  if (!results) {
    return null;
  }

  if (results.success) {
    // 성공한 경우 서버 정보와 쿼리 실행 시간 등을 보여줌
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md dark:bg-green-900 dark:border-green-700">
        <h4 className="text-green-800 font-medium mb-2 dark:text-green-300">연결 성공</h4>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-green-700 dark:text-green-400 font-medium">실행 시간:</span>
            <span>{results.executionTime}ms</span>
          </div>
          
          {results.details && (
            <>
              <hr className="border-green-200 dark:border-green-700 my-1" />
              <div className="font-medium text-green-700 dark:text-green-400">서버 정보:</div>
              
              {results.details.serverInfo && (
                <div className="grid grid-cols-1 gap-1 pl-2">
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-400">버전:</span>
                    <span>{results.details.serverInfo.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-400">사용자:</span>
                    <span>{results.details.serverInfo.user}</span>
                  </div>
                </div>
              )}
              
              <hr className="border-green-200 dark:border-green-700 my-1" />
              <div className="font-medium text-green-700 dark:text-green-400">연결 설정:</div>
              <div className="grid grid-cols-1 gap-1 pl-2">
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-400">호스트:</span>
                  <span>{results.details.host}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-400">포트:</span>
                  <span>{results.details.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-400">데이터베이스:</span>
                  <span>{results.details.database}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-400">SSL:</span>
                  <span>{results.details.ssl ? '사용' : '사용 안함'}</span>
                </div>
              </div>
              
              {results.details.schemaInfo && (
                <>
                  <hr className="border-green-200 dark:border-green-700 my-1" />
                  <div className="font-medium text-green-700 dark:text-green-400">스키마 정보:</div>
                  <div className="grid grid-cols-1 gap-1 pl-2">
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-400">테이블 수:</span>
                      <span>{results.details.schemaInfo.table_count}</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
          
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
            테스트 시간: {new Date(results.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
    );
  } else {
    // 실패한 경우 에러 코드와 세부 정보를 보여줌
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900 dark:border-red-700">
        <h4 className="text-red-800 font-medium mb-2 dark:text-red-300">연결 실패</h4>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-red-700 dark:text-red-400 font-medium">오류 코드:</span>
            <span>{results.errorCode || '알 수 없음'}</span>
          </div>
          
          {results.originalError && (
            <div className="flex justify-between">
              <span className="text-red-700 dark:text-red-400 font-medium">원본 오류:</span>
              <span>{results.originalError}</span>
            </div>
          )}
          
          {results.details && (
            <>
              <hr className="border-red-200 dark:border-red-700 my-1" />
              <div className="font-medium text-red-700 dark:text-red-400">연결 설정:</div>
              <div className="grid grid-cols-1 gap-1 pl-2">
                <div className="flex justify-between">
                  <span className="text-red-700 dark:text-red-400">호스트:</span>
                  <span>{results.details.host}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700 dark:text-red-400">포트:</span>
                  <span>{results.details.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700 dark:text-red-400">데이터베이스:</span>
                  <span>{results.details.database}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700 dark:text-red-400">SSL:</span>
                  <span>{results.details.ssl ? '사용' : '사용 안함'}</span>
                </div>
              </div>
              
              {results.details.errorCode && (
                <div className="mt-2">
                  <div className="font-medium text-red-700 dark:text-red-400">오류 세부 정보:</div>
                  <div className="bg-red-100 p-2 rounded dark:bg-red-800 mt-1 overflow-auto max-h-40">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify({
                        errorCode: results.details.errorCode,
                        errno: results.details.errno,
                        stack: results.details.errorStack
                      }, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="mt-4 bg-red-100 dark:bg-red-800 p-3 rounded">
            <div className="font-medium text-red-700 dark:text-red-400 mb-1">문제 해결 방법:</div>
            <ul className="list-disc pl-4 text-xs text-red-700 dark:text-red-400 space-y-1">
              <li>호스트 이름과 IP 주소가 올바른지 확인하세요</li>
              <li>방화벽 또는 네트워크 설정이 연결을 허용하는지 확인하세요</li>
              <li>데이터베이스 서버가 실행 중인지 확인하세요</li>
              <li>사용자 이름과 비밀번호가 올바른지 확인하세요</li>
              <li>데이터베이스 이름이 올바른지 확인하세요</li>
              <li>포트가 정확한지 확인하세요 (MariaDB/MySQL 기본값은 3306)</li>
              {results.errorCode === 'ETIMEDOUT' && (
                <li className="font-medium">연결 시간이 초과되었습니다. 네트워크 상태를 확인하세요.</li>
              )}
              {results.errorCode === 'ECONNREFUSED' && (
                <li className="font-medium">��결이 거부되었습니다. 서버가 실행 중이고 포트가 열려 있는지 확인하세요.</li>
              )}
              {results.errorCode === 'access_denied' && (
                <li className="font-medium">액세스가 거부되었습니다. 사용자 이름과 비밀번호를 확인하세요.</li>
              )}
              {results.errorCode === 'database_not_found' && (
                <li className="font-medium">데이터베이스를 찾을 수 없습니다. 데이터베이스 이름을 확인하세요.</li>
              )}
              {results.errorCode === 'host_not_found' && (
                <li className="font-medium">호스트를 찾을 수 없습니다. 호스트 이름/IP를 확인하세요.</li>
              )}
            </ul>
          </div>
          
          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
            테스트 시간: {new Date(results.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
    );
  }
};

export default ConnectionTestDetails;
