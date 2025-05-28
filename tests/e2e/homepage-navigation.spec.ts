import { test, expect } from '@playwright/test';

test.describe('Homepage Navigation Test', () => {
  test('should navigate from login to dashboard to connections', async ({ page }) => {
    // 1. 사용자가 애플리케이션의 첫 페이지(로그인 페이지)로 이동
    await page.goto('http://localhost:3000');
    
    // 2. 로그인 폼의 존재 여부 확인
    const loginForm = page.locator('form');
    await expect(loginForm).toBeVisible();
    
    // 3. 이메일 및 비밀번호 입력 필드가 나타나는지 확인
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // 4. 유효한 로그인 자격 증명(test@example.com/password123)을 입력
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    
    // 5. 로그인 버튼 클릭
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeVisible();
    await loginButton.click();
    
    // 6. 로그인 후 대시보드 페이지로 리디렉션 확인
    await expect(page).toHaveURL(/dashboard/);
    
    // 대시보드 페이지가 로드되었는지 확인
    const dashboardTitle = page.locator('h1:has-text("대시보드")');
    await expect(dashboardTitle).toBeVisible();
    
    // 7. 대시보드 페이지에 주요 메뉴 항목 표시 확인(연결, 쿼리, 스키마 등)
    const connectionsMenu = page.locator('a:has-text("연결")');
    const queryMenu = page.locator('a:has-text("쿼리")');
    const schemaMenu = page.locator('a:has-text("스키마")');
    
    await expect(connectionsMenu).toBeVisible();
    await expect(queryMenu).toBeVisible();
    await expect(schemaMenu).toBeVisible();
    
    // 8. 데이터베이스 연결 목록 페이지로 이동
    await connectionsMenu.click();
    
    // 연결 페이지로 이동했는지 확인
    await expect(page).toHaveURL(/connections/);
    
    // 9. 기존 데이터베이스 연결 목록이 표시되는지 확인
    const connectionsList = page.locator('.connection-list, .connections-grid');
    await expect(connectionsList).toBeVisible();
    
    // 최소한 한 개의 연결이 있는지 확인
    const connectionItems = page.locator('.connection-item, .connection-card');
    await expect(connectionItems.first()).toBeVisible();
    
    // 10. 새 연결 버튼이 표시되는지 확인
    const newConnectionButton = page.locator('button:has-text("새 연결"), a:has-text("새 연결")');
    await expect(newConnectionButton).toBeVisible();
  });
  
  test('should show login error with invalid credentials', async ({ page }) => {
    // 애플리케이션의 첫 페이지로 이동
    await page.goto('http://localhost:3000');
    
    // 잘못된 자격 증명 입력
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 에러 메시지 확인
    const errorMessage = page.locator('text=로그인 실패, text=잘못된 이메일 또는 비밀번호, text=인증 오류');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // URL이 여전히 로그인 페이지인지 확인
    await expect(page).not.toHaveURL(/dashboard/);
  });
  
  test('should require both email and password fields', async ({ page }) => {
    // 애플리케이션의 첫 페이지로 이동
    await page.goto('http://localhost:3000');
    
    // 이메일만 입력하고 비밀번호는 비워둠
    await page.fill('input[type="email"]', 'test@example.com');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 아직 로그인 페이지에 있는지 확인
    await expect(page).not.toHaveURL(/dashboard/);
    
    // 비밀번호 필드 검증 메시지 확인
    const validationMessage = await page.locator('input[type="password"]').evaluate(el => el.validationMessage);
    expect(validationMessage).toBeTruthy();
    
    // 페이지 새로고침
    await page.reload();
    
    // 비밀번호만 입력하고 이메일은 비워둠
    await page.fill('input[type="password"]', 'password123');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 아직 로그인 페이지에 있는지 확인
    await expect(page).not.toHaveURL(/dashboard/);
    
    // 이메일 필드 검증 메시지 확인
    const emailValidationMessage = await page.locator('input[type="email"]').evaluate(el => el.validationMessage);
    expect(emailValidationMessage).toBeTruthy();
  });
  
  test('should navigate through main menu items', async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:3000');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 대시보드로 이동 확인
    await expect(page).toHaveURL(/dashboard/);
    
    // 쿼리 메뉴로 이동
    await page.click('a:has-text("쿼리")');
    await expect(page).toHaveURL(/query/);
    
    // 쿼리 페이지가 로드되었는지 확인
    const queryTitle = page.locator('text=쿼리 빌더, text=SQL 편집기, text=쿼리 관리');
    await expect(queryTitle).toBeVisible();
    
    // 스키마 메뉴로 이동
    await page.click('a:has-text("스키마")');
    await expect(page).toHaveURL(/schema/);
    
    // 스키마 페이지가 로드되었는지 확인
    const schemaTitle = page.locator('text=스키마 브라우저, text=ERD 뷰어, text=스키마 비교');
    await expect(schemaTitle).toBeVisible();
    
    // 다시 연결 메뉴로 이동
    await page.click('a:has-text("연결")');
    await expect(page).toHaveURL(/connections/);
    
    // 연결 페이지가 로드되었는지 확인
    const connectionsTitle = page.locator('text=데이터베이스 연결, text=연결 관리, text=DB 연결');
    await expect(connectionsTitle).toBeVisible();
  });
});
