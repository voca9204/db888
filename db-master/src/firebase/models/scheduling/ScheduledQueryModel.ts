import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../../config';
import { v4 as uuidv4 } from 'uuid';

// 컬렉션 이름
const COLLECTION_NAME = 'scheduledQueries';
const EXECUTION_COLLECTION = 'scheduledQueryExecutions';

/**
 * 스케줄링 빈도 타입
 */
export enum ScheduleFrequency {
  ONCE = 'ONCE',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM', // CRON 표현식 사용
}

/**
 * 결과 알림 채널
 */
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  WEBHOOK = 'WEBHOOK',
}

/**
 * 알림 조건 타입
 */
export enum AlertConditionType {
  ALWAYS = 'ALWAYS',
  ROWS_COUNT = 'ROWS_COUNT',
  NO_RESULTS = 'NO_RESULTS',
  ERROR = 'ERROR',
  CUSTOM_CONDITION = 'CUSTOM_CONDITION',
}

/**
 * 비교 연산자
 */
export enum ComparisonOperator {
  EQUAL = '=',
  NOT_EQUAL = '!=',
  GREATER_THAN = '>',
  LESS_THAN = '<',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN_OR_EQUAL = '<=',
}

/**
 * 알림 조건 인터페이스
 */
export interface AlertCondition {
  type: AlertConditionType;
  operator?: ComparisonOperator;
  value?: number | string;
  columnName?: string;
  expression?: string; // 사용자 정의 조건
}

/**
 * 웹훅 설정 인터페이스
 */
export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  includeResults?: boolean;
}

/**
 * Firestore에 저장된 스케줄링된 쿼리의 형태
 */
export interface FirestoreScheduledQuery {
  id: string;
  name: string;
  description?: string;
  sql: string;
  connectionId: string;
  parameters?: Array<{
    name: string;
    type: string;
    value: any;
  }>;
  frequency: ScheduleFrequency;
  schedule: {
    startTime: Timestamp;
    endTime?: Timestamp;
    timeZone: string;
    daysOfWeek?: number[]; // 0(일요일)부터 6(토요일)
    dayOfMonth?: number;
    hour?: number;
    minute?: number;
    cronExpression?: string;
  };
  notifications: {
    enabled: boolean;
    channels: NotificationChannel[];
    recipients?: string[]; // 이메일 주소
    webhookConfig?: WebhookConfig;
    alertConditions?: AlertCondition[];
  };
  maxHistoryRetention: number; // 결과 기록 유지 기간(일)
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastExecutionAt?: Timestamp;
  lastExecutionStatus?: 'SUCCESS' | 'ERROR';
  active: boolean;
  templateId?: string; // 템플릿에서 생성된 경우
  queryState?: any; // 쿼리 빌더 상태
}

/**
 * 쿼리 실행 결과 인터페이스
 */
export interface FirestoreQueryExecution {
  id: string;
  scheduledQueryId: string;
  connectionId: string;
  executionTime: Timestamp;
  completionTime?: Timestamp;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR';
  sql: string;
  parameters?: Array<{
    name: string;
    type: string;
    value: any;
  }>;
  results?: any[];
  resultCount?: number;
  error?: string;
  notificationSent: boolean;
  notificationStatus?: 'PENDING' | 'SENT' | 'FAILED';
  alertTriggered?: boolean;
  alertReason?: string;
  executionTime_ms?: number;
  createdAt: Timestamp;
}

/**
 * 스케줄링된 쿼리 모델 클래스
 */
export class ScheduledQueryModel {
  /**
   * 새 스케줄링된 쿼리 생성
   * @param scheduledQuery 스케줄링된 쿼리 데이터
   * @returns 생성된 쿼리의 ID
   */
  static async create(scheduledQuery: Omit<FirestoreScheduledQuery, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // ID 생성
      const queryId = uuidv4();
      
      // 스케줄링된 쿼리 데이터 준비
      const queryData: FirestoreScheduledQuery = {
        ...scheduledQuery,
        id: queryId,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      // Firestore에 저장
      const queryRef = doc(db, COLLECTION_NAME, queryId);
      await setDoc(queryRef, queryData);

      return queryId;
    } catch (error) {
      console.error('Error creating scheduled query:', error);
      throw error;
    }
  }

