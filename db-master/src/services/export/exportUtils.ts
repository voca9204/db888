import { ExportOptions, ExportData, ExportResult } from './types';

/**
 * CSV 형식으로 데이터를 내보냅니다.
 * @param data 내보낼 데이터
 * @param options 내보내기 옵션
 * @returns 내보내기 결과
 */
export const exportToCSV = (
  data: ExportData,
  options: Omit<ExportOptions, 'format'>
): ExportResult => {
  try {
    const { 
      includeHeaders = true, 
      delimiter = ',',
      fileName = `export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
    } = options;
    
    // 헤더 준비 (옵션에 따라 포함/제외)
    const headers = includeHeaders ? data.columns.map(col => col.name) : [];
    
    // 각 행을 CSV 문자열로 변환
    const csvRows = data.rows.map(row => {
      return data.columns.map(col => {
        // null 값 처리
        if (row[col.name] === null || row[col.name] === undefined) {
          return '';
        }
        
        // 문자열 값: 쌍따옴표로 감싸고 내부 쌍따옴표는 두 번 반복
        const value = String(row[col.name]);
        return `"${value.replace(/"/g, '""')}"`;
      }).join(delimiter);
    });
    
    // 모든 행 결합 (헤더 포함)
    const csvContent = [
      ...(includeHeaders ? [headers.join(delimiter)] : []), 
      ...csvRows
    ].join('\n');
    
    // Blob 생성
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 다운로드 URL 생성
    const url = URL.createObjectURL(blob);
    
    return {
      success: true,
      message: 'CSV export successful',
      url,
      blob
    };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return {
      success: false,
      message: `Error exporting to CSV: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * JSON 형식으로 데이터를 내보냅니다.
 * @param data 내보낼 데이터
 * @param options 내보내기 옵션
 * @returns 내보내기 결과
 */
export const exportToJSON = (
  data: ExportData,
  options: Omit<ExportOptions, 'format'>
): ExportResult => {
  try {
    const {
      fileName = `export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`,
      includeHeaders = true // JSON 메타데이터에 컬럼 정보를 포함할지 여부
    } = options;
    
    // JSON 객체 준비
    const jsonOutput: any = {
      data: data.rows
    };
    
    // 헤더 정보 포함 옵션
    if (includeHeaders) {
      jsonOutput.metadata = {
        columns: data.columns
      };
    }
    
    // JSON 문자열로 변환
    const jsonContent = JSON.stringify(jsonOutput, null, 2);
    
    // Blob 생성
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    
    // 다운로드 URL 생성
    const url = URL.createObjectURL(blob);
    
    return {
      success: true,
      message: 'JSON export successful',
      url,
      blob
    };
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    return {
      success: false,
      message: `Error exporting to JSON: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * SQL INSERT 문으로 데이터를 내보냅니다.
 * @param data 내보낼 데이터
 * @param options 내보내기 옵션
 * @returns 내보내기 결과
 */
export const exportToSQL = (
  data: ExportData,
  options: Omit<ExportOptions, 'format'>
): ExportResult => {
  try {
    const {
      fileName = `export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.sql`,
      sqlTableName = 'exported_table'
    } = options;
    
    // 컬럼 이름 목록
    const columnNames = data.columns.map(col => `\`${col.name}\``);
    
    // 각 행에 대한 INSERT 문 생성
    const insertStatements = data.rows.map(row => {
      // 각 컬럼의 값을 SQL 문법에 맞게 포맷팅
      const values = data.columns.map(col => {
        const value = row[col.name];
        
        if (value === null || value === undefined) {
          return 'NULL';
        }
        
        // 타입에 따른 처리
        const lowerCaseType = col.type.toLowerCase();
        
        // 숫자 타입
        if (
          lowerCaseType.includes('int') || 
          lowerCaseType.includes('float') || 
          lowerCaseType.includes('double') || 
          lowerCaseType.includes('decimal') || 
          lowerCaseType.includes('number')
        ) {
          return value;
        }
        
        // 날짜/시간 타입
        if (
          lowerCaseType.includes('date') || 
          lowerCaseType.includes('time') || 
          lowerCaseType.includes('timestamp')
        ) {
          if (value instanceof Date) {
            return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
          }
          return `'${value}'`;
        }
        
        // 불리언 타입
        if (lowerCaseType.includes('bool')) {
          return value ? '1' : '0';
        }
        
        // 기본: 문자열로 처리 (이스케이프 처리)
        return `'${String(value).replace(/'/g, "''")}'`;
      });
      
      // INSERT 문 생성
      return `INSERT INTO \`${sqlTableName}\` (${columnNames.join(', ')}) VALUES (${values.join(', ')});`;
    });
    
    // 모든 INSERT 문과 코멘트 결합
    const sqlContent = [
      `-- SQL export from DB Master`,
      `-- Date: ${new Date().toISOString()}`,
      `-- Table: ${sqlTableName}`,
      `-- Rows: ${data.rows.length}`,
      ``,
      ...insertStatements
    ].join('\n');
    
    // Blob 생성
    const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8;' });
    
    // 다운로드 URL 생성
    const url = URL.createObjectURL(blob);
    
    return {
      success: true,
      message: 'SQL export successful',
      url,
      blob
    };
  } catch (error) {
    console.error('Error exporting to SQL:', error);
    return {
      success: false,
      message: `Error exporting to SQL: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Excel 형식으로 데이터를 내보냅니다.
 * 참고: 이 함수는 SheetJS 라이브러리가 필요합니다. 
 * npm install xlsx 또는 yarn add xlsx 명령으로 설치가 필요합니다.
 * 
 * @param data 내보낼 데이터
 * @param options 내보내기 옵션
 * @returns 내보내기 결과 (현재는 라이브러리 없이 구현되지 않음)
 */
export const exportToExcel = (
  data: ExportData,
  options: Omit<ExportOptions, 'format'>
): ExportResult => {
  try {
    // Excel 내보내기는 SheetJS 라이브러리가 필요합니다.
    return {
      success: false,
      message: `Excel export requires SheetJS library. Install it with 'npm install xlsx' or 'yarn add xlsx'`
    };
    
    // 라이브러리가 설치되면 아래 코드를 구현할 수 있습니다:
    /*
    import * as XLSX from 'xlsx';
    
    const {
      fileName = `export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`,
      worksheetName = 'Data'
    } = options;
    
    // 워크시트 데이터 준비
    const worksheetData = [
      // 헤더 행
      data.columns.map(col => col.name),
      // 데이터 행
      ...data.rows.map(row => data.columns.map(col => row[col.name]))
    ];
    
    // 워크시트 생성
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);
    
    // Excel 파일로 변환
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Blob 생성
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // 다운로드 URL 생성
    const url = URL.createObjectURL(blob);
    
    return {
      success: true,
      message: 'Excel export successful',
      url,
      blob
    };
    */
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return {
      success: false,
      message: `Error exporting to Excel: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
