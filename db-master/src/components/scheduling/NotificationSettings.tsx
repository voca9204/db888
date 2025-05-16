import React, { useState } from 'react';
import { NotificationChannel } from '../../firebase/models/scheduling';
import { 
  MessageSquare, 
  Mail, 
  ExternalLink, 
  Plus, 
  Trash2, 
  HelpCircle 
} from 'lucide-react';
import { Button, Input, Select, Checkbox } from '../ui';

type NotificationSettingsProps = {
  notifications: {
    enabled: boolean;
    channels: NotificationChannel[];
    recipients?: string[];
    webhookConfig?: {
      url: string;
      method: 'GET' | 'POST' | 'PUT';
      headers?: Record<string, string>;
      includeResults?: boolean;
    };
  };
  onChange: (notifications: any) => void;
};

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ 
  notifications, 
  onChange 
}) => {
  const [showAddHeader, setShowAddHeader] = useState(false);
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');
  
  // 채널 선택 핸들러
  const handleChannelToggle = (channel: NotificationChannel) => {
    const currentChannels = notifications.channels || [];
    
    if (currentChannels.includes(channel)) {
      onChange({
        channels: currentChannels.filter(c => c !== channel),
      });
    } else {
      onChange({
        channels: [...currentChannels, channel],
      });
    }
  };
  
  // 수신자 추가 핸들러
  const handleAddRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    
    const email = e.currentTarget.value.trim();
    if (!email) return;
    
    // 이메일 형식 확인
    if (!isValidEmail(email)) return;
    
    const currentRecipients = notifications.recipients || [];
    
    if (!currentRecipients.includes(email)) {
      onChange({
        recipients: [...currentRecipients, email],
      });
      
      e.currentTarget.value = '';
    }
  };
  
  // 수신자 제거 핸들러
  const handleRemoveRecipient = (email: string) => {
    const currentRecipients = notifications.recipients || [];
    
    onChange({
      recipients: currentRecipients.filter(r => r !== email),
    });
  };
  
  // 웹훅 URL 변경 핸들러
  const handleWebhookUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const webhookConfig = notifications.webhookConfig || {
      url: '',
      method: 'POST',
      includeResults: true,
      headers: {},
    };
    
    onChange({
      webhookConfig: {
        ...webhookConfig,
        url: e.target.value,
      },
    });
  };
  
  // 웹훅 메소드 변경 핸들러
  const handleWebhookMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const webhookConfig = notifications.webhookConfig || {
      url: '',
      method: 'POST',
      includeResults: true,
      headers: {},
    };
    
    onChange({
      webhookConfig: {
        ...webhookConfig,
        method: e.target.value as 'GET' | 'POST' | 'PUT',
      },
    });
  };
  
  // 웹훅 헤더 추가 핸들러
  const handleAddHeader = () => {
    if (!headerKey.trim() || !headerValue.trim()) return;
    
    const webhookConfig = notifications.webhookConfig || {
      url: '',
      method: 'POST',
      includeResults: true,
      headers: {},
    };
    
    const headers = webhookConfig.headers || {};
    
    onChange({
      webhookConfig: {
        ...webhookConfig,
        headers: {
          ...headers,
          [headerKey.trim()]: headerValue.trim(),
        },
      },
    });
    
    setHeaderKey('');
    setHeaderValue('');
    setShowAddHeader(false);
  };
  
  // 웹훅 헤더 제거 핸들러
  const handleRemoveHeader = (key: string) => {
    const webhookConfig = notifications.webhookConfig || {
      url: '',
      method: 'POST',
      includeResults: true,
      headers: {},
    };
    
    const headers = { ...webhookConfig.headers };
    delete headers[key];
    
    onChange({
      webhookConfig: {
        ...webhookConfig,
        headers,
      },
    });
  };
  
  // 웹훅 결과 포함 여부 변경 핸들러
  const handleIncludeResultsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const webhookConfig = notifications.webhookConfig || {
      url: '',
      method: 'POST',
      includeResults: true,
      headers: {},
    };
    
    onChange({
      webhookConfig: {
        ...webhookConfig,
        includeResults: e.target.checked,
      },
    });
  };
  
  // 이메일 유효성 검사
  const isValidEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-2">Notification Channels</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={notifications.channels.includes(NotificationChannel.EMAIL)}
              onChange={() => handleChannelToggle(NotificationChannel.EMAIL)}
              className="mr-2"
            />
            <Mail className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
            <span>Email</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={notifications.channels.includes(NotificationChannel.PUSH)}
              onChange={() => handleChannelToggle(NotificationChannel.PUSH)}
              className="mr-2"
            />
            <MessageSquare className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
            <span>Push Notification</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={notifications.channels.includes(NotificationChannel.WEBHOOK)}
              onChange={() => handleChannelToggle(NotificationChannel.WEBHOOK)}
              className="mr-2"
            />
            <ExternalLink className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
            <span>Webhook</span>
          </label>
        </div>
      </div>
      
      {notifications.channels.includes(NotificationChannel.EMAIL) && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium mb-2">Email Recipients</h4>
          
          <div>
            <Input
              placeholder="Enter email address and press Enter"
              onKeyDown={handleAddRecipient}
            />
          </div>
          
          <div className="space-y-2">
            {(notifications.recipients || []).length === 0 ? (
              <p className="text-sm italic text-gray-500 dark:text-gray-400">
                No recipients added. Notifications will be sent to your account email.
              </p>
            ) : (
              <ul className="space-y-2">
                {(notifications.recipients || []).map((email) => (
                  <li key={email} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                    <span className="text-sm">{email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveRecipient(email)}
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      
      {notifications.channels.includes(NotificationChannel.WEBHOOK) && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Webhook Configuration</h4>
            <div className="relative group">
              <HelpCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <div className="hidden group-hover:block absolute right-0 w-64 p-2 bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 text-xs z-10">
                <p>Webhook will receive a JSON payload with execution details.</p>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <Input
              placeholder="https://example.com/webhook"
              value={(notifications.webhookConfig?.url || '')}
              onChange={handleWebhookUrlChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Method</label>
            <Select
              value={(notifications.webhookConfig?.method || 'POST')}
              onChange={handleWebhookMethodChange}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </Select>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Headers</label>
              {!showAddHeader && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddHeader(true)}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Header
                </Button>
              )}
            </div>
            
            {showAddHeader && (
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                <div className="flex items-center space-x-2 mb-2">
                  <Input
                    placeholder="Header Name"
                    value={headerKey}
                    onChange={(e) => setHeaderKey(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={headerValue}
                    onChange={(e) => setHeaderValue(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddHeader(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddHeader}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
            
            {Object.keys(notifications.webhookConfig?.headers || {}).length === 0 ? (
              <p className="text-sm italic text-gray-500 dark:text-gray-400">
                No custom headers. Default Content-Type: application/json will be used.
              </p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(notifications.webhookConfig?.headers || {}).map(([key, value]) => (
                  <li key={key} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                    <div>
                      <span className="text-sm font-medium">{key}: </span>
                      <span className="text-sm">{value as string}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveHeader(key)}
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div>
            <label className="flex items-center">
              <Checkbox
                checked={notifications.webhookConfig?.includeResults ?? true}
                onChange={handleIncludeResultsChange}
              />
              <span className="ml-2">Include query results in webhook payload</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
