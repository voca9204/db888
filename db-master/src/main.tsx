import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { FirebaseProvider } from './context/SimpleFirebaseContext'
import ErrorBoundary from './components/ErrorBoundary'
import { MainLayout } from './components/layout'
import Login from './pages/Login'

// 간단한 대시보드 컴포넌트
const Dashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">DB Master 대시보드</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">최근 연결</h2>
          <p className="text-gray-600 dark:text-gray-400">아직 저장된 연결이 없습니다.</p>
          <a href="/database" className="text-blue-600 hover:underline mt-2 inline-block">
            연결 추가하기
          </a>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">최근 쿼리</h2>
          <p className="text-gray-600 dark:text-gray-400">아직 실행된 쿼리가 없습니다.</p>
          <a href="/query-builder" className="text-blue-600 hover:underline mt-2 inline-block">
            쿼리 빌더 열기
          </a>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">저장된 템플릿</h2>
          <p className="text-gray-600 dark:text-gray-400">아직 저장된 템플릿이 없습니다.</p>
          <a href="/templates" className="text-blue-600 hover:underline mt-2 inline-block">
            템플릿 관리
          </a>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">빠른 작업</h2>
          <div className="space-y-2">
            <a href="/database" className="block text-blue-600 hover:underline">
              새 연결 만들기
            </a>
            <a href="/query-builder" className="block text-blue-600 hover:underline">
              새 쿼리 작성
            </a>
            <a href="/tables" className="block text-blue-600 hover:underline">
              테이블 데이터 보기
            </a>
            <a href="/settings" className="block text-blue-600 hover:underline">
              설정
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// 테이블 브라우저 컴포넌트
const TableBrowser = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">테이블 브라우저</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        데이터베이스 연결을 선택하고 테이블을 탐색하세요.
      </p>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-center">아직 연결된 데이터베이스가 없습니다.</p>
        <a href="/database" className="text-blue-600 hover:underline text-center block mt-4">
          연결 추가하기
        </a>
      </div>
    </div>
  );
};

// 쿼리 빌더 컴포넌트
const QueryBuilder = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">쿼리 빌더</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        시각적 인터페이스로 SQL 쿼리를 작성하세요.
      </p>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-center">아직 연결된 데이터베이스가 없습니다.</p>
        <a href="/database" className="text-blue-600 hover:underline text-center block mt-4">
          연결 추가하기
        </a>
      </div>
    </div>
  );
};

