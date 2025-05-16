import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '../../ui';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import QueryTemplateModel from '../../../firebase/models/QueryTemplateModel';
import useQueryStore from '../../../store/core/queryStore';
import { QueryTemplateParameter } from '../../../types/store';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateId: string) => void;
  sql: string;
}

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  sql,
}) => {
  const { queryState } = useQueryStore();
  
  // 폼 상태
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // 매개변수 상태
  const [parameters, setParameters] = useState<QueryTemplateParameter[]>([]);
  const [showParams, setShowParams] = useState(false);
  
  // 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 새 매개변수 상태
  const [newParam, setNewParam] = useState<QueryTemplateParameter>({
    name: '',
    type: 'string',
    required: true,
    description: '',
  });
  
  // 템플릿 저장
  const saveTemplate = async () => {
    if (!name.trim()) {
      setError('Template name is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 쿼리 템플릿 생성
      const templateId = await QueryTemplateModel.create({
        name,
        description,
        sql,
        parameters,
        tags,
        isPublic,
        userId: '', // 모델에서 현재 사용자 ID로 설정됨
        queryState,
      });
      
      // 성공 시 콜백 호출
      onSave(templateId);
      
      // 모달 닫기
      onClose();
    } catch (err) {
      console.error('Error saving template:', err);
      setError(`Failed to save template: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 태그 추가
  const addTag = () => {
    if (!newTag.trim()) return;
    if (!tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
    }
    setNewTag('');
  };
  
  // 태그 제거
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // 매개변수 추가
  const addParameter = () => {
    if (!newParam.name.trim()) {
      setError('Parameter name is required');
      return;
    }
    
    // 이름 중복 검사
    if (parameters.some(p => p.name === newParam.name.trim())) {
      setError(`Parameter with name "${newParam.name}" already exists`);
      return;
    }
    
    // 매개변수 추가
    setParameters([...parameters, { ...newParam, name: newParam.name.trim() }]);
    
    // 새 매개변수 폼 초기화
    setNewParam({
      name: '',
      type: 'string',
      required: true,
      description: '',
    });
    
    setError(null);
  };
  
  // 매개변수 제거
  const removeParameter = (paramName: string) => {
    setParameters(parameters.filter(p => p.name !== paramName));
  };
  
  // SQL에서 매개변수 감지
  useEffect(() => {
    if (sql) {
      // :paramName 형식의 매개변수 찾기
      const paramRegex = /:([a-zA-Z][a-zA-Z0-9_]*)/g;
      const matches = [...sql.matchAll(paramRegex)];
      
      if (matches.length > 0) {
        // 중복 제거
        const uniqueParams = [...new Set(matches.map(m => m[1]))];
        
        // 기존 매개변수와 비교하여 추가
        const existingParamNames = parameters.map(p => p.name);
        const newParams: QueryTemplateParameter[] = [];
        
        uniqueParams.forEach(paramName => {
          if (!existingParamNames.includes(paramName)) {
            newParams.push({
              name: paramName,
              type: 'string',
              required: true,
              description: `Parameter: ${paramName}`,
            });
          }
        });
        
        // 새 매개변수가 있으면 추가하고 매개변수 섹션 표시
        if (newParams.length > 0) {
          setParameters([...parameters, ...newParams]);
          setShowParams(true);
        }
      }
    }
  }, [sql]); // eslint-disable-line react-hooks/exhaustive-deps
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save Query Template"
      size="lg"
    >
      <div className="space-y-4">
        {/* 템플릿 정보 */}
        <div className="space-y-4">
          <Input
            label="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name for your template"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="isPublic"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
            />
            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Make this template public (visible to all users)
            </label>
          </div>
        </div>
        
        {/* 태그 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags
          </label>
          <div className="flex items-start gap-2">
            <div className="flex-grow">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
            </div>
            <Button 
              variant="secondary" 
              onClick={addTag}
              disabled={!newTag.trim()}
            >
              Add
            </Button>
          </div>
          
          {/* 태그 목록 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded-md text-sm"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 매개변수 */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Parameters
            </label>
            <button
              type="button"
              className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              onClick={() => setShowParams(!showParams)}
            >
              {showParams ? 'Hide' : 'Show'} Parameters
            </button>
          </div>
          
          {showParams && (
            <div className="mt-2 space-y-4">
              {/* 매개변수 목록 */}
              {parameters.length > 0 && (
                <div className="border dark:border-gray-700 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Required
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {parameters.map((param) => (
                        <tr key={param.name}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">
                            {param.name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">
                            {param.type}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">
                            {param.required ? 'Yes' : 'No'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">
                            {param.description || '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                            <button
                              type="button"
                              onClick={() => removeParameter(param.name)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* 새 매개변수 추가 폼 */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add New Parameter
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Name"
                    value={newParam.name}
                    onChange={(e) => setNewParam({ ...newParam, name: e.target.value })}
                    placeholder="Parameter name"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <Select
                      value={newParam.type}
                      onChange={(e) => setNewParam({ ...newParam, type: e.target.value as 'string' | 'number' | 'boolean' | 'date' })}
                      options={[
                        { value: 'string', label: 'String' },
                        { value: 'number', label: 'Number' },
                        { value: 'boolean', label: 'Boolean' },
                        { value: 'date', label: 'Date' },
                      ]}
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="paramRequired"
                      type="checkbox"
                      checked={newParam.required}
                      onChange={(e) => setNewParam({ ...newParam, required: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                    />
                    <label htmlFor="paramRequired" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Required
                    </label>
                  </div>
                  
                  <Input
                    label="Description"
                    value={newParam.description || ''}
                    onChange={(e) => setNewParam({ ...newParam, description: e.target.value })}
                    placeholder="Parameter description"
                  />
                </div>
                
                <div className="flex justify-end mt-3">
                  <Button
                    variant="secondary"
                    onClick={addParameter}
                    disabled={!newParam.name.trim()}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Parameter
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* SQL 미리보기 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            SQL Preview
          </label>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-auto max-h-40">
            <pre className="text-xs text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
              {sql}
            </pre>
          </div>
        </div>
        
        {/* 오류 메시지 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={saveTemplate}
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SaveTemplateModal;
