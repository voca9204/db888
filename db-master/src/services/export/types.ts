// 내보내기 형식을 정의하는 타입
export type ExportFormat = 'csv' | 'excel' | 'json' | 'sql';

// 내보내기 옵션 타입
export interface ExportOptions {
  format: ExportFormat;
  fileName?: string;
  includeHeaders?: boolean;
  delimiter?: string; // CSV 구분자
  sqlTableName?: string; // SQL 내보내기용 테이블 이름
  worksheetName?: string; // Excel 워크시트 이름
  dateFormat?: string; // 날짜 형식
}

// 내보내기할 데이터 타입
export interface ExportData {
  columns: { name: string; type: string }[];
  rows: any[];
}

// 내보내기 결과 타입
export interface ExportResult {
  success: boolean;
  message?: string;
  url?: string; // 내보낸 파일에 대한 다운로드 URL
  blob?: Blob;
}
