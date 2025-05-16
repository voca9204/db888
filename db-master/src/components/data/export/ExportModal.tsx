import React, { useState } from 'react';
import { Button, Card, Select, Input, Modal } from '../../ui';
import { ArrowDownTrayIcon, DocumentIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { ExportFormat, ExportOptions, ExportService } from '../../../services/export';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    columns: { name: string; type: string }[];
    rows: any[];
  };
  defaultFileName?: string;
  // 다른 메타데이터: 쿼리 이름, 실행 시간 등
  queryInfo?: {
    name?: string;
    executedAt?: Date;
    duration?: number;
  };
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  data,
  defaultFileName = 'query_result',
  queryInfo
}) => {
  // 내보내기 형식 및 옵션 상태
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [fileName, setFileName] = useState(defaultFileName);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [delimiter, setDelimiter] = useState(',');
  const [sqlTableName, setSqlTableName] = useState('exported_table');
  const [worksheetName, setWorksheetName] = useState('Data');

  // 오류 및 성공 메시지 상태
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // 내보내기 형식에 따른 파일 확장자 가져오기
  const getFileExtension = (format: ExportFormat): string => {
    switch (format) {
      case 'csv': return '.csv';
      case 'excel': return '.xlsx';
      case 'json': return '.json';
      case 'sql': return '.sql';
      default: return '';
    }
  };

  // 내보내기 처리
  const handleExport = () => {
    setError(null);
    setSuccess(null);
    setIsExporting(true);

    try {
      // 데이터가 없는 경우
      if (!data.rows || data.rows.length === 0) {
        setError('No data to export');
        setIsExporting(false);
        return;
      }

      // 파일 이름 확장자 추가 (아직 없는 경우)
      const extension = getFileExtension(format);
      const finalFileName = fileName.endsWith(extension) 
        ? fileName 
        : `${fileName}${extension}`;

      // 내보내기 옵션 준비
      const options: ExportOptions = {
        format,
        fileName: finalFileName,
        includeHeaders,
        delimiter,
        sqlTableName,
        worksheetName,
      };

      // 내보내기 서비스 호출
      const result = ExportService.export(data, options);

      if (result.success) {
        setSuccess(`Successfully exported to ${format.toUpperCase()}`);
        // 성공 시 모달 닫기 (옵션)
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.message || 'Export failed');
      }
    } catch (err) {
      setError(`Export error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Data"
    >
      <div className="space-y-4 p-1">
        {/* 형식 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Export Format
          </label>
          <Select
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
            options={[
              { value: 'csv', label: 'CSV (Comma Separated Values)' },
              { value: 'excel', label: 'Excel (.xlsx)' },
              { value: 'json', label: 'JSON (JavaScript Object Notation)' },
              { value: 'sql', label: 'SQL (INSERT Statements)' },
            ]}
          />
        </div>

        {/* 파일 이름 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            File Name
          </label>
          <div className="flex">
            <Input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name"
              className="flex-grow"
            />
            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
              {getFileExtension(format)}
            </span>
          </div>
        </div>

        {/* 형식별 추가 옵션 */}
        {format === 'csv' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CSV Options
            </label>
            <div className="space-y-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <div className="flex items-center">
                <input
                  id="include-headers"
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="include-headers" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Include Column Headers
                </label>
              </div>
              <div>
                <label htmlFor="delimiter" className="block text-sm text-gray-700 dark:text-gray-300">
                  Delimiter
                </label>
                <Select
                  id="delimiter"
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  options={[
                    { value: ',', label: 'Comma (,)' },
                    { value: ';', label: 'Semicolon (;)' },
                    { value: '\t', label: 'Tab (\\t)' },
                    { value: '|', label: 'Pipe (|)' },
                  ]}
                  className="mt-1 w-full"
                />
              </div>
            </div>
          </div>
        )}

        {format === 'excel' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Excel Options
            </label>
            <div className="space-y-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <div>
                <label htmlFor="worksheet-name" className="block text-sm text-gray-700 dark:text-gray-300">
                  Worksheet Name
                </label>
                <Input
                  id="worksheet-name"
                  type="text"
                  value={worksheetName}
                  onChange={(e) => setWorksheetName(e.target.value)}
                  placeholder="Worksheet name"
                  className="mt-1 w-full"
                />
              </div>
              <div className="flex items-center">
                <input
                  id="include-headers-excel"
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="include-headers-excel" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Include Column Headers
                </label>
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400">
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Excel export requires the SheetJS library. Install it with 'npm install xlsx'
                </span>
              </div>
            </div>
          </div>
        )}

        {format === 'sql' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SQL Options
            </label>
            <div className="space-y-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <div>
                <label htmlFor="table-name" className="block text-sm text-gray-700 dark:text-gray-300">
                  Table Name
                </label>
                <Input
                  id="table-name"
                  type="text"
                  value={sqlTableName}
                  onChange={(e) => setSqlTableName(e.target.value)}
                  placeholder="Table name"
                  className="mt-1 w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* 내보내기 정보 표시 */}
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm">
          <div className="flex items-start space-x-2">
            <DocumentIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Data:</span> {data.rows.length} rows, {data.columns.length} columns
              </p>
              {queryInfo && (
                <>
                  {queryInfo.name && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Query:</span> {queryInfo.name}
                    </p>
                  )}
                  {queryInfo.executedAt && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Executed:</span> {queryInfo.executedAt.toLocaleString()}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* 성공 메시지 */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-3 rounded-md text-sm">
            {success}
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
            onClick={handleExport}
            disabled={isExporting || data.rows.length === 0}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
