import React, { useId } from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({ 
  checked, 
  onChange, 
  id, 
  disabled = false,
  className = '',
}) => {
  const generatedId = useId();
  const switchId = id || generatedId;

  return (
    <div className={className}>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
          transition-colors duration-200 ease-in-out
        `}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white
            transition-transform duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
};

export default Switch;
