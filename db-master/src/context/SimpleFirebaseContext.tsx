import { createContext, useContext, ReactNode } from 'react';

// 간소화된 FirebaseContext
interface FirebaseContextType {
  currentUser: null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  currentUser: null,
  loading: false,
});

export const useFirebase = () => useContext(FirebaseContext);

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider = ({ children }: FirebaseProviderProps) => {
  // 간소화된 FirebaseProvider로 Firebase 초기화 없이 작동
  const value = {
    currentUser: null,
    loading: false,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
