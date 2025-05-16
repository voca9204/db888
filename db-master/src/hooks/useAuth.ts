import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  signIn, 
  signUp, 
  signOut, 
  signInWithGoogle, 
  resetPassword 
} from '../firebase/auth';
import { useFirebase } from '../context/FirebaseContext';

interface AuthError {
  code: string;
  message: string;
}

export interface UseAuthReturn {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: AuthError | null;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const { currentUser, userProfile, loading } = useFirebase();
  const [error, setError] = useState<AuthError | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Login with email and password
  const login = useCallback(async (email: string, password: string) => {
    try {
      clearError();
      await signIn(email, password);
      
      // Get the redirect path from location state or use default
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError({
        code: err.code || 'auth/unknown',
        message: err.message || 'An error occurred during sign in.'
      });
      throw err;
    }
  }, [clearError, navigate, location]);
  
  // Register with email, password, and display name
  const register = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      clearError();
      await signUp(email, password, displayName);
      
      // Automatically login after registration
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError({
        code: err.code || 'auth/unknown',
        message: err.message || 'An error occurred during registration.'
      });
      throw err;
    }
  }, [clearError, navigate]);
  
  // Logout
  const logout = useCallback(async () => {
    try {
      clearError();
      await signOut();
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError({
        code: err.code || 'auth/unknown',
        message: err.message || 'An error occurred during sign out.'
      });
      throw err;
    }
  }, [clearError, navigate]);
  
  // Login with Google
  const googleLogin = useCallback(async () => {
    try {
      clearError();
      await signInWithGoogle();
      
      // Get the redirect path from location state or use default
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError({
        code: err.code || 'auth/unknown',
        message: err.message || 'An error occurred during Google sign in.'
      });
      throw err;
    }
  }, [clearError, navigate, location]);
  
  // Reset password
  const forgotPassword = useCallback(async (email: string) => {
    try {
      clearError();
      await resetPassword(email);
    } catch (err: any) {
      setError({
        code: err.code || 'auth/unknown',
        message: err.message || 'An error occurred during password reset.'
      });
      throw err;
    }
  }, [clearError]);
  
  // Check if user is admin
  const isAdmin = userProfile?.role === 'admin';
  
  return {
    login,
    register,
    logout,
    googleLogin,
    forgotPassword,
    isAuthenticated: !!currentUser,
    isAdmin,
    isLoading: loading,
    error,
    clearError
  };
};
