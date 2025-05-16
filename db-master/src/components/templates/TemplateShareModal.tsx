import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Spinner, Select, Badge } from '../ui';
import { ShareIcon, LinkIcon, PlusIcon, TrashIcon } from '../icons';
import { QueryTemplateShareModel, SharePermission } from '../../firebase';

interface TemplateShareModalProps {
  templateId: string;
  templateName: string;
  onClose: () => void;
}

interface ShareUser {
  email: string;
  permission: SharePermission;
}

const TemplateShareModal: React.FC<TemplateShareModalProps> = ({
  templateId,
  templateName,
  onClose,
}) => {
  // 상태 관리
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<SharePermission>(SharePermission.READ);
  const [message, setMessage] = useState('');
  const [sharedUsers, setSharedUsers] = useState<ShareUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareLoading, setShareLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareLinkLoading, setShareLinkLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // 공유 사용자 목록 로드
  const loadSharedUsers = async () => {
    setLoading(true);
    try {
      const shares = await QueryTemplateShareModel.getByTemplateId(templateId);
      
      const users = shares.map(share => ({
        email: share.sharedWith,
        permission: share.permission,
      }));
      
      setSharedUsers(users);
    } catch (error) {
      console.error('Error loading shared users:', error);
      setError('공유 사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 공유 사용자 목록 로드
  useEffect(() => {
    loadSharedUsers();
  }, [templateId]);
  
  // 템플릿 공유 핸들러
  const handleShareTemplate = async () => {
    if (!email.trim()) return;
    
    setShareLoading(true);
    setError(null);
    
    try {
      await QueryTemplateShareModel.create(
        templateId,
        email.trim(),
        permission,
        message.trim() || undefined
      );
      
      // 공유 사용자 목록 새로고침
      await loadSharedUsers();
      
      // 입력 필드 초기화
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Error sharing template:', error);
      setError('템플릿 공유 중 오류가 발생했습니다.');
    } finally {
      setShareLoading(false);
    }
  };
  
  // 공유 해제 핸들러
  const handleRemoveShare = async (email: string) => {
    try {
      await QueryTemplateShareModel.remove(templateId, email);
      
      // 공유 사용자 목록 새로고침
      await loadSharedUsers();
    } catch (error) {
      console.error('Error removing share:', error);
      setError('공유 해제 중 오류가 발생했습니다.');
    }
  };
  
  // 공유 권한 업데이트 핸들러
  const handleUpdatePermission = async (email: string, newPermission: SharePermission) => {
    try {
      // 공유 ID 생성 (templateId_email 형식에 맞추기)
      const shareId = `${templateId}_${email.replace(/[.@]/g, '_')}`;
      
      await QueryTemplateShareModel.updatePermission(shareId, newPermission);
      
      // 공유 사용자 목록 새로고침
      await loadSharedUsers();
    } catch (error) {
      console.error('Error updating permission:', error);
      setError('권한 업데이트 중 오류가 발생했습니다.');
    }
  };
  
  // 공유 링크 생성 핸들러
  const handleCreateShareLink = async () => {
    setShareLinkLoading(true);
    setError(null);
    
    try {
      const link = await QueryTemplateShareModel.createShareLink(templateId);
      setShareLink(link);
    } catch (error) {
      console.error('Error creating share link:', error);
      setError('공유 링크 생성 중 오류가 발생했습니다.');
    } finally {
      setShareLinkLoading(false);
    }
  };
  
  // 링크 복사 핸들러
  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };
  
  return (
    <Modal
      title={`"${templateName}" 템플릿 공유`}
      onClose={onClose}
      size="lg"
    >
      <div className="space-y-4">
        {/* 새 사용자에게 공유 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">새 사용자에게 공유</h3>
          
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              className="flex-1"
            />
            
            <Select
              value={permission}
              onChange={(e) => setPermission(e.target.value as SharePermission)}
              className="w-full md:w-auto"
            >
              <option value={SharePermission.READ}>읽기만</option>
              <option value={SharePermission.EXECUTE}>실행 가능</option>
              <option value={SharePermission.MODIFY}>수정 가능</option>
              <option value={SharePermission.ADMIN}>모든 권한</option>
            </Select>
            
            <Button
              color="primary"
              onClick={handleShareTemplate}
              loading={shareLoading}
              disabled={!email.trim()}
            >
              <ShareIcon className="w-5 h-5 mr-1" />
              공유
            </Button>
          </div>
          
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="추가 메시지 (선택사항)"
            rows={2}
          />
        </div>
        
        {/* 공유 링크 */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-2">공유 링크</h3>
          
          {shareLink ? (
            <div className="flex flex-col md:flex-row gap-2">
              <Input
                value={shareLink}
                readOnly
                className="flex-1"
              />
              <Button
                color={linkCopied ? 'success' : 'secondary'}
                onClick={handleCopyLink}
              >
                {linkCopied ? '복사됨!' : '링크 복사'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCreateShareLink}
                loading={shareLinkLoading}
              >
                <LinkIcon className="w-5 h-5 mr-1" />
                공유 링크 생성
              </Button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                누구나 링크로 템플릿을 볼 수 있습니다 (7일간 유효)
              </span>
            </div>
          )}
        </div>
        
        {/* 현재 공유 사용자 목록 */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-2">공유됨</h3>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : sharedUsers.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md">
              이 템플릿은 아직 공유되지 않았습니다.
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      이메일
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      권한
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      동작
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {sharedUsers.map((user) => (
                    <tr key={user.email}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Select
                          size="sm"
                          value={user.permission}
                          onChange={(e) => handleUpdatePermission(
                            user.email, 
                            e.target.value as SharePermission
                          )}
                        >
                          <option value={SharePermission.READ}>읽기만</option>
                          <option value={SharePermission.EXECUTE}>실행 가능</option>
                          <option value={SharePermission.MODIFY}>수정 가능</option>
                          <option value={SharePermission.ADMIN}>모든 권한</option>
                        </Select>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        <Button
                          size="xs"
                          variant="ghost"
                          color="danger"
                          onClick={() => handleRemoveShare(user.email)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            닫기
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TemplateShareModal;