/**
 * 날짜 포맷 유틸리티
 */

/**
 * 타임스탬프를 사용자 친화적인 형식으로 변환
 * @param timestamp 밀리초 단위 타임스탬프
 * @returns 포맷된 날짜 문자열
 */
export function formatDate(timestamp: number): string {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // 1분 미만
  if (diffMinutes < 1) {
    return '방금 전';
  }
  
  // 1시간 미만
  if (diffHours < 1) {
    return `${diffMinutes}분 전`;
  }
  
  // 오늘
  if (diffDays < 1) {
    return `${diffHours}시간 전`;
  }
  
  // 어제
  if (diffDays === 1) {
    return '어제';
  }
  
  // 7일 이내
  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }
  
  // 그 외
  return formatDateFull(date);
}

/**
 * 날짜를 전체 형식으로 변환
 * @param date Date 객체
 * @returns YYYY-MM-DD HH:MM 형식 문자열
 */
export function formatDateFull(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 날짜를 yyyy-mm-dd 형식으로 변환
 * @param date Date 객체 또는 타임스탬프
 * @returns yyyy-mm-dd 형식 문자열
 */
export function formatDateYMD(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 현재 날짜를 yyyy-mm-dd 형식으로 반환
 * @returns 현재 날짜 문자열
 */
export function getCurrentDate(): string {
  return formatDateYMD(new Date());
}

/**
 * 일정 기간 후의 날짜 계산
 * @param days 더할 일수
 * @param from 시작 날짜 (기본값: 현재)
 * @returns 계산된 날짜
 */
export function addDays(days: number, from?: Date): Date {
  const date = from ? new Date(from) : new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * 두 날짜 간의 일수 차이 계산
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @returns 일수 차이
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // 밀리초 단위의 하루
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.round(diffMs / oneDay);
}
