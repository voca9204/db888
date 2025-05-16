import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Textarea, Checkbox, Badge } from '../ui';
import { XIcon, PlusIcon } from '../icons';
import { QueryTemplateModel } from '../../firebase';
import { QueryTemplate } from '../../types/store';
import { extractParameters } from '../../utils/parameterUtils';
import ParameterEditor from './ParameterEditor';

interface SaveTemplateModalProps {
  template?: QueryTemplate | null;
  onClose: (templateSaved: boolean) => void;
  sql?: string;
  queryState?: any;
}

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  template,
  onClose,
  sql: initialSql,
  queryState: initialQueryState,
}) => {
  // 상태 관리
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [sql, setSql] = useState(template?.sql || initialSql || '');
  const [isPublic, setIsPublic] = useState(template?.isPublic || false);
  const [tags, setTags] = useState<string[]>(template?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parameters, setParameters] = useState(template?.parameters || []);
  const [showParameterEditor, setShowParameterEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'parameters'>('basic');
  
  // SQL이 변경될 때 파라미터 자동 추출
  useEffect(() => {
    if (sql) {
      const extractedParams = extractParameters(sql);
      // 기존 파라미터와 병합 (이름 기준)
      const mergedParams = extractedParams.map(param => {
        const existing = parameters.find(p => p.name === param.name);
        return existing || param;
      });
      
      // 기존에 있었지만 추출되지 않은 파라미터는 유지
      parameters.forEach(param => {
        if (!mergedParams.some(p => p.name === param.name)) {
          mergedParams.push(param);
        }
      });
      
      setParameters(mergedParams);
    }
  }, [sql]);
  
  // 폼 유효성 검사
  const isFormValid = () => {
    if (!name.trim()) {
      setError('템플릿 이름은 필수입니다.');
      return false;
    }
    
    if (!sql.trim()) {
      setError('SQL 쿼리는 필수입니다.');
      return false;
    }
    
    return true;
  };
  
  // 태그 추가 핸들러
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  // 태그 삭제 핸들러
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // 엔터 키로 태그 추가
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  // 저장 핸들러
  const handleSave = async () => {
    if (!isFormValid()) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const templateData = {
        name,
        description,
        sql,
        parameters,
        tags,
        isPublic,
        queryState: template?.queryState || initialQueryState || null,
      };
      
      if (template) {
        // 기존 템플릿 업데이트
        await QueryTemplateModel.update(template.id, templateData);
      } else {
        // 새 템플릿 저장
        await QueryTemplateModel.create(templateData as any);
      }
      
      onClose(true);
    } catch (error) {
      console.error('Error saving template:', error);
      setError('템플릿 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Modal
      title={template ? '템플릿 편집' : '새 템플릿 저장'}
      onClose={() => onClose(false)}
      size="xl"
    >
      <div className="space-y-4">
        {/* 탭 네비게이션 */}
        <div className="border-b flex">
          <button
            className={`p-2 px-4 ${
              activeTab === 'basic'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            onClick={() => setActiveTab('basic')}
          >
            기본 정보
          </button>
          <button
            className={`p-2 px-4 ${
              activeTab === 'parameters'
                ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            onClick={() => setActiveTab('parameters')}
          >
            파라미터 ({parameters.length})
          </button>
        </div>
        
        {activeTab === 'basic' && (
          <>
            <div className="space-y-4">
              <div>
                <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  템플릿 이름 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="templateName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="템플릿 이름을 입력하세요"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="templateDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명
                </label>
                <Textarea
                  id="templateDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="템플릿에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>
              
              <div>
                <label htmlFor="templateSql" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  SQL 쿼리 <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="templateSql"
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  placeholder="SQL 쿼리를 입력하세요"
                  rows={6}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  파라미터 형식: {'{{paramName:type?defaultValue:description}}'}
                </p>
              </div>
              
              <div>
                <label htmlFor="templateTags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  태그
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    id="templateTags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="태그 추가"
                    onKeyDown={handleTagKeyDown}
                  />
                  <Button variant="outline" onClick={handleAddTag} disabled={!tagInput.trim()}>
                    <PlusIcon className="w-5 h-5" />
                  </Button>
                </div>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} color="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500"
                          aria-label="Remove tag"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center">
                <Checkbox
                  id="templateIsPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <label htmlFor="templateIsPublic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  공개 템플릿으로 설정 (모든 사용자가 볼 수 있음)
                </label>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'parameters' && (
          <ParameterEditor
            parameters={parameters}
            onParametersChange={setParameters}
            sql={sql}
          />
        )}
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            color="primary"
            onClick={handleSave}
            loading={saving}
          >
            {template ? '저장' : '템플릿 생성'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SaveTemplateModal;