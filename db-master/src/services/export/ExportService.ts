import { ExportFormat, ExportOptions, ExportData, ExportResult } from './types';
import { exportToCSV, exportToJSON, exportToSQL, exportToExcel } from './exportUtils';

/**
 * 데이터 내보내기 서비스
 * 지정된 형식으로 데이터를 내보내고 파일 다운로드를 시작합니다.
 */
export class ExportService {
  /**
   * 지정된 형식으로 데이터를 내보냅니다.
   * @param data 내보낼 데이터
   * @param options 내보내기 옵션
   * @returns 내보내기 결과
   */
  public static export(data: ExportData, options: ExportOptions): ExportResult {
    // 옵션 기본값 설정
    const finalOptions = {
      ...options,
      fileName: options.fileName || `export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
    };

    // 타입별 내보내기 함수 실행
    let result: ExportResult;
    
    switch (options.format) {
      case 'csv':
        result = exportToCSV(data, finalOptions);
        break;
      case 'excel':
        result = exportToExcel(data, finalOptions);
        break;
      case 'json':
        result = exportToJSON(data, finalOptions);
        break;
      case 'sql':
        result = exportToSQL(data, finalOptions);
        break;
      default:
        result = {
          success: false,
          message: `Unsupported export format: ${options.format as string}`
        };
    }

    // 결과가 성공적이면 다운로드 시작
    if (result.success && result.url) {
      this.startDownload(result.url, finalOptions.fileName);
    }

    return result;
  }

  /**
   * 데이터를 CSV 형식으로 내보냅니다.
   * @param data 내보낼 데이터
   * @param options 내보내기 옵션
   * @returns 내보내기 결과
   */
  public static exportCSV(data: ExportData, options: Omit<ExportOptions, 'format'> = {}): ExportResult {
    const result = exportToCSV(data, options);
    
    if (result.success && result.url) {
      this.startDownload(
        result.url, 
        options.fileName || `export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
      );
    }
    
    return result;
  }

  /**
   * 데이터를 JSON 형식으로 내보냅니다.
   * @param data 내보낼 데이터
   * @param options 내보내기 옵션
   * @returns 내보내기 결과
   */
  public static exportJSON(data: ExportData, options: Omit<ExportOptions, 'format'> = {}): ExportResult {
    const result = exportToJSON(data, options);
    
    if (result.success && result.url) {
      this.startDownload(
        result.url, 
        options.fileName || `export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
      );
    }
    
    return result;
  }

  /**
   * 데이터를 SQL 형식으로 내보냅니다.
   * @param data 내보낼 데이터
   * @param options 내보내기 옵션
   * @returns 내보내기 결과
   */
  public static exportSQL(data: ExportData, options: Omit<ExportOptions, 'format'> = {}): ExportResult {
    const result = exportToSQL(data, options);
    
    if (result.success && result.url) {
      this.startDownload(
        result.url, 
        options.fileName || `export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.sql`
      );
    }
    
    return result;
  }

  /**
   * 데이터를 Excel 형식으로 내보냅니다.
   * @param data 내보낼 데이터
   * @param options 내보내기 옵션
   * @returns 내보내기 결과
   */
  public static exportExcel(data: ExportData, options: Omit<ExportOptions, 'format'> = {}): ExportResult {
    const result = exportToExcel(data, options);
    
    if (result.success && result.url) {
      this.startDownload(
        result.url, 
        options.fileName || `export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`
      );
    }
    
    return result;
  }

  /**
   * 주어진 URL에서 파일 다운로드를 시작합니다.
   * @param url 다운로드 URL
   * @param fileName 파일 이름
   */
  private static startDownload(url: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 메모리 누수 방지를 위한 URL 객체 해제
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

// 내보내기 서비스의 정적 인스턴스 내보내기
export default ExportService;
