import React, { createContext, useState, useContext, ReactNode } from 'react';
import Toast from '../components/ui/Toast';

interface ToastContextProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
}

// Create context with default empty function
const ToastContext = createContext<ToastContextProps>({
  showToast: () => {},
});

// Custom hook to use the toast context
export const useToast = () => useContext(ToastContext);

interface ToastProviderProps {
  children: ReactNode;
}

// Toast state interface
interface ToastState {
  open: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}

// Toast provider component
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    type: 'success',
    duration: 3000,
  });

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
    duration: number = 3000
  ) => {
    // Close any existing toast first
    if (toast.open) {
      setToast(prev => ({ ...prev, open: false }));
      
      // Wait for animation to complete before showing new toast
      setTimeout(() => {
        setToast({
          open: true,
          message,
          type,
          duration,
        });
      }, 300);
    } else {
      setToast({
        open: true,
        message,
        type,
        duration,
      });
    }
  };

  const handleClose = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onClose={handleClose}
      />
    </ToastContext.Provider>
  );
};

export default ToastContext;