  /**
   * 스케줄링된 쿼리 ID로 조회
   * @param id 쿼리 ID
   * @returns 쿼리 데이터 또는 null
   */
  static async getById(id: string): Promise<FirestoreScheduledQuery | null> {
    try {
      const queryRef = doc(db, COLLECTION_NAME, id);
      const querySnap = await getDoc(queryRef);

      if (!querySnap.exists()) {
        return null;
      }

      return querySnap.data() as FirestoreScheduledQuery;
    } catch (error) {
      console.error('Error getting scheduled query:', error);
      throw error;
    }
  }

  /**
   * 스케줄링된 쿼리 업데이트
   * @param id 쿼리 ID
   * @param data 업데이트할 데이터
   */
  static async update(id: string, data: Partial<FirestoreScheduledQuery>): Promise<void> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 쿼리 존재 확인 및 접근 권한 검증
      const existingQuery = await this.getById(id);
      if (!existingQuery) {
        throw new Error('Scheduled query not found');
      }

      // 쿼리 소유자만 수정 가능
      if (existingQuery.createdBy !== currentUser.uid) {
        throw new Error('You do not have permission to update this scheduled query');
      }

      // 업데이트 데이터 준비
      const updateData: Partial<FirestoreScheduledQuery> = {
        ...data,
        updatedAt: serverTimestamp() as Timestamp,
      };

      // id, createdBy, createdAt은 업데이트하지 않음
      delete updateData.id;
      delete updateData.createdBy;
      delete updateData.createdAt;

