import { test, expect } from '@playwright/test';

test.describe('DataBrowser Edit Functionality', () => {
  // 로그인 및 기본 설정을 위한 전역 설정
  test.beforeEach(async ({ page }) => {
    // 애플리케이션 URL로 이동
    await page.goto('http://localhost:3000');
    
    // 로그인
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 로그인 성공 확인
    await expect(page).toHaveURL(/dashboard/);
    
    // 데이터베이스 연결 선택
    await page.click('text=Test Database');
    
    // 테이블 선택 (예: users 테이블)
    await page.click('text=users');
    
    // DataBrowser가 로드될 때까지 대기
    await page.waitForSelector('table');
  });

  test('should display edit button for each row', async ({ page }) => {
    // 첫 번째 행의 편집 버튼 확인
    const editButton = page.locator('tbody tr:first-child button:has-text("편집")');
    await expect(editButton).toBeVisible();
  });

  test('should enter edit mode when edit button is clicked', async ({ page }) => {
    // 첫 번째 행의 편집 버튼 클릭
    await page.click('tbody tr:first-child button:has-text("편집")');
    
    // 편집 모드에 진입했는지 확인 (저장, 취소 버튼이 보이는지)
    await expect(page.locator('text=저장')).toBeVisible();
    await expect(page.locator('text=취소')).toBeVisible();
    
    // 입력 필드가 표시되는지 확인
    const inputField = page.locator('tbody tr:first-child input');
    await expect(inputField).toBeVisible();
  });

  test('should edit and save row data successfully', async ({ page }) => {
    // 첫 번째 행의 편집 버튼 클릭
    await page.click('tbody tr:first-child button:has-text("편집")');
    
    // 테스트할 컬럼 찾기 (예: 'name' 컬럼)
    // 실제 앱의 구조에 따라 셀렉터 조정 필요
    const nameInput = page.locator('tbody tr:first-child input[name="name"]');
    
    // 현재 값 기억하기
    const originalValue = await nameInput.inputValue();
    
    // 새 값을 입력
    await nameInput.clear();
    const newValue = `Test Name ${Date.now()}`;
    await nameInput.fill(newValue);
    
    // 저장 버튼 클릭
    await page.click('text=저장');
    
    // 로딩 상태 처리
    await page.waitForSelector('text=저장 중...', { state: 'detached', timeout: 5000 });
    
    // 성공 메시지 확인
    await expect(page.locator('text=행이 성공적으로 업데이트되었습니다')).toBeVisible();
    
    // 업데이트된 값이 테이블에 표시되는지 확인
    const updatedCell = page.locator(`tbody tr:first-child td:has-text("${newValue}")`);
    await expect(updatedCell).toBeVisible();
    
    // 원래 값으로 복원 (테스트 환경 정리)
    await page.click('tbody tr:first-child button:has-text("편집")');
    await nameInput.clear();
    await nameInput.fill(originalValue);
    await page.click('text=저장');
    await page.waitForSelector('text=저장 중...', { state: 'detached', timeout: 5000 });
  });

  test('should cancel edit mode without saving changes', async ({ page }) => {
    // 첫 번째 행의 편집 버튼 클릭
    await page.click('tbody tr:first-child button:has-text("편집")');
    
    // 테스트할 컬럼 찾기
    const nameInput = page.locator('tbody tr:first-child input[name="name"]');
    
    // 현재 값 기억하기
    const originalValue = await nameInput.inputValue();
    
    // 새 값을 입력
    await nameInput.clear();
    const newValue = `Canceled Name ${Date.now()}`;
    await nameInput.fill(newValue);
    
    // 취소 버튼 클릭
    await page.click('text=취소');
    
    // 편집 모드가 종료되었는지 확인
    await expect(page.locator('text=저장')).not.toBeVisible();
    
    // 원래 값이 유지되는지 확인
    const cell = page.locator(`tbody tr:first-child td:has-text("${originalValue}")`);
    await expect(cell).toBeVisible();
    
    // 변경된 값이 적용되지 않았는지 확인
    const updatedCell = page.locator(`tbody tr:first-child td:has-text("${newValue}")`);
    await expect(updatedCell).not.toBeVisible();
  });

  test('should not allow editing of primary key column', async ({ page }) => {
    // 첫 번째 행의 편집 버튼 클릭
    await page.click('tbody tr:first-child button:has-text("편집")');
    
    // 기본 키 컬럼의 입력 필드 찾기 (예: id 컬럼)
    const idInput = page.locator('tbody tr:first-child input[name="id"]');
    
    // 기본 키 필드가 비활성화되어 있는지 확인
    await expect(idInput).toBeDisabled();
    
    // 취소 버튼 클릭하여 편집 모드 종료
    await page.click('text=취소');
  });

  test('should handle error when update fails', async ({ page }) => {
    // API 요청을 가로채서 에러 응답을 모의
    await page.route('**/updateTableRow', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: '행 업데이트 실패: 테스트 에러'
        })
      });
    });
    
    // 첫 번째 행의 편집 버튼 클릭
    await page.click('tbody tr:first-child button:has-text("편집")');
    
    // 테스트할 컬럼 찾기
    const nameInput = page.locator('tbody tr:first-child input[name="name"]');
    
    // 현재 값 기억하기
    const originalValue = await nameInput.inputValue();
    
    // 새 값을 입력
    await nameInput.clear();
    await nameInput.fill(`Error Test ${Date.now()}`);
    
    // 저장 버튼 클릭
    await page.click('text=저장');
    
    // 에러 메시지 확인
    await expect(page.locator('text=행 업데이트 실패: 테스트 에러')).toBeVisible();
    
    // 라우트 가로채기 제거
    await page.unroute('**/updateTableRow');
    
    // 취소 버튼 클릭하여 편집 모드 종료
    await page.click('text=취소');
  });
});
