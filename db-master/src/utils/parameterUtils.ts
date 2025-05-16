import { QueryTemplateParameter } from '../types/store';

/**
 * 쿼리 템플릿 파라미터 유틸리티
 */

/**
 * SQL 쿼리에서 파라미터 추출
 * 패턴: {{paramName:type?default:description}}
 * 예시: {{userId:string:사용자 ID}}
 *       {{fromDate:date?2023-01-01:시작 날짜}}
 *       {{limit:number?10:결과 수}}
 * 
 * @param query SQL 쿼리 문자열
 * @returns 파라미터 목록
 */
export function extractParameters(query: string): QueryTemplateParameter[] {
  if (!query) return [];
  
  const paramRegex = /{{([^{}]+)}}/g;
  const matches = [...query.matchAll(paramRegex)];
  const parameters: QueryTemplateParameter[] = [];
  const paramMap = new Map<string, boolean>(); // 중복 방지용
  
  matches.forEach((match) => {
    const paramContent = match[1];
    // name:type?default:description 형식 분석
    const parts = paramContent.split(':');
    
    if (parts.length < 2) return; // 최소 이름과 타입이 필요
    
    const name = parts[0].trim();
    
    // 이미 추출된 파라미터인 경우 스킵
    if (paramMap.has(name)) return;
    paramMap.set(name, true);
    
    // 타입 분석 (string, number, boolean, date)
    let type = parts[1].trim();
    let defaultValue: string | number | boolean | null = null;
    
    // 타입에 기본값이 포함된 경우 (type?default 형식)
    if (type.includes('?')) {
      const typeParts = type.split('?');
      type = typeParts[0].trim();
      defaultValue = typeParts[1].trim();
      
      // 타입에 맞게 기본값 변환
      if (type === 'number') {
        defaultValue = parseFloat(defaultValue as string);
      } else if (type === 'boolean') {
        defaultValue = defaultValue === 'true';
      }
      // string과 date는 그대로 문자열 사용
    }
    
    // 유효한 타입인지 확인
    if (!['string', 'number', 'boolean', 'date'].includes(type)) {
      type = 'string'; // 기본값은 string
    }
    
    // 설명 추출 (있는 경우)
    const description = parts.length > 2 ? parts.slice(2).join(':').trim() : '';
    
    // 파라미터 객체 생성
    parameters.push({
      name,
      type: type as 'string' | 'number' | 'boolean' | 'date',
      defaultValue,
      description,
      required: defaultValue === null, // 기본값이 없으면 필수 파라미터
    });
  });
  
  return parameters;
}

/**
 * 파라미터 값으로 쿼리 채우기
 * @param query SQL 쿼리 문자열
 * @param parameterValues 파라미터 값 객체
 * @returns 파라미터가 적용된 SQL 쿼리
 */
export function applyParameters(
  query: string, 
  parameterValues: Record<string, any>
): string {
  if (!query) return '';
  
  // 파라미터 패턴 찾기
  const paramRegex = /{{([^{}]+)}}/g;
  
  // 파라미터 패턴을 값으로 대체
  return query.replace(paramRegex, (match, paramContent) => {
    const parts = paramContent.split(':');
    if (parts.length < 2) return match; // 잘못된 형식은 그대로 유지
    
    const name = parts[0].trim();
    let type = parts[1].trim();
    let defaultValue: any = null;
    
    // 타입에 기본값이 포함된 경우 (type?default 형식)
    if (type.includes('?')) {
      const typeParts = type.split('?');
      type = typeParts[0].trim();
      defaultValue = typeParts[1].trim();
      
      // 타입에 맞게 기본값 변환
      if (type === 'number') {
        defaultValue = parseFloat(defaultValue);
      } else if (type === 'boolean') {
        defaultValue = defaultValue === 'true';
      }
    }
    
    // 파라미터 값이 제공되지 않은 경우 기본값 사용
    const value = parameterValues[name] !== undefined ? parameterValues[name] : defaultValue;
    
    // 값이 없으면 원래 패턴 유지
    if (value === null || value === undefined) {
      return match;
    }
    
    // 타입에 맞게 SQL에 삽입할 값 형식 지정
    switch (type) {
      case 'string':
        // SQL 인젝션 방지를 위한 문자열 이스케이프
        return `'${escapeStringForSQL(String(value))}'`;
      case 'number':
        return String(value);
      case 'boolean':
        return value ? '1' : '0';
      case 'date':
        // 날짜를 SQL 형식으로 변환
        if (value instanceof Date) {
          return `'${value.toISOString().split('T')[0]}'`;
        } else if (typeof value === 'string' && value.trim() !== '') {
          // 날짜 형식 문자열인 경우
          try {
            const date = new Date(value);
            return `'${date.toISOString().split('T')[0]}'`;
          } catch (e) {
            return `'${value}'`; // 파싱 실패 시 그대로 사용
          }
        } else {
          return 'NULL';
        }
      default:
        return String(value);
    }
  });
}

