import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// 간단한 사이드바 링크 컴포넌트
const SidebarLink = ({ to, icon, label }: { to: string; icon: string; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`flex items-center py-2 px-4 rounded-md ${
        isActive
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
      }`}
    >
      <span className="mr-2">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">DB Master</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                ☰
              </button>
              
              <div className="hidden md:flex items-center ml-4">
                <div className="ml-3 relative">
                  <div className="flex items-center">
                    <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                      사용자
                    </span>
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-medium">U</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* 사이드바 */}
        <aside className={`
          ${isMobileMenuOpen ? 'block' : 'hidden'} 
          md:block md:w-64 h-screen bg-white dark:bg-gray-800 shadow
        `}>
          <div className="p-4">
            <nav className="space-y-2">
              <SidebarLink to="/" icon="📊" label="대시보드" />
              <SidebarLink to="/database" icon="🗃️" label="데이터베이스 연결" />
              <SidebarLink to="/tables" icon="📋" label="테이블 브라우저" />
              <SidebarLink to="/query-builder" icon="🔍" label="쿼리 빌더" />
              <SidebarLink to="/settings" icon="⚙️" label="설정" />
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <a 
                  href="/login" 
                  className="flex items-center py-2 px-4 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <span className="mr-2">🚪</span>
                  <span>로그아웃</span>
                </a>
              </div>
            </nav>
          </div>
        </aside>
        
        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
