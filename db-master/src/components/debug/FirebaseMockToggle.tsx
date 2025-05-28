import React from 'react';
import { toggleMockMode } from '../firebase/functions.provider';

/**
 * Firebase 모의 모드를 활성화/비활성화하기 위한 개발자 도구 컴포넌트
 */
const FirebaseMockToggle: React.FC = () => {
  const [mockEnabled, setMockEnabled] = React.useState(
    localStorage.getItem('USE_MOCK_FUNCTIONS') === 'true'
  );

  const handleToggle = () => {
    const newValue = toggleMockMode();
    setMockEnabled(newValue);
  };

  // 개발 모드에서만 표시
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg z-50 text-sm">
      <div className="flex items-center space-x-2">
        <span>Firebase 모의 모드:</span>
        <button
          onClick={handleToggle}
          className={`px-3 py-1 rounded ${
            mockEnabled
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {mockEnabled ? '켜짐' : '꺼짐'}
        </button>
      </div>
      <div className="mt-1 text-xs text-gray-400">
        {mockEnabled
          ? '현재 Firebase 함수 대신 모의 데이터가 사용됩니다.'
          : '현재 실제 Firebase 함수가 사용됩니다.'}
      </div>
      <div className="mt-1 text-xs text-gray-400">
        변경 후 페이지를 새로고침해야 적용됩니다
      </div>
    </div>
  );
};

export default FirebaseMockToggle;