/**
 * 파라미터 유효성 검사 결과
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * 파라미터 값 유효성 검사
 * @param parameters 파라미터 정의 목록
 * @param values 파라미터 값 객체
 * @returns 유효성 검사 결과
 */
export function validateParameterValues(
  parameters: QueryTemplateParameter[], 
  values: Record<string, any>
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: {},
  };
  
  parameters.forEach((param) => {
    const value = values[param.name];
    
    // 필수 파라미터 검사
    if (param.required && (value === undefined || value === null || value === '')) {
      result.isValid = false;
      result.errors[param.name] = `${param.name}은(는) 필수 파라미터입니다.`;
      return;
    }
    
    // 값이 없고 필수가 아닌 경우는 검사 스킵
    if (value === undefined || value === null || value === '') {
      return;
    }
    
    // 타입 검사
    switch (param.type) {
      case 'number':
        if (isNaN(Number(value))) {
          result.isValid = false;
          result.errors[param.name] = `${param.name}은(는) 숫자 형식이어야 합니다.`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false' && value !== '1' && value !== '0') {
          result.isValid = false;
          result.errors[param.name] = `${param.name}은(는) 불리언 형식이어야 합니다.`;
        }
        break;
      case 'date':
        try {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
          }
        } catch (e) {
          result.isValid = false;
          result.errors[param.name] = `${param.name}은(는) 유효한 날짜 형식이어야 합니다.`;
        }
        break;
      // string 타입은 모든 값이 허용됨
    }
  });
  
  return result;
}

/**
 * SQL 인젝션 방지를 위한 문자열 이스케이프
 * @param str 원본 문자열
 * @returns 이스케이프된 문자열
 */
function escapeStringForSQL(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * 파라미터 입력 폼 생성에 필요한 정보
 */
export interface ParameterFormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'checkbox' | 'date';
  defaultValue?: any;
  placeholder?: string;
  required: boolean;
  description?: string;
}

/**
 * 파라미터 정의에서 입력 폼 필드 생성
 * @param parameters 파라미터 정의 목록
 * @returns 입력 폼 필드 목록
 */
export function createParameterFormFields(
  parameters: QueryTemplateParameter[]
): ParameterFormField[] {
  return parameters.map((param) => {
    // 입력 필드 타입 결정
    let fieldType: 'text' | 'number' | 'checkbox' | 'date' = 'text';
    switch (param.type) {
      case 'number':
        fieldType = 'number';
        break;
      case 'boolean':
        fieldType = 'checkbox';
        break;
      case 'date':
        fieldType = 'date';
        break;
    }
    
    return {
      id: `param-${param.name}`,
      name: param.name,
      label: param.name.charAt(0).toUpperCase() + param.name.slice(1).replace(/([A-Z])/g, ' $1'),
      type: fieldType,
      defaultValue: param.defaultValue,
      placeholder: param.description,
      required: param.required,
      description: param.description,
    };
  });
}

/**
 * SQL 쿼리에서 파라미터 플레이스홀더 찾기
 * @param query SQL 쿼리 문자열
 * @returns 파라미터 이름 목록
 */
export function findParameterPlaceholders(query: string): string[] {
  if (!query) return [];
  
  const paramRegex = /{{([^{}:]+)[^{}]*}}/g;
  const matches = [...query.matchAll(paramRegex)];
  
  return matches.map((match) => match[1].trim());
}

/**
 * 쿼리 파라미터화 (일반 쿼리를 파라미터화된 쿼리로 변환)
 * @param query 원본 SQL 쿼리
 * @param placeholder 파라미터로 변환할 값
 * @param paramName 파라미터 이름
 * @param paramType 파라미터 타입
 * @param description 파라미터 설명
 * @returns 파라미터화된 쿼리
 */
export function parameterizeQuery(
  query: string,
  placeholder: string,
  paramName: string,
  paramType: 'string' | 'number' | 'boolean' | 'date',
  description?: string
): string {
  if (!query || !placeholder || !paramName) return query;
  
  // 적절한 파라미터 패턴 생성
  const paramPattern = description 
    ? `{{${paramName}:${paramType}:${description}}}`
    : `{{${paramName}:${paramType}}}`;
  
  // 플레이스홀더 패턴 생성 (SQL에서 문자열, 숫자 등 다양한 형태로 나타날 수 있음)
  let placeholderPattern: string;
  if (paramType === 'string' || paramType === 'date') {
    // 문자열이나 날짜는 따옴표로 감싸져 있을 수 있음
    placeholderPattern = `'${escapeRegExp(placeholder)}'`;
  } else {
    placeholderPattern = escapeRegExp(placeholder);
  }
  
  // 플레이스홀더를 파라미터 패턴으로 대체
  return query.replace(new RegExp(placeholderPattern, 'g'), paramPattern);
}

/**
 * 정규식 특수문자 이스케이프
 * @param string 원본 문자열
 * @returns 이스케이프된 문자열
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
