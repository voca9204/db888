import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { getUserProfile } from '../firebase/auth';
import type { User, UserProfile } from '../firebase/auth';

interface FirebaseContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
});

export const useFirebase = () => useContext(FirebaseContext);

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider = ({ children }: FirebaseProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user as User | null);
      
      if (user) {
        const profile = await getUserProfile(user as User);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
