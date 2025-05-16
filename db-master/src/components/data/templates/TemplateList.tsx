import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Input } from '../../ui';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  BookmarkIcon,
  ShareIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon,
  BookmarkSlashIcon,
  PencilIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import QueryTemplateModel from '../../../firebase/models/QueryTemplateModel';
import { QueryTemplate } from '../../../types/store';
import { useAuth } from '../../../hooks/useAuth';

interface TemplateListProps {
  onSelectTemplate: (template: QueryTemplate) => void;
  onCreateNew: () => void;
}

const TemplateList: React.FC<TemplateListProps> = ({
  onSelectTemplate,
  onCreateNew,
}) => {
  const { user } = useAuth();
  
  // 상태
  const [templates, setTemplates] = useState<QueryTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<QueryTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'my' | 'shared' | 'public'>('my');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // 템플릿 목록 로드
  const loadTemplates = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let loadedTemplates: QueryTemplate[] = [];
      
      switch (viewMode) {
        case 'my':
          loadedTemplates = await QueryTemplateModel.listForUser(user.uid, false, selectedTag);
          break;
        case 'shared':
          loadedTemplates = await QueryTemplateModel.listForUser(user.uid, true, selectedTag);
          // 내 템플릿은 제외
          loadedTemplates = loadedTemplates.filter(template => template.userId !== user.uid);
          break;
        case 'public':
          loadedTemplates = await QueryTemplateModel.listPublicTemplates(50, selectedTag);
          break;
        default:
          break;
      }
      
      setTemplates(loadedTemplates);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError(`Failed to load templates: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 태그 목록 로드
  const loadTags = async () => {
    if (!user) return;
    
    try {
      const tags = await QueryTemplateModel.getTags();
      setAvailableTags(tags);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };
  
  // 컴포넌트 마운트 시 템플릿 및 태그 로드
  useEffect(() => {
    if (user) {
      loadTemplates();
      loadTags();
    }
  }, [user, viewMode, selectedTag]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // 검색어 변경 시 템플릿 필터링
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTemplates(templates);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    
    const filtered = templates.filter((template) => 
      template.name.toLowerCase().includes(term) ||
      (template.description && template.description.toLowerCase().includes(term)) ||
      template.sql.toLowerCase().includes(term) ||
      template.tags?.some(tag => tag.toLowerCase().includes(term))
    );
    
    setFilteredTemplates(filtered);
  }, [searchTerm, templates]);
  
  // 템플릿 삭제
  const handleDeleteTemplate = async (template: QueryTemplate) => {
    if (!window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }
    
    try {
      await QueryTemplateModel.delete(template.id);
      // 목록 새로고침
      loadTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      alert(`Failed to delete template: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // 템플릿 공유 상태 토글
  const handleTogglePublic = async (template: QueryTemplate) => {
    try {
      await QueryTemplateModel.update(template.id, {
        isPublic: !template.isPublic,
      });
      // 목록 새로고침
      loadTemplates();
    } catch (err) {
      console.error('Error updating template:', err);
      alert(`Failed to update template: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // 템플릿 복제
  const handleCloneTemplate = async (template: QueryTemplate) => {
    try {
      await QueryTemplateModel.cloneTemplate(template.id);
      // 내 템플릿으로 전환하고 목록 새로고침
      setViewMode('my');
      loadTemplates();
    } catch (err) {
      console.error('Error cloning template:', err);
      alert(`Failed to clone template: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // 날짜 포맷
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Query Templates
        </h2>
        
        {/* 필터 및 검색 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="flex-grow relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <Button
              variant="primary"
              size="sm"
              onClick={onCreateNew}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === 'my'
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => setViewMode('my')}
            >
              My Templates
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === 'shared'
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => setViewMode('shared')}
            >
              Shared With Me
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === 'public'
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => setViewMode('public')}
            >
              Public Templates
            </button>
          </div>
          
          {availableTags.length > 0 && (
            <div className="flex items-center space-x-2">
              <TagIcon className="h-4 w-4 text-gray-400" />
              <Select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="text-sm flex-grow"
                options={[
                  { value: '', label: 'All Tags' },
                  ...availableTags.map(tag => ({ value: tag, label: tag })),
                ]}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* 템플릿 목록 */}
      <div className="flex-grow overflow-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 dark:text-gray-400">Loading templates...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-md text-sm">
            {error}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="mb-2">No templates found</div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onCreateNew}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Create New Template
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-grow cursor-pointer" onClick={() => onSelectTemplate(template)}>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                      {template.name}
                    </h3>
                    
                    {template.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {template.description.length > 100
                          ? `${template.description.substring(0, 100)}...`
                          : template.description}
                      </p>
                    )}
                  </div>
                  
                  {/* 공개 상태 표시 */}
                  {template.isPublic && (
                    <div className="ml-2 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-md">
                      Public
                    </div>
                  )}
                </div>
                
                {/* 메타데이터 및 태그 */}
                <div className="mt-2">
                  <div className="flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400 gap-x-4">
                    <div>
                      Updated: {formatDate(template.updatedAt)}
                    </div>
                    
                    {template.parameters && template.parameters.length > 0 && (
                      <div>
                        Parameters: {template.parameters.length}
                      </div>
                    )}
                    
                    {template.version && (
                      <div>
                        Version: {template.version}
                      </div>
                    )}
                  </div>
                  
                  {/* 태그 */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.tags.map((tag) => (
                        <div
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs rounded-md"
                        >
                          {tag}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* 액션 버튼 */}
                <div className="flex gap-2 mt-3 justify-end">
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => onSelectTemplate(template)}
                    title="Load Template"
                  >
                    Load
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => handleCloneTemplate(template)}
                    title="Clone Template"
                  >
                    <ClipboardDocumentCheckIcon className="h-4 w-4" />
                  </Button>
                  
                  {/* 내 템플릿인 경우에만 편집/삭제/공개 버튼 표시 */}
                  {user && template.userId === user.uid && (
                    <>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleTogglePublic(template)}
                        title={template.isPublic ? 'Make Private' : 'Make Public'}
                      >
                        {template.isPublic ? (
                          <BookmarkSlashIcon className="h-4 w-4" />
                        ) : (
                          <BookmarkIcon className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleDeleteTemplate(template)}
                        title="Delete Template"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TemplateList;
