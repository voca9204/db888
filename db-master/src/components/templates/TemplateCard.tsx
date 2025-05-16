import React from 'react';
import { Card, Badge, Button } from '../ui';
import { 
  PlayIcon, 
  EditIcon, 
  TrashIcon, 
  ShareIcon, 
  CopyIcon,
  LockIcon,
  LockOpenIcon,
  UserIcon,
  ClockIcon,
  TagIcon
} from '../icons';
import { QueryTemplate } from '../../types/store';
import { formatDate } from '../../utils/dateUtils';

interface TemplateCardProps {
  template: QueryTemplate;
  isOwner: boolean;
  onExecute: (template: QueryTemplate) => void;
  onEdit?: (template: QueryTemplate) => void;
  onShare?: (template: QueryTemplate) => void;
  onDelete?: (template: QueryTemplate) => void;
  onClone?: (template: QueryTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isOwner,
  onExecute,
  onEdit,
  onShare,
  onDelete,
  onClone,
}) => {
  // 템플릿 SQL 일부 표시
  const getPreviewSql = (sql: string) => {
    const maxLength = 80;
    return sql.length > maxLength
      ? sql.substring(0, maxLength) + '...'
      : sql;
  };

  // 날짜 포맷
  const formatUpdated = (timestamp: number) => {
    return formatDate(timestamp);
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</h3>
        <div className="flex items-center">
          {template.isPublic ? (
            <LockOpenIcon className="w-4 h-4 text-green-500" title="공개 템플릿" />
          ) : (
            <LockIcon className="w-4 h-4 text-gray-500" title="비공개 템플릿" />
          )}
        </div>
      </div>
      
      {template.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          {template.description}
        </p>
      )}
      
      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md mb-3 text-xs font-mono overflow-x-auto">
        <pre className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">
          {getPreviewSql(template.sql)}
        </pre>
      </div>
      
      <div className="mt-auto">
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {template.tags.map((tag) => (
              <Badge key={tag} size="sm" color="secondary">
                <TagIcon className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center">
            <UserIcon className="w-3 h-3 mr-1" />
            <span>{isOwner ? '내 템플릿' : '공유받음'}</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="w-3 h-3 mr-1" />
            <span>{formatUpdated(template.updatedAt)}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            {template.parameters && template.parameters.length > 0 && (
              <Badge size="sm">{template.parameters.length} 파라미터</Badge>
            )}
          </div>
          
          <div className="flex gap-1">
            {onClone && (
              <Button
                size="xs"
                variant="ghost"
                title="템플릿 복제"
                onClick={() => onClone(template)}
              >
                <CopyIcon className="w-4 h-4" />
              </Button>
            )}
            
            {onShare && (
              <Button
                size="xs"
                variant="ghost"
                title="템플릿 공유"
                onClick={() => onShare(template)}
              >
                <ShareIcon className="w-4 h-4" />
              </Button>
            )}
            
            {onEdit && (
              <Button
                size="xs"
                variant="ghost"
                title="템플릿 편집"
                onClick={() => onEdit(template)}
              >
                <EditIcon className="w-4 h-4" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                size="xs"
                variant="ghost"
                color="danger"
                title="템플릿 삭제"
                onClick={() => onDelete(template)}
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              size="xs"
              color="primary"
              title="템플릿 실행"
              onClick={() => onExecute(template)}
            >
              <PlayIcon className="w-4 h-4 mr-1" />
              실행
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TemplateCard;