// 연결 관리 컴포넌트
const DatabaseConnections = () => {
  const showTestResult = () => {
    // 연결 테스트 결과를 표시할 요소를 찾거나 생성
    let resultElement = document.getElementById('connection-test-result');
    if (!resultElement) {
      resultElement = document.createElement('div');
      resultElement.id = 'connection-test-result';
      resultElement.className = 'mt-4 p-3 rounded-md'; 
      document.getElementById('connection-form').appendChild(resultElement);
    }
    
    // 랜덤으로 성공 또는 실패 결과 표시 (테스트용)
    if (Math.random() > 0.5) {
      resultElement.className = 'mt-4 p-3 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded-md';
      resultElement.textContent = '✓ 연결 테스트 성공! 데이터베이스에 연결할 수 있습니다.';
    } else {
      resultElement.className = 'mt-4 p-3 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded-md';
      resultElement.textContent = '✗ 연결 테스트 실패: 호스트에 연결할 수 없습니다. 연결 정보를 확인하세요.';
    }
  };
  
  const saveConnection = () => {
    // 알림 대화상자 대신 인라인 메시지 표시
    let notificationElement = document.getElementById('save-notification');
    if (!notificationElement) {
      notificationElement = document.createElement('div');
      notificationElement.id = 'save-notification';
      notificationElement.className = 'mt-4 p-3 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded-md'; 
      notificationElement.textContent = '✓ 데이터베이스 연결이 저장되었습니다.';
      document.getElementById('connection-form').appendChild(notificationElement);
    } else {
      notificationElement.style.display = 'block';
    }
    
    // 3초 후 저장된 연결 목록 화면으로 전환
    setTimeout(() => {
      // 현재 입력된 값 가져오기
      const name = document.getElementById('connection-name').value;
      
      // 연결 목록에 추가
      let connectionList = document.getElementById('connection-list');
      if (!connectionList) {
        // 연결 목록이 없으면 생성
        const formContainer = document.getElementById('form-container');
        formContainer.innerHTML = ''; // 폼 컨테이너 내용 지우기
        
        const listContainer = document.createElement('div');
        listContainer.className = 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow';
        
        const heading = document.createElement('h2');
        heading.className = 'text-lg font-semibold mb-3';
        heading.textContent = '저장된 연결';
        listContainer.appendChild(heading);
        
        connectionList = document.createElement('div');
        connectionList.id = 'connection-list';
        connectionList.className = 'space-y-3';
        listContainer.appendChild(connectionList);
        
        const addButton = document.createElement('button');
        addButton.className = 'mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors';
        addButton.textContent = '새 연결 추가';
        addButton.onclick = () => window.location.reload();
        listContainer.appendChild(addButton);
        
        formContainer.appendChild(listContainer);
      }
      
      // 새 연결 항목 추가
      const connectionItem = document.createElement('div');
      connectionItem.className = 'flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md';
      
      const connectionInfo = document.createElement('div');
      connectionInfo.innerHTML = `
        <div class="font-medium">${name || '새 연결'}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">localhost:3306 - mydatabase</div>
      `;
      
      const buttonGroup = document.createElement('div');
      buttonGroup.innerHTML = `
        <button class="px-2 py-1 text-xs bg-blue-600 text-white rounded mr-2">편집</button>
        <button class="px-2 py-1 text-xs bg-red-600 text-white rounded">삭제</button>
      `;
      
      connectionItem.appendChild(connectionInfo);
      connectionItem.appendChild(buttonGroup);
      connectionList.appendChild(connectionItem);
    }, 1500);
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">데이터베이스 연결</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        데이터베이스 연결을 추가하고 관리하세요.
      </p>
      <div id="form-container">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">새 연결 추가</h2>
          <form id="connection-form" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">연결 이름</label>
              <input 
                id="connection-name"
                type="text" 
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md" 
                placeholder="내 데이터베이스"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">호스트</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md" 
                placeholder="localhost"
                defaultValue="localhost"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">포트</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md" 
                placeholder="3306"
                defaultValue="3306"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">사용자명</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md" 
                placeholder="root"
                defaultValue="root"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">비밀번호</label>
              <input 
                type="password" 
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md" 
                placeholder="**********"
                defaultValue="password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">데이터베이스</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md" 
                placeholder="mydatabase"
                defaultValue="mydatabase"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                onClick={showTestResult}
              >
                연결 테스트
              </button>
              <button 
                type="button" 
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                onClick={saveConnection}
              >
                연결 저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// 설정 컴포넌트
const Settings = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">설정</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">사용자 설정</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">테마</label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md">
                <option>라이트 모드</option>
                <option>다크 모드</option>
                <option>시스템 설정 사용</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">언어</label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md">
                <option>한국어</option>
                <option>English</option>
              </select>
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>결과 자동 새로고침</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">데이터 설정</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">기본 페이지 크기</label>
              <select className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md">
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">타임아웃 (초)</label>
              <input 
                type="number" 
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md" 
                placeholder="30"
                defaultValue="30"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>NULL 값 강조 표시</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// NotFound 컴포넌트
const NotFound = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mt-4">페이지를 찾을 수 없습니다</p>
        <a 
          href="/" 
          className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
};

// 앱 라우팅 설정
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/login" element={<Login />} />
        
        {/* 보호된 라우트 - 레이아웃 포함 */}
        <Route path="/" element={
          <MainLayout>
            <Dashboard />
          </MainLayout>
        } />
        
        <Route path="/database" element={
          <MainLayout>
            <DatabaseConnections />
          </MainLayout>
        } />
        
        <Route path="/tables" element={
          <MainLayout>
            <TableBrowser />
          </MainLayout>
        } />
        
        <Route path="/query-builder" element={
          <MainLayout>
            <QueryBuilder />
          </MainLayout>
        } />
        
        <Route path="/settings" element={
          <MainLayout>
            <Settings />
          </MainLayout>
        } />
        
        {/* 404 페이지 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

// React 19 createRoot API를 사용하여 앱 마운트
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <FirebaseProvider>
        <AppRoutes />
      </FirebaseProvider>
    </ErrorBoundary>
  </StrictMode>,
)

// 명시적 환경 확인을 위한 data 속성 추가
document.documentElement.dataset.appEnvironment = 'development'
