import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ScheduledQueryModel,
  ScheduleFrequency,
  NotificationChannel,
  AlertConditionType,
  ComparisonOperator,
  FirestoreScheduledQuery
} from '../../firebase/models/scheduling';
import {
  Save,
  ArrowLeft,
  Clock,
  Bell,
  AlertTriangle,
  Trash2,
  MailCheck,
  ExternalLink
} from 'lucide-react';
import { Button, Card, Input, Select, Textarea, Checkbox } from '../../components/ui';
import ScheduleSettings from '../../components/scheduling/ScheduleSettings';
import AlertConditions from '../../components/scheduling/AlertConditions';
import NotificationSettings from '../../components/scheduling/NotificationSettings';
import useDbConnectionStore from '../../store/core/dbConnectionStore';
import useQueryStore from '../../store/core/queryStore';
import { QueryTemplateModel } from '../../firebase/models/QueryTemplateModel';
import { useFirebase } from '../../context/FirebaseContext';

type FormData = {
  name: string;
  description: string;
  connectionId: string;
  templateId?: string;
  sql: string;
  parameters: Array<{
    name: string;
    type: string;
    value: any;
  }>;
  frequency: ScheduleFrequency;
  schedule: {
    startTime: Date;
    endTime?: Date;
    timeZone: string;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    hour?: number;
    minute?: number;
    cronExpression?: string;
  };
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
    alertConditions?: {
      type: AlertConditionType;
      operator?: ComparisonOperator;
      value?: number | string;
      columnName?: string;
      expression?: string;
    }[];
  };
  maxHistoryRetention: number;
  active: boolean;
  queryState?: any;
};

const ScheduledQueryForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useFirebase();
  
  const [loading, setLoading] = useState(false);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const connections = useDbConnectionStore(state => state.connections);
  const queryState = useQueryStore(state => state.queryState);
  const generatedSql = ""; // TODO: 쿼리 빌더 상태로부터 SQL 생성 로직 추가
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    connectionId: '',
    sql: '',
    parameters: [],
    frequency: ScheduleFrequency.DAILY,
    schedule: {
      startTime: new Date(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hour: 0,
      minute: 0,
    },
    notifications: {
      enabled: true,
      channels: [NotificationChannel.EMAIL],
      recipients: [],
      alertConditions: [
        {
          type: AlertConditionType.ALWAYS,
        }
      ],
    },
    maxHistoryRetention: 30,
    active: true,
    queryState: undefined,
  });
  
  const [useQueryBuilder, setUseQueryBuilder] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  // 템플릿 목록 로드
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        if (!currentUser) return;
        
        const fetchedTemplates = await QueryTemplateModel.listForUser(
          currentUser.uid,
          true // 공유받은 템플릿 포함
        );
        
        setTemplates(fetchedTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };
    
    loadTemplates();
  }, [currentUser]);
  
  // 기존 스케줄링된 쿼리 로드
  useEffect(() => {
    const loadScheduledQuery = async () => {
      if (!id) return;
      
      try {
        setLoadingQuery(true);
        setError(null);
        
        const query = await ScheduledQueryModel.getById(id);
        
        if (!query) {
          setError('Scheduled query not found');
          return;
        }
        
        // 일부 필드 변환
        const formattedQuery = {
          ...query,
          schedule: {
            ...query.schedule,
            startTime: query.schedule.startTime.toDate(),
            endTime: query.schedule.endTime?.toDate(),
          }
        };
        
        setFormData(formattedQuery);
        
        if (query.templateId) {
          setUseTemplate(true);
          setSelectedTemplateId(query.templateId);
        }
        
        if (query.queryState) {
          setUseQueryBuilder(true);
        }
      } catch (error) {
        console.error('Error loading scheduled query:', error);
        setError('Failed to load scheduled query');
      } finally {
        setLoadingQuery(false);
      }
    };
    
    loadScheduledQuery();
  }, [id]);
  
  // 템플릿 선택 처리
  useEffect(() => {
    const loadTemplate = async () => {
      if (!selectedTemplateId) return;
      
      try {
        const template = await QueryTemplateModel.getById(selectedTemplateId);
        
        if (!template) return;
        
        setFormData(prev => ({
          ...prev,
          sql: template.sql,
          parameters: template.parameters?.map(p => ({
            name: p.name,
            type: p.type,
            value: p.defaultValue,
          })) || [],
          templateId: selectedTemplateId,
          queryState: template.queryState,
        }));
        
        if (template.queryState) {
          setUseQueryBuilder(true);
        }
      } catch (error) {
        console.error('Error loading template:', error);
      }
    };
    
    loadTemplate();
  }, [selectedTemplateId]);
  
  // 쿼리 빌더 상태 변경 처리
  useEffect(() => {
    if (useQueryBuilder && !useTemplate) {
      setFormData(prev => ({
        ...prev,
        sql: generatedSql || '',
        queryState,
      }));
    }
  }, [useQueryBuilder, queryState, generatedSql, useTemplate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handleScheduleChange = (schedule: any) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        ...schedule,
      },
    }));
  };
  
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const frequency = e.target.value as ScheduleFrequency;
    
    // 빈도에 따른 기본 스케줄 설정
    let defaultSchedule = {};
    
    switch (frequency) {
      case ScheduleFrequency.ONCE:
        defaultSchedule = {};
        break;
      
      case ScheduleFrequency.HOURLY:
        defaultSchedule = {
          minute: 0,
        };
        break;
      
      case ScheduleFrequency.DAILY:
        defaultSchedule = {
          hour: 0,
          minute: 0,
        };
        break;
      
      case ScheduleFrequency.WEEKLY:
        defaultSchedule = {
          daysOfWeek: [1], // 월요일
          hour: 0,
          minute: 0,
        };
        break;
      
      case ScheduleFrequency.MONTHLY:
        defaultSchedule = {
          dayOfMonth: 1,
          hour: 0,
          minute: 0,
        };
        break;
      
      case ScheduleFrequency.CUSTOM:
        defaultSchedule = {
          cronExpression: '0 0 * * *', // 매일 자정
        };
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      frequency,
      schedule: {
        ...prev.schedule,
        ...defaultSchedule,
      },
    }));
  };
  
  const handleNotificationChange = (notifications: any) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        ...notifications,
      },
    }));
  };
  
  const handleAlertConditionsChange = (alertConditions: any[]) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        alertConditions,
      },
    }));
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Firestore 저장을 위한 데이터 포맷
      const saveData = {
        ...formData,
        schedule: {
          ...formData.schedule,
          // Date 객체를 Firestore Timestamp로 변환
          startTime: formData.schedule.startTime,
          endTime: formData.schedule.endTime || null,
        },
      };
      
      if (id) {
        // 기존 쿼리 업데이트
        await ScheduledQueryModel.update(id, saveData);
      } else {
        // 새 쿼리 생성
        await ScheduledQueryModel.create(saveData);
      }
      
      // 성공 메시지
      navigate('/scheduled-queries');
    } catch (error) {
      console.error('Error saving scheduled query:', error);
      setError('Failed to save scheduled query');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!id) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this scheduled query?');
    
    if (!confirmed) return;
    
    try {
      setLoading(true);
      
      await ScheduledQueryModel.delete(id);
      
      // 성공 메시지
      navigate('/scheduled-queries');
    } catch (error) {
      console.error('Error deleting scheduled query:', error);
      setError('Failed to delete scheduled query');
    } finally {
      setLoading(false);
    }
  };
  
  const handleManualRun = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Firebase Function 호출
      // TODO: manualExecuteScheduledQuery Firebase Function 호출 코드 추가
      
      // 성공 메시지
    } catch (error) {
      console.error('Error executing scheduled query:', error);
      setError('Failed to execute scheduled query');
    } finally {
      setLoading(false);
    }
  };
  
  if (loadingQuery) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/scheduled-queries')}
          className="mr-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {id ? 'Edit Scheduled Query' : 'New Scheduled Query'}
        </h1>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 p-4 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSave} className="space-y-8">
        <Card title="Query Details">
          <div className="space-y-4 p-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Daily Sales Report"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Generate daily sales report from transactions table"
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Database Connection</label>
              <Select
                name="connectionId"
                value={formData.connectionId}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select a connection</option>
                {connections.map(conn => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name} ({conn.host}:{conn.port}/{conn.database})
                  </option>
                ))}
              </Select>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Query Source</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!useTemplate && !useQueryBuilder}
                      onChange={() => {
                        setUseTemplate(false);
                        setUseQueryBuilder(false);
                      }}
                      className="mr-2"
                    />
                    <span>Custom SQL</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={useTemplate}
                      onChange={() => {
                        setUseTemplate(true);
                        setUseQueryBuilder(false);
                      }}
                      className="mr-2"
                    />
                    <span>Template</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!useTemplate && useQueryBuilder}
                      onChange={() => {
                        setUseTemplate(false);
                        setUseQueryBuilder(true);
                      }}
                      className="mr-2"
                    />
                    <span>Query Builder</span>
                  </label>
                </div>
              </div>
              
              {useTemplate ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Query Template</label>
                  <Select
                    value={selectedTemplateId || ''}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </Select>
                  {selectedTemplateId && (
                    <div className="mt-2">
                      <a 
                        href={`/query-templates/${selectedTemplateId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                      >
                        View Template <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              ) : useQueryBuilder ? (
                <div>
                  <div className="mb-2 flex justify-between items-center">
                    <label className="block text-sm font-medium">Query Builder</label>
                    <a 
                      href="/query-builder"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                    >
                      Open Query Builder <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Using current query builder state.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">SQL Query</label>
                  <Textarea
                    name="sql"
                    value={formData.sql}
                    onChange={handleChange}
                    placeholder="SELECT * FROM orders WHERE order_date >= DATE_SUB(NOW(), INTERVAL 1 DAY)"
                    rows={5}
                    required
                  />
                </div>
              )}
              
              {formData.parameters.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Parameters</h4>
                  <div className="space-y-3">
                    {formData.parameters.map((param, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {param.name} ({param.type})
                          </label>
                          <Input
                            value={param.value || ''}
                            onChange={(e) => {
                              const newParams = [...formData.parameters];
                              newParams[index].value = e.target.value;
                              setFormData(prev => ({ ...prev, parameters: newParams }));
                            }}
                            placeholder={`Value for ${param.name}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
        
        <Card title="Schedule">
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Frequency</label>
              <Select
                value={formData.frequency}
                onChange={handleFrequencyChange}
              >
                <option value={ScheduleFrequency.ONCE}>Once</option>
                <option value={ScheduleFrequency.HOURLY}>Hourly</option>
                <option value={ScheduleFrequency.DAILY}>Daily</option>
                <option value={ScheduleFrequency.WEEKLY}>Weekly</option>
                <option value={ScheduleFrequency.MONTHLY}>Monthly</option>
                <option value={ScheduleFrequency.CUSTOM}>Custom (CRON)</option>
              </Select>
            </div>
            
            <ScheduleSettings 
              frequency={formData.frequency}
              schedule={formData.schedule}
              onChange={handleScheduleChange}
            />
            
            <div className="mt-4">
              <label className="flex items-center">
                <Checkbox
                  name="active"
                  checked={formData.active}
                  onChange={handleCheckboxChange}
                />
                <span className="ml-2">Active</span>
              </label>
            </div>
          </div>
        </Card>
        
        <Card title="Notifications">
          <div className="p-4">
            <div className="mb-4">
              <label className="flex items-center">
                <Checkbox
                  checked={formData.notifications.enabled}
                  onChange={(e) => {
                    handleNotificationChange({ enabled: e.target.checked });
                  }}
                />
                <span className="ml-2">Enable notifications</span>
              </label>
            </div>
            
            {formData.notifications.enabled && (
              <>
                <NotificationSettings 
                  notifications={formData.notifications}
                  onChange={handleNotificationChange}
                />
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Alert Conditions</h4>
                  
                  <AlertConditions 
                    conditions={formData.notifications.alertConditions || []}
                    onChange={handleAlertConditionsChange}
                  />
                </div>
              </>
            )}
          </div>
        </Card>
        
        <Card title="History Retention">
          <div className="p-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Keep execution history for
              </label>
              <div className="flex items-center">
                <Input
                  type="number"
                  name="maxHistoryRetention"
                  value={formData.maxHistoryRetention}
                  onChange={handleChange}
                  min={1}
                  max={365}
                  className="w-24"
                />
                <span className="ml-2">days</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Execution results older than this will be automatically deleted
              </p>
            </div>
          </div>
        </Card>
        
        <div className="flex justify-between items-center">
          <div>
            {id && (
              <Button 
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          
          <div className="flex space-x-4">
            {id && (
              <Button 
                type="button"
                variant="secondary"
                onClick={handleManualRun}
                disabled={loading}
              >
                <Clock className="w-4 h-4 mr-2" />
                Run Now
              </Button>
            )}
            
            <Button 
              type="submit"
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {id ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ScheduledQueryForm;
