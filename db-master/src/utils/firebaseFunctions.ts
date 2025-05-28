import { HttpsCallable } from 'firebase/functions';

/**
 * Firebase Functions 호출을 래핑해 오류 처리를 추가하는 함수
 * 
 * @param functionCall Firebase Functions 호출 함수
 * @param data 함수에 전달할 데이터
 * @param fallbackData 함수 호출 실패 시 반환할 기본 데이터
 * @returns 함수 호출 결과 또는 오류 정보
 */
export const callSafely = async <T = any, R = any>(
  functionCall: HttpsCallable<T, R>,
  data?: T,
  fallbackData?: R
): Promise<{
  data?: R;
  error?: any;
  success: boolean;
}> => {
  try {
    // Firebase Function이 null인 경우 확인
    if (!functionCall) {
      console.error('Firebase Function is not initialized');
      return {
        success: false,
        error: new Error('Firebase Function is not initialized'),
        data: fallbackData
      };
    }

    // Firebase Function 호출
    const result = await functionCall(data);
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('Firebase Function call failed:', error);
    return {
      success: false,
      error,
      data: fallbackData
    };
  }
};
