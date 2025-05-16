import React, { useEffect, useState } from 'react';
import { XMarkIcon as XIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ToastProps {
  open: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  open,
  message,
  type = 'success',
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300); // Wait for animation to complete
        }, duration);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [open, duration, onClose]);
  
  if (!open && !isVisible) return null;
  
  const typeStyles = {
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800',
  };
  
  const IconComponent = type === 'success' 
    ? CheckCircleIcon
    : type === 'error'
      ? ExclamationCircleIcon
      : InformationCircleIcon;
  
  const iconStyles = {
    success: 'text-green-500 dark:text-green-400',
    error: 'text-red-500 dark:text-red-400',
    info: 'text-blue-500 dark:text-blue-400',
  };
  
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center rounded-md border p-4 shadow-md transition-all duration-300 ${
        typeStyles[type]
      } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      role="alert"
    >
      <div className="flex items-center">
        <IconComponent className={`h-5 w-5 ${iconStyles[type]} mr-2`} />
        <div className="text-sm font-medium">{message}</div>
      </div>
      <button
        type="button"
        className="ml-4 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
      >
        <span className="sr-only">Close</span>
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;