      // Firestore 업데이트
      const queryRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(queryRef, updateData);
    } catch (error) {
      console.error('Error updating scheduled query:', error);
      throw error;
    }
  }

  /**
   * 스케줄링된 쿼리 삭제
   * @param id 쿼리 ID
   */
  static async delete(id: string): Promise<void> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 쿼리 존재 확인 및 접근 권한 검증
      const existingQuery = await this.getById(id);
      if (!existingQuery) {
        throw new Error('Scheduled query not found');
      }

      // 쿼리 소유자만 삭제 가능
      if (existingQuery.createdBy !== currentUser.uid) {
        throw new Error('You do not have permission to delete this scheduled query');
      }

      // Firestore에서 삭제
      const queryRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(queryRef);
      
      // 실행 기록도 함께 삭제
      // 참고: 대량의 데이터인 경우 Cloud Function에서 삭제하는 것이 더 적합
      const executionsQuery = query(
        collection(db, EXECUTION_COLLECTION),
        where('scheduledQueryId', '==', id)
      );
      
      const executionSnapshot = await getDocs(executionsQuery);
      
      // 배치 작업으로 100개 단위로 삭제
      const maxBatchSize = 100;
      const totalDocs = executionSnapshot.size;
      
      for (let i = 0; i < totalDocs; i += maxBatchSize) {
        const batch = writeBatch(db);
        const docs = executionSnapshot.docs.slice(i, i + maxBatchSize);
        
        docs.forEach(docSnapshot => {
          batch.delete(docSnapshot.ref);
        });
        
        await batch.commit();
      }
    } catch (error) {
      console.error('Error deleting scheduled query:', error);
      throw error;
    }
  }

  /**
   * 사용자의 스케줄링된 쿼리 목록 조회
   * @param userId 사용자 ID (옵션, 기본값: 현재 사용자)
   * @param activeOnly 활성화된 쿼리만 조회
   * @param limit 최대 조회 수
   * @returns 쿼리 목록
   */
  static async listQueries(
    userId?: string,
    activeOnly: boolean = false,
    maxLimit: number = 100
  ): Promise<FirestoreScheduledQuery[]> {
    try {
      // 현재 사용자 확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // 조회할 사용자 ID 결정
      const targetUserId = userId || currentUser.uid;
      const queryFilters = [where('createdBy', '==', targetUserId)];
      
      // 활성화된 쿼리만 조회 옵션
      if (activeOnly) {
        queryFilters.push(where('active', '==', true));
      }

      // 쿼리 생성
      const queriesQuery = query(
        collection(db, COLLECTION_NAME),
        ...queryFilters,
        orderBy('updatedAt', 'desc'),
        limit(maxLimit)
      );

      // 쿼리 실행
      const snapshot = await getDocs(queriesQuery);
      
      // 결과 매핑
      const queries: FirestoreScheduledQuery[] = [];
      snapshot.forEach(doc => {
        queries.push(doc.data() as FirestoreScheduledQuery);
      });

      return queries;
    } catch (error) {
      console.error('Error listing scheduled queries:', error);
      throw error;
    }
  }

  /**
   * 실행 기록 생성
   * @param execution 실행 데이터
   * @returns 생성된 실행 ID
   */
  static async createExecution(
    execution: Omit<FirestoreQueryExecution, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      // ID 생성
      const executionId = uuidv4();
      
      // 실행 데이터 준비
      const executionData: FirestoreQueryExecution = {
        ...execution,
        id: executionId,
        createdAt: serverTimestamp() as Timestamp,
      };

      // Firestore에 저장
      const executionRef = doc(db, EXECUTION_COLLECTION, executionId);
      await setDoc(executionRef, executionData);

      return executionId;
    } catch (error) {
      console.error('Error creating execution record:', error);
      throw error;
    }
  }

  /**
   * 실행 기록 업데이트
   * @param id 실행 ID
   * @param data 업데이트할 데이터
   */
  static async updateExecution(
    id: string,
    data: Partial<FirestoreQueryExecution>
  ): Promise<void> {
    try {
      // 업데이트 데이터 준비
      const updateData: Partial<FirestoreQueryExecution> = { ...data };

      // id, scheduledQueryId, createdAt은 업데이트하지 않음
      delete updateData.id;
      delete updateData.scheduledQueryId;
      delete updateData.createdAt;

      // Firestore 업데이트
      const executionRef = doc(db, EXECUTION_COLLECTION, id);
      await updateDoc(executionRef, updateData);
    } catch (error) {
      console.error('Error updating execution record:', error);
      throw error;
    }
  }

  /**
   * 쿼리별 실행 기록 조회
   * @param scheduledQueryId 스케줄링된 쿼리 ID
   * @param maxItems 최대 조회 수
   * @returns 실행 기록 목록
   */
  static async getExecutionHistory(
    scheduledQueryId: string,
    maxItems: number = 10
  ): Promise<FirestoreQueryExecution[]> {
    try {
      const executionQuery = query(
        collection(db, EXECUTION_COLLECTION),
        where('scheduledQueryId', '==', scheduledQueryId),
        orderBy('executionTime', 'desc'),
        limit(maxItems)
      );

      const snapshot = await getDocs(executionQuery);
      
      const executions: FirestoreQueryExecution[] = [];
      snapshot.forEach(doc => {
        executions.push(doc.data() as FirestoreQueryExecution);
      });

      return executions;
    } catch (error) {
      console.error('Error getting execution history:', error);
      throw error;
    }
  }

  /**
   * 스케줄링된 쿼리의 활성화/비활성화
   * @param id 쿼리 ID
   * @param active 활성화 여부
   */
  static async setActiveStatus(id: string, active: boolean): Promise<void> {
    await this.update(id, { active });
  }

  /**
   * 마지막 실행 상태 업데이트
   * @param id 쿼리 ID
   * @param status 실행 상태
   */
  static async updateLastExecutionStatus(
    id: string,
    status: 'SUCCESS' | 'ERROR',
    executionTime: Timestamp
  ): Promise<void> {
    await this.update(id, {
      lastExecutionStatus: status,
      lastExecutionAt: executionTime,
    });
  }
}

// 기본 내보내기
export default ScheduledQueryModel;
