import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Spinner, Tabs, Tab } from '../components/ui';
import { PlusIcon, SearchIcon, FilterIcon, ShareIcon, StarIcon, ClockIcon, TagIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { QueryTemplateModel, QueryTemplateShareModel } from '../firebase';
import { QueryTemplate } from '../types/store';
import SaveTemplateModal from '../components/templates/SaveTemplateModal';
import TemplateCard from '../components/templates/TemplateCard';
import TemplateShareModal from '../components/templates/TemplateShareModal';

const QueryTemplates: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 상태 관리
  const [templates, setTemplates] = useState<QueryTemplate[]>([]);
  const [sharedTemplates, setSharedTemplates] = useState<QueryTemplate[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<QueryTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<QueryTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<QueryTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('my');
  
  // 템플릿 로드
  const loadTemplates = async () => {
    setLoading(true);
    try {
      if (!user) return;
      
      // 내 템플릿
      const myTemplates = await QueryTemplateModel.listForUser();
      setTemplates(myTemplates);
      setFilteredTemplates(myTemplates);
      
      // 태그 목록
      const tagList = await QueryTemplateModel.getTags();
      setTags(tagList);
      
      // 나에게 공유된 템플릿 (추후 구현)
      const shared = await QueryTemplateModel.listForUser(undefined, true);
      const onlyShared = shared.filter(template => template.userId !== user.uid);
      setSharedTemplates(onlyShared);
      
      // 공개 템플릿
      const publicTemps = await QueryTemplateModel.listPublicTemplates();
      // 내가 만든 것을 제외한 공개 템플릿만 표시
      const filteredPublic = publicTemps.filter(template => template.userId !== user.uid);
      setPublicTemplates(filteredPublic);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 템플릿 로드
  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);
  
  // 검색어, 태그 변경 시 필터링
  useEffect(() => {
    let results: QueryTemplate[] = [];
    
    // 현재 탭에 따라 다른 템플릿 목록 사용
    switch (activeTab) {
      case 'my':
        results = templates;
        break;
      case 'shared':
        results = sharedTemplates;
        break;
      case 'public':
        results = publicTemplates;
        break;
      default:
        results = templates;
    }
    
    // 태그 필터링
    if (selectedTag) {
      results = results.filter(template => 
        template.tags?.includes(selectedTag)
      );
    }
    
    // 검색어 필터링
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(template => 
        template.name.toLowerCase().includes(term) ||
        (template.description && template.description.toLowerCase().includes(term)) ||
        template.sql.toLowerCase().includes(term) ||
        template.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    setFilteredTemplates(results);
  }, [searchTerm, selectedTag, templates, sharedTemplates, publicTemplates, activeTab]);
  
  // 템플릿 실행 핸들러
  const handleExecuteTemplate = (template: QueryTemplate) => {
    // 쿼리 빌더 화면으로 이동하여 템플릿 로드
    navigate(`/query-builder?templateId=${template.id}`);
  };
  
  // 템플릿 편집 핸들러
  const handleEditTemplate = (template: QueryTemplate) => {
    setSelectedTemplate(template);
    setShowSaveModal(true);
  };
  
  // 템플릿 공유 핸들러
  const handleShareTemplate = (template: QueryTemplate) => {
    setSelectedTemplate(template);
    setShowShareModal(true);
  };
  
  // 템플릿 삭제 핸들러
  const handleDeleteTemplate = async (template: QueryTemplate) => {
    if (!window.confirm(`정말 "${template.name}" 템플릿을 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      await QueryTemplateModel.delete(template.id);
      // 목록 갱신
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('템플릿 삭제 중 오류가 발생했습니다.');
    }
  };
  
  // 템플릿 복제 핸들러
  const handleCloneTemplate = async (template: QueryTemplate) => {
    try {
      await QueryTemplateModel.cloneTemplate(template.id);
      // 목록 갱신
      loadTemplates();
    } catch (error) {
      console.error('Error cloning template:', error);
      alert('템플릿 복제 중 오류가 발생했습니다.');
    }
  };
  
  // 새 템플릿 저장 핸들러
  const handleSaveNewTemplate = () => {
    setSelectedTemplate(null);
    setShowSaveModal(true);
  };
  
  // 템플릿 저장 모달 닫기 핸들러
  const handleSaveModalClose = (templateSaved: boolean) => {
    setShowSaveModal(false);
    if (templateSaved) {
      // 템플릿이 저장된 경우 목록 갱신
      loadTemplates();
    }
  };
  
  // 템플릿 공유 모달 닫기 핸들러
  const handleShareModalClose = () => {
    setShowShareModal(false);
    setSelectedTemplate(null);
  };
  
  // 태그 필터 토글 핸들러
  const handleTagFilter = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
  };
  
  // 탭 변경 핸들러
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedTag(null);
    setSearchTerm('');
  };
  
  // 현재 탭에 해당하는 템플릿 목록 표시 여부
  const shouldShowEmptyState = () => {
    if (loading) return false;
    
    switch (activeTab) {
      case 'my':
        return templates.length === 0;
      case 'shared':
        return sharedTemplates.length === 0;
      case 'public':
        return publicTemplates.length === 0;
      default:
        return false;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">쿼리 템플릿</h1>
        
        <Button color="primary" onClick={handleSaveNewTemplate}>
          <PlusIcon className="w-5 h-5 mr-1" />
          새 템플릿
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-3/4">
          <Card>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="relative w-full md:w-64">
                <Input
                  type="text"
                  placeholder="템플릿 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      color={selectedTag === tag ? 'primary' : 'secondary'}
                      onClick={() => handleTagFilter(tag)}
                      className="cursor-pointer"
                    >
                      <TagIcon className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <Tabs activeTab={activeTab} onChange={handleTabChange}>
              <Tab id="my" title="내 템플릿" icon={<StarIcon className="w-4 h-4" />} />
              <Tab id="shared" title="공유받은 템플릿" icon={<ShareIcon className="w-4 h-4" />} />
              <Tab id="public" title="공개 템플릿" icon={<ClockIcon className="w-4 h-4" />} />
            </Tabs>
            
            {loading ? (
              <div className="flex justify-center my-8">
                <Spinner size="lg" />
              </div>
            ) : shouldShowEmptyState() ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {activeTab === 'my' && (
                  <div>
                    <p className="mb-4">저장된 쿼리 템플릿이 없습니다.</p>
                    <Button color="primary" onClick={handleSaveNewTemplate}>
                      <PlusIcon className="w-5 h-5 mr-1" />
                      새 템플릿 만들기
                    </Button>
                  </div>
                )}
                {activeTab === 'shared' && <p>공유받은 템플릿이 없습니다.</p>}
                {activeTab === 'public' && <p>공개 템플릿이 없습니다.</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isOwner={template.userId === user?.uid}
                    onExecute={handleExecuteTemplate}
                    onEdit={template.userId === user?.uid ? handleEditTemplate : undefined}
                    onShare={template.userId === user?.uid ? handleShareTemplate : undefined}
                    onDelete={template.userId === user?.uid ? handleDeleteTemplate : undefined}
                    onClone={handleCloneTemplate}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
        
        <div className="w-full md:w-1/4">
          <Card title="템플릿 도움말">
            <div className="space-y-4 text-sm">
              <p>
                <strong>쿼리 템플릿</strong>은 자주 사용하는 쿼리를 저장하고 재사용할 수 있게 해줍니다.
              </p>
              <p>
                <strong>파라미터</strong>를 사용하여 동적인 쿼리를 만들 수 있습니다.
                예: <code>{'{{userId:string:사용자 ID}}'}</code>
              </p>
              <p>
                템플릿을 <strong>공유</strong>하여 팀원들과 협업할 수 있습니다.
              </p>
              <p>
                <strong>태그</strong>를 사용하여 템플릿을 분류하고 쉽게 찾을 수 있습니다.
              </p>
            </div>
          </Card>
        </div>
      </div>
      
      {/* 템플릿 저장 모달 */}
      {showSaveModal && (
        <SaveTemplateModal
          template={selectedTemplate}
          onClose={handleSaveModalClose}
        />
      )}
      
      {/* 템플릿 공유 모달 */}
      {showShareModal && selectedTemplate && (
        <TemplateShareModal
          templateId={selectedTemplate.id}
          templateName={selectedTemplate.name}
          onClose={handleShareModalClose}
        />
      )}
    </div>
  );
};

export default QueryTemplates;