# Test info

- Name: 데이터베이스 연결 테스트
- Location: /Users/sinclair/Projects/db/tests/e2e/database-connection-test.spec.ts:3:5

# Error details

```
Error: browserType.launch: Executable doesn't exist at /Users/sinclair/Library/Caches/ms-playwright/chromium-1169/chrome-mac/Chromium.app/Contents/MacOS/Chromium
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
>  3 | test('데이터베이스 연결 테스트', async ({ page }) => {
     |     ^ Error: browserType.launch: Executable doesn't exist at /Users/sinclair/Library/Caches/ms-playwright/chromium-1169/chrome-mac/Chromium.app/Contents/MacOS/Chromium
   4 |   // 1. 로그인 페이지로 이동
   5 |   await page.goto('http://localhost:3000');
   6 |   
   7 |   // 페이지 로딩 확인
   8 |   await expect(page).toHaveTitle(/DB Master|Database Manager/);
   9 |   
  10 |   try {
  11 |     // 2. 로그인 정보 입력
  12 |     await page.fill('input[type="email"]', 'test@example.com');
  13 |     await page.fill('input[type="password"]', 'password123');
  14 |     
  15 |     // 3. 로그인 버튼 클릭
  16 |     await page.click('button[type="submit"]');
  17 |     
  18 |     // 로그인 성공 확인
  19 |     await page.waitForURL(/.*dashboard.*/);
  20 |     console.log('✅ 로그인 성공');
  21 |     
  22 |     // 4. 데이터베이스 연결 목록 페이지로 이동
  23 |     await page.click('a:has-text("연결"), a:has-text("Connections")');
  24 |     await page.waitForSelector('h1:has-text("Database"), h1:has-text("연결")');
  25 |     console.log('✅ 데이터베이스 연결 목록 페이지 로드됨');
  26 |     
  27 |     // 5. 새 연결 버튼 클릭
  28 |     await page.click('button:has-text("New Connection"), button:has-text("새 연결")');
  29 |     await page.waitForSelector('input[name="name"]');
  30 |     console.log('✅ 새 연결 폼 열림');
  31 |     
  32 |     // 6. 연결 정보 입력
  33 |     await page.fill('input[name="name"]', 'Test Connection');
  34 |     await page.fill('input[name="host"]', 'localhost');
  35 |     await page.fill('input[name="port"]', '3306');
  36 |     await page.fill('input[name="database"]', 'test_db');
  37 |     await page.fill('input[name="user"]', 'root');
  38 |     await page.fill('input[name="password"]', 'root');
  39 |     console.log('✅ 연결 정보 입력 완료');
  40 |     
  41 |     // 7. 연결 테스트 버튼 클릭
  42 |     await page.click('button:has-text("테스트"), button:has-text("Test")');
  43 |     console.log('✅ 연결 테스트 시작');
  44 |     
  45 |     // 8. 연결 테스트 결과 확인
  46 |     try {
  47 |       // 성공 또는 실패 메시지를 모두 확인
  48 |       const successSelector = 'text="연결 성공", text="Connection successful"';
  49 |       const errorSelector = 'text="연결 실패", text="Connection failed"';
  50 |       
  51 |       const result = await Promise.race([
  52 |         page.waitForSelector(successSelector, { timeout: 10000 })
  53 |           .then(() => ({ status: 'success' })),
  54 |         page.waitForSelector(errorSelector, { timeout: 10000 })
  55 |           .then(() => ({ status: 'error' }))
  56 |       ]);
  57 |       
  58 |       if (result.status === 'success') {
  59 |         console.log('✅ 연결 테스트 성공');
  60 |         
  61 |         // 테스트 상세 정보 출력
  62 |         const detailsText = await page.textContent('.bg-green-50, .bg-green-900');
  63 |         console.log('연결 테스트 성공 상세 정보:', detailsText);
  64 |       } else {
  65 |         console.log('❌ 연결 테스트 실패');
  66 |         
  67 |         // 실패 상세 정보 출력
  68 |         const errorText = await page.textContent('.bg-red-50, .bg-red-900');
  69 |         console.log('연결 테스트 실패 상세 정보:', errorText);
  70 |       }
  71 |       
  72 |       // 9. 연결 테스트 결과 화면 캡처
  73 |       await page.screenshot({ path: 'connection-test-result.png' });
  74 |       console.log('✅ 연결 테스트 결과 화면 캡처 완료');
  75 |       
  76 |     } catch (e) {
  77 |       console.error('테스트 결과 확인 중 오류 발생:', e);
  78 |       
  79 |       // 현재 화면 캡처 (오류 상황 디버깅용)
  80 |       await page.screenshot({ path: 'connection-test-error.png' });
  81 |     }
  82 |   } catch (e) {
  83 |     console.error('테스트 실행 중 오류 발생:', e);
  84 |     
  85 |     // 현재 화면 캡처 (오류 상황 디버깅용)
  86 |     await page.screenshot({ path: 'test-execution-error.png' });
  87 |   }
  88 | });
```