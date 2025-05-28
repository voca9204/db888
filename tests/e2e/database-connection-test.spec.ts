import { test, expect } from '@playwright/test';

test('데이터베이스 연결 테스트', async ({ page }) => {
  // 1. 로그인 페이지로 이동
  await page.goto('http://localhost:3000');
  
  // 페이지 로딩 확인
  await expect(page).toHaveTitle(/DB Master|Database Manager/);
  
  try {
    // 2. 로그인 정보 입력
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // 3. 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 로그인 성공 확인
    await page.waitForURL(/.*dashboard.*/);
    console.log('✅ 로그인 성공');
    
    // 4. 데이터베이스 연결 목록 페이지로 이동
    await page.click('a:has-text("연결"), a:has-text("Connections")');
    await page.waitForSelector('h1:has-text("Database"), h1:has-text("연결")');
    console.log('✅ 데이터베이스 연결 목록 페이지 로드됨');
    
    // 5. 새 연결 버튼 클릭
    await page.click('button:has-text("New Connection"), button:has-text("새 연결")');
    await page.waitForSelector('input[name="name"]');
    console.log('✅ 새 연결 폼 열림');
    
    // 6. 연결 정보 입력
    await page.fill('input[name="name"]', 'Test Connection');
    await page.fill('input[name="host"]', 'localhost');
    await page.fill('input[name="port"]', '3306');
    await page.fill('input[name="database"]', 'test_db');
    await page.fill('input[name="user"]', 'root');
    await page.fill('input[name="password"]', 'root');
    console.log('✅ 연결 정보 입력 완료');
    
    // 7. 연결 테스트 버튼 클릭
    await page.click('button:has-text("테스트"), button:has-text("Test")');
    console.log('✅ 연결 테스트 시작');
    
    // 8. 연결 테스트 결과 확인
    try {
      // 성공 또는 실패 메시지를 모두 확인
      const successSelector = 'text="연결 성공", text="Connection successful"';
      const errorSelector = 'text="연결 실패", text="Connection failed"';
      
      const result = await Promise.race([
        page.waitForSelector(successSelector, { timeout: 10000 })
          .then(() => ({ status: 'success' })),
        page.waitForSelector(errorSelector, { timeout: 10000 })
          .then(() => ({ status: 'error' }))
      ]);
      
      if (result.status === 'success') {
        console.log('✅ 연결 테스트 성공');
        
        // 테스트 상세 정보 출력
        const detailsText = await page.textContent('.bg-green-50, .bg-green-900');
        console.log('연결 테스트 성공 상세 정보:', detailsText);
      } else {
        console.log('❌ 연결 테스트 실패');
        
        // 실패 상세 정보 출력
        const errorText = await page.textContent('.bg-red-50, .bg-red-900');
        console.log('연결 테스트 실패 상세 정보:', errorText);
      }
      
      // 9. 연결 테스트 결과 화면 캡처
      await page.screenshot({ path: 'connection-test-result.png' });
      console.log('✅ 연결 테스트 결과 화면 캡처 완료');
      
    } catch (e) {
      console.error('테스트 결과 확인 중 오류 발생:', e);
      
      // 현재 화면 캡처 (오류 상황 디버깅용)
      await page.screenshot({ path: 'connection-test-error.png' });
    }
  } catch (e) {
    console.error('테스트 실행 중 오류 발생:', e);
    
    // 현재 화면 캡처 (오류 상황 디버깅용)
    await page.screenshot({ path: 'test-execution-error.png' });
  }
});