import React, { useState } from 'react';
import { Button } from '../../ui';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import ExportModal from './ExportModal';

interface ExportButtonProps {
  data: {
    columns: { name: string; type: string }[];
    rows: any[];
  };
  disabled?: boolean;
  buttonText?: string;
  defaultFileName?: string;
  queryInfo?: {
    name?: string;
    executedAt?: Date;
    duration?: number;
  };
  className?: string;
  buttonVariant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  disabled = false,
  buttonText = 'Export',
  defaultFileName = 'query_result',
  queryInfo,
  className = '',
  buttonVariant = 'secondary',
  buttonSize = 'sm',
}) => {
  // 내보내기 모달 상태
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // 내보내기 모달 열기
  const handleOpenExportModal = () => {
    setIsExportModalOpen(true);
  };

  // 내보내기 모달 닫기
  const handleCloseExportModal = () => {
    setIsExportModalOpen(false);
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleOpenExportModal}
        disabled={disabled || !data || !data.rows || data.rows.length === 0}
        className={className}
      >
        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
        {buttonText}
      </Button>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={handleCloseExportModal}
        data={data}
        defaultFileName={defaultFileName}
        queryInfo={queryInfo}
      />
    </>
  );
};

export default ExportButton;
