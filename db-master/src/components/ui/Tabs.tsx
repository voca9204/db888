import React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, children }) => {
  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center px-4 py-2 -mb-px text-sm font-medium ${
              activeTab === tab.id
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && (
              <tab.icon className="w-4 h-4 mr-2" />
            )}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
};

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, children }) => {
  return (
    <div id={`panel-${id}`}>
      {children}
    </div>
  );
};
