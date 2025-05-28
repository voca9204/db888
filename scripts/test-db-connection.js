const mysql = require('mysql2/promise');

// 연결 설정 목록 (여러 조합 테스트)
const connectionConfigs = [
  {
    name: '기본 설정',
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'test_db'
  },
  {
    name: '사용자명 변경',
    host: 'localhost',
    port: 3306,
    user: 'admin',
    password: 'root',
    database: 'test_db'
  },
  {
    name: '비밀번호 변경',
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'test_db'
  },
  {
    name: 'MariaDB 기본값',
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '', // 빈 비밀번호
    database: 'mysql' // 기본 시스템 데이터베이스
  }
];
// DB 연결을 테스트하는 함수
async function testConnection(connectionConfig) {
  console.log(`\n[${connectionConfig.name}] 연결 테스트 시작:`, {
    host: connectionConfig.host,
    port: connectionConfig.port,
    user: connectionConfig.user,
    database: connectionConfig.database
  });
  
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: connectionConfig.host,
      port: connectionConfig.port,
      user: connectionConfig.user,
      password: connectionConfig.password,
      database: connectionConfig.database,
      connectTimeout: 10000, // 10 초
      // 추가 옵션
      ssl: false,
      multipleStatements: false
    });
    
    // Execute simple query
    console.log('연결 성공! 테스트 쿼리 실행 중...');
    const [rows] = await connection.query('SELECT 1 as connection_test');
    
    // Server information
    const [serverInfo] = await connection.query('SELECT VERSION() as version, DATABASE() as database, USER() as user');
    
    // Close connection
    await connection.end();
    
    // Print results
    console.log('테스트 결과:');
    console.log('- 연결 상태:', rows[0].connection_test === 1 ? '성공' : '실패');
    console.log('- 서버 정보:', serverInfo[0]);
    
    return {
      success: true,
      message: '연결 성공',
      details: {
        serverInfo: serverInfo[0]
      }
    };
  } catch (error) {
    console.error('연결 실패:', error.message);
    
    return {
      success: false,
      message: `연결 실패: ${error.message}`,
      errorCode: error.code,
      errno: error.errno
    };
  }
}

// 모든 연결 설정을 순차적으로 테스트
async function runAllTests() {
  const results = [];
  
  for (const config of connectionConfigs) {
    try {
      const result = await testConnection(config);
      results.push({
        name: config.name,
        ...result
      });
      
      // 연결 성공 시 다음 테스트로 진행하지 않음
      if (result.success) {
        console.log(`\n✅ [${config.name}] 연결 성공!`);
        return results;
      }
    } catch (err) {
      results.push({
        name: config.name,
        success: false,
        message: `예외 발생: ${err.message}`,
        error: err
      });
    }
  }
  
  return results;
}

// 모든 테스트 실행
runAllTests()
  .then(results => {
    console.log('\n==== 테스트 결과 요약 ====');
    let foundSuccess = false;
    
    results.forEach(result => {
      console.log(`[${result.name}]: ${result.success ? '성공 ✅' : '실패 ❌'} - ${result.message}`);
      if (result.success) foundSuccess = true;
    });
    
    if (!foundSuccess) {
      console.log('\n❌ 모든 연결 테스트 실패!');
      console.log('다음을 확인해주세요:');
      console.log('1. MySQL/MariaDB 서버가 실행 중인지 확인');
      console.log('2. 호스트/포트가 올바른지 확인 (현재: localhost:3306)');
      console.log('3. 사용자 이름과 비밀번호가 올바른지 확인');
      console.log('4. 데이터베이스가 존재하는지 확인');
      console.log('5. 방화벽 설정 확인');
      process.exit(1);
    } else {
      console.log('\n✅ 연결 성공!');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('테스트 중 오류:', err);
    process.exit(1);
  });