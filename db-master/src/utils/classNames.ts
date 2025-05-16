/**
 * 클래스 이름을 조합하는 유틸리티 함수
 */

/**
 * 클래스 이름을 조합하는 함수
 * @param classes 클래스 이름 또는 조건부 클래스 이름 객체
 * @returns 공백으로 구분된 클래스 이름 문자열
 */
export function cx(...classes: (string | boolean | undefined | null | Record<string, boolean>)[]): string {
  return classes
    .filter(Boolean)
    .map((cls) => {
      if (typeof cls === 'string') return cls;
      if (typeof cls === 'object') {
        return Object.keys(cls)
          .filter((key) => cls[key])
          .join(' ');
      }
      return '';
    })
    .join(' ');